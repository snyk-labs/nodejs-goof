/**
 * REST API: Workspace-scoped Todos.
 * GET/POST /api/workspaces/:workspaceId/todos, GET/PATCH/DELETE /api/workspaces/:workspaceId/todos/:id
 */

var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var { body, param, query, validationResult } = require('express-validator');
var Todo = mongoose.model('Todo');
var apiAuth = require('../middleware/api-auth');
var workspaceAuth = require('../services/workspace-auth');
var auditService = require('../services/audit');
var webhookDelivery = require('../services/webhook-delivery');
var ruleEngine = require('../services/rule-engine');

var VALID_PRIORITIES = ['low', 'medium', 'high'];
var DEFAULT_PAGE = 1;
var DEFAULT_LIMIT = 20;
var MAX_LIMIT = 100;

function handleValidation(req, res) {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return null;
}

function todoToJson(todo) {
  var content = todo.content;
  var contentStr = Buffer.isBuffer(content) ? content.toString('utf8') : (content || '');
  return {
    id: todo._id,
    content: contentStr,
    due_date: todo.due_date,
    priority: todo.priority,
    tags: todo.tags || [],
    updated_at: todo.updated_at,
    workspace: todo.workspace,
  };
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

router.use('/:workspaceId', workspaceAuth.requireMember);
router.use('/:workspaceId', function (req, res, next) {
  req.workspaceId = req.workspaceIdParam || req.params.workspaceId;
  next();
});

router.get(
  '/:workspaceId/todos',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
    query('sort').optional().matches(/^-?(updated_at|due_date|priority)$/),
    query('priority').optional().isIn(VALID_PRIORITIES),
    query('tags').optional().trim(),
    query('dueBefore').optional().isISO8601(),
    query('dueAfter').optional().isISO8601(),
    query('search').optional().trim().isLength({ max: 500 }),
  ],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var workspaceId = req.workspaceId;
    var membership = req.workspaceMembership;
    if (membership.role === 'viewer') {
    }
    var page = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE);
    var limit = Math.min(MAX_LIMIT, parseInt(req.query.limit, 10) || DEFAULT_LIMIT);
    var sortStr = (typeof req.query.sort === 'string' && /^-?(updated_at|due_date|priority)$/.test(req.query.sort.trim())) ? req.query.sort.trim() : '-updated_at';
    var sortObj = {};
    if (sortStr.charAt(0) === '-') {
      sortObj[sortStr.slice(1)] = -1;
    } else {
      sortObj[sortStr] = 1;   
    }
    var q = { workspace: workspaceId, deleted_at: null };
    if (typeof req.query.priority === 'string' && VALID_PRIORITIES.indexOf(req.query.priority) !== -1) q.priority = req.query.priority;
    if (typeof req.query.tags === 'string') {
      var tags = req.query.tags.split(',').map(function (t) { return String(t).trim(); }).filter(Boolean);
      if (tags.length) q.tags = { $all: tags };
    }
    if (req.query.dueBefore || req.query.dueAfter) {
      q.due_date = q.due_date || {};
      if (req.query.dueBefore) q.due_date.$lt = new Date(req.query.dueBefore);
      if (req.query.dueAfter) q.due_date.$gt = new Date(req.query.dueAfter);
    }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      q.content_str = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    }
    var workspaceObjId = new mongoose.Types.ObjectId(workspaceId);
    var qSafe = Object.assign({}, q, { workspace: workspaceObjId });
    Todo.countDocuments(qSafe).exec(function (err, total) {
      if (err) return next(err);
      Todo.find(qSafe)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(function (err2, todos) {
          if (err2) return next(err2);
          var items = (todos || []).map(function (t) {
            var contentStr = Buffer.isBuffer(t.content) ? t.content.toString('utf8') : (t.content || '');
            return {
              id: t._id,
              content: contentStr,
              due_date: t.due_date,
              priority: t.priority,
              tags: t.tags || [],
              updated_at: t.updated_at,
              workspace: t.workspace,
            };
          });
          res.json({
            todos: items,
            meta: { total: total, page: page, limit: limit },
          });
        });
    });
  }
);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.post(
  '/:workspaceId/todos',
  [
    body('content').notEmpty().withMessage('content is required').trim().isLength({ max: 10000 }),
    body('due_date').optional({ values: 'falsy' }).isISO8601(),
    body('priority').optional().isIn(VALID_PRIORITIES),
    body('tags').optional(),
  ],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    if (req.workspaceMembership.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot create todos' });
    }
    var workspaceId = req.workspaceId;
    var content = req.body.content.trim();
    var due_date = req.body.due_date ? new Date(req.body.due_date) : undefined;
    var priority = req.body.priority || undefined;
    var tags = Array.isArray(req.body.tags) ? req.body.tags : (req.body.tags ? [].concat(req.body.tags) : []);
    tags = tags.map(function (t) { return String(t).trim(); }).filter(Boolean);
    var todo = new Todo({
      content: Buffer.from(content, 'utf8'),
      content_str: content,
      due_date: due_date,
      priority: priority,
      tags: tags,
      updated_at: new Date(),
      workspace: workspaceId,
    });
    todo.save(function (err, saved) {
      if (err) return next(err);
      auditService.createEvent({
        workspace: workspaceId,
        actor: req.apiUserId,
        action: 'todo.created',
        resourceType: 'todo',
        resourceId: String(saved._id),
        details: { content: content.substring(0, 200) },
        ip: req.ip,
      });
      webhookDelivery.notifyWebhooks(workspaceId, 'todo.created', {
        resourceId: String(saved._id),
        data: todoToJson(saved),
      });
      ruleEngine.runRulesForTodo(workspaceId, 'todo.created', saved, function () {});
      res.status(201).json(todoToJson(saved));
    });
  }
);

