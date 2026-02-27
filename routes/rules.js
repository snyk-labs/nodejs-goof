/**
 * REST API: Automation rules for a workspace.
 * POST/GET/PATCH/DELETE /api/workspaces/:workspaceId/rules
 */

var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var { body, param, validationResult } = require('express-validator');
var Rule = mongoose.model('Rule');
var apiAuth = require('../middleware/api-auth');
var workspaceAuth = require('../services/workspace-auth');
var ruleEngine = require('../services/rule-engine');

var TRIGGERS = ['schedule', 'todo.created', 'todo.updated'];
var MAX_RULES = ruleEngine.MAX_RULES_PER_WORKSPACE;
var MAX_ACTIONS = ruleEngine.MAX_ACTIONS_PER_RULE;

function handleValidation(req, res) {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return null;
}

function validateConditions(conditions) {
  if (!Array.isArray(conditions)) return 'conditions must be an array';
  var maxConditions = 20;
  if (conditions.length > maxConditions) return 'Too many conditions (max ' + maxConditions + ')';
  for (var i = 0; i < conditions.length; i++) {
    var c = conditions[i];
    if (!c || typeof c !== 'object' || typeof c.field !== 'string' || !c.op) return 'Each condition must have field and op';
    if (['eq', 'neq', 'in', 'contains', 'before', 'after'].indexOf(c.op) === -1) {
      return 'Invalid op: ' + c.op;
    }
  }
  return null;
}

function validateActions(actions) {
  if (!Array.isArray(actions)) return 'actions must be an array';
  if (actions.length > MAX_ACTIONS) return 'At most ' + MAX_ACTIONS + ' actions per rule';
  for (var i = 0; i < actions.length; i++) {
    var a = actions[i];
    if (!a || !a.type) return 'Each action must have type';
    if (a.type === 'send_webhook' && !a.url) return 'send_webhook action requires url';
    if (a.type === 'update_todos' && !a.updates) return 'update_todos action requires updates object';
  }
  return null;
}

router.use(apiAuth.setApiUser);
router.use(apiAuth.requireApiUser);

router.param('workspaceId', function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid workspace ID' });
  }
  req.workspaceIdParam = id;
  next();
});

router.use('/:workspaceId/rules', workspaceAuth.requireMember);
router.use('/:workspaceId/rules', workspaceAuth.requireAdminRole);
router.use('/:workspaceId/rules', function (req, res, next) {
  req.workspaceId = req.workspaceIdParam || req.params.workspaceId;
  next();
});

router.post(
  '/:workspaceId/rules',
  [
    body('name').notEmpty().withMessage('name is required').trim().isLength({ max: 200 }),
    body('enabled').optional().isBoolean(),
    body('trigger').isIn(TRIGGERS).withMessage('trigger must be schedule, todo.created, or todo.updated'),
    body('schedule').optional().trim(),
    body('conditions').optional().isArray(),
    body('actions').optional().isArray(),
  ],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var workspaceId = req.workspaceId;
    var condErr = validateConditions(req.body.conditions || []);
    if (condErr) return res.status(400).json({ error: condErr });
    var actErr = validateActions(req.body.actions || []);
    if (actErr) return res.status(400).json({ error: actErr });
    if (req.body.trigger === 'schedule' && !(req.body.schedule && req.body.schedule.trim())) {
      return res.status(400).json({ error: 'schedule (cron expression) is required when trigger is schedule' });
    }
    if (req.body.trigger === 'schedule') {
      try {
        require('node-cron').validate(req.body.schedule);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid cron expression: ' + e.message });
      }
    }
    var workspaceObjId = new mongoose.Types.ObjectId(workspaceId);
    Rule.countDocuments({ workspace: workspaceObjId }).exec(function (err, count) {
      if (err) return next(err);
      if (count >= MAX_RULES) {
        return res.status(400).json({ error: 'Maximum ' + MAX_RULES + ' rules per workspace' });
      }
      var rule = new Rule({
        workspace: workspaceObjId,
        name: req.body.name.trim(),
        enabled: req.body.enabled !== false,
        trigger: req.body.trigger,
        schedule: (req.body.schedule && req.body.schedule.trim()) || null,
        conditions: req.body.conditions || [],
        actions: req.body.actions || [],
      });
      rule.save(function (err2, saved) {
        if (err2) return next(err2);
        res.status(201).json(ruleToJson(saved));
      });
    });
  }
);

router.get('/:workspaceId/rules', function (req, res, next) {
  var workspaceId = req.workspaceId;
  Rule.find({ workspace: workspaceId }).lean().exec(function (err, rules) {
    if (err) return next(err);
    res.json({ rules: (rules || []).map(ruleToJson) });
  });
});

function ruleToJson(r) {
  return {
    id: r._id,
    name: r.name,
    enabled: r.enabled,
    trigger: r.trigger,
    schedule: r.schedule,
    conditions: r.conditions,
    actions: r.actions,
  };
}

router.get(
  '/:workspaceId/rules/:id',
  [param('id').isMongoId()],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var workspaceId = req.workspaceId;
    var id = req.params.id;
    var idObj = new mongoose.Types.ObjectId(id);
    var workspaceObjId = new mongoose.Types.ObjectId(workspaceId);
    Rule.findOne({ _id: idObj, workspace: workspaceObjId }).lean().exec(function (err, rule) {
      if (err) return next(err);
      if (!rule) return res.status(404).json({ error: 'Rule not found' });
      res.json(ruleToJson(rule));
    });
  }
);

router.patch(
  '/:workspaceId/rules/:id',
  [
    param('id').isMongoId(),
    body('name').optional().trim().isLength({ max: 200 }),
    body('enabled').optional().isBoolean(),
    body('schedule').optional().trim(),
    body('conditions').optional().isArray(),
    body('actions').optional().isArray(),
  ],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var condErr = req.body.conditions !== undefined ? validateConditions(req.body.conditions) : null;
    if (condErr) return res.status(400).json({ error: condErr });
    var actErr = req.body.actions !== undefined ? validateActions(req.body.actions) : null;
    if (actErr) return res.status(400).json({ error: actErr });
    var workspaceId = req.workspaceId;
    var id = req.params.id;
    Rule.findOne({ _id: id, workspace: workspaceId }).exec(function (err, rule) {
      if (err) return next(err);
      if (!rule) return res.status(404).json({ error: 'Rule not found' });
      if (req.body.name !== undefined) rule.name = req.body.name.trim();
      if (req.body.enabled !== undefined) rule.enabled = req.body.enabled;
      if (req.body.schedule !== undefined) rule.schedule = req.body.schedule && req.body.schedule.trim() ? req.body.schedule.trim() : null;
      if (req.body.conditions !== undefined) rule.conditions = req.body.conditions;
      if (req.body.actions !== undefined) rule.actions = req.body.actions;
      rule.save(function (err2, updated) {
        if (err2) return next(err2);
        res.json(ruleToJson(updated));
      });
    });
  }
);

router.delete(
  '/:workspaceId/rules/:id',
  [param('id').isMongoId()],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var workspaceId = req.workspaceId;
    var id = req.params.id;
    var idObj = new mongoose.Types.ObjectId(id);
    var workspaceObjId = new mongoose.Types.ObjectId(workspaceId);
    Rule.findOneAndDelete({ _id: idObj, workspace: workspaceObjId }).exec(function (err, removed) {
      if (err) return next(err);
      if (!removed) return res.status(404).json({ error: 'Rule not found' });
      res.status(204).send();
    });
  }
);

module.exports = router;