router.get(
  '/:workspaceId/todos/:id',
  [param('id').isMongoId()],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var workspaceId = req.workspaceId;
    var id = req.params.id;
    var idObj = new mongoose.Types.ObjectId(id);
    var workspaceObjId = new mongoose.Types.ObjectId(workspaceId);
    Todo.findOne({ _id: idObj, workspace: workspaceObjId, deleted_at: null }).exec(function (err, todo) {
      if (err) return next(err);
      if (!todo) return res.status(404).json({ error: 'Todo not found' });
      res.json(todoToJson(todo));
    });
  }
);

router.patch(
  '/:workspaceId/todos/:id',
  [
    param('id').isMongoId(),
    body('content').optional().trim().isLength({ max: 10000 }),
    body('due_date').optional({ values: 'falsy' }).isISO8601(),
    body('priority').optional().isIn(VALID_PRIORITIES),
    body('tags').optional(),
  ],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    if (req.workspaceMembership.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot update todos' });
    }
    var workspaceId = req.workspaceId;
    var id = req.params.id;
    var idObj = new mongoose.Types.ObjectId(id);
    var workspaceObjId = new mongoose.Types.ObjectId(workspaceId);
    Todo.findOne({ _id: idObj, workspace: workspaceObjId, deleted_at: null }).exec(function (err, todo) {
      if (err) return next(err);
      if (!todo) return res.status(404).json({ error: 'Todo not found' });
      if (req.body.content !== undefined) {
        todo.content = Buffer.from(req.body.content.trim(), 'utf8');
        todo.content_str = req.body.content.trim();
      }
      if (req.body.due_date !== undefined) todo.due_date = req.body.due_date ? new Date(req.body.due_date) : null;
      if (req.body.priority !== undefined) todo.priority = req.body.priority;
      if (req.body.tags !== undefined) {
        var tags = Array.isArray(req.body.tags) ? req.body.tags : [].concat(req.body.tags || []);
        todo.tags = tags.map(function (t) { return String(t).trim(); }).filter(Boolean);
      }
      todo.updated_at = new Date();
      todo.save(function (err2, updated) {
        if (err2) return next(err2);
        auditService.createEvent({
          workspace: workspaceId,
          actor: req.apiUserId,
          action: 'todo.updated',
          resourceType: 'todo',
          resourceId: String(updated._id),
          details: {},
          ip: req.ip,
        });
        webhookDelivery.notifyWebhooks(workspaceId, 'todo.updated', {
          resourceId: String(updated._id),
          data: todoToJson(updated),
        });
        ruleEngine.runRulesForTodo(workspaceId, 'todo.updated', updated, function () {});
        res.json(todoToJson(updated));
      });
    });
  }
);

router.delete(
  '/:workspaceId/todos/:id',
  [param('id').isMongoId()],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    if (req.workspaceMembership.role === 'viewer') {
      return res.status(403).json({ error: 'Viewers cannot delete todos' });
    }
    var workspaceId = req.workspaceId;
    var id = req.params.id;
    var idObj = new mongoose.Types.ObjectId(id);
    var workspaceObjId = new mongoose.Types.ObjectId(workspaceId);
    Todo.findOne({ _id: idObj, workspace: workspaceObjId, deleted_at: null }).exec(function (err, todo) {
      if (err) return next(err);
      if (!todo) return res.status(404).json({ error: 'Todo not found' });
      todo.deleted_at = new Date();
      todo.save(function (err2, updated) {
        if (err2) return next(err2);
        auditService.createEvent({
          workspace: workspaceId,
          actor: req.apiUserId,
          action: 'todo.deleted',
          resourceType: 'todo',
          resourceId: String(updated._id),
          details: {},
          ip: req.ip,
        });
        webhookDelivery.notifyWebhooks(workspaceId, 'todo.deleted', {
          resourceId: String(updated._id),
          data: todoToJson(updated),
        });
        res.status(204).send();
      });
    });
  }
);

module.exports = router;
