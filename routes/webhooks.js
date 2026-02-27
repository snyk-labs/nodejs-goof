/**
 * REST API: Webhooks for a workspace.
 * POST /api/workspaces/:workspaceId/webhooks, GET /api/workspaces/:workspaceId/webhooks, DELETE /api/workspaces/:workspaceId/webhooks/:id
 */

var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var { body, param, validationResult } = require('express-validator');
var Webhook = mongoose.model('Webhook');
var apiAuth = require('../middleware/api-auth');
var workspaceAuth = require('../services/workspace-auth');

var EVENT_NAMES = ['todo.created', 'todo.updated', 'todo.deleted', 'workspace.updated', 'member.added'];

function handleValidation(req, res) {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
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

router.use('/:workspaceId/webhooks', workspaceAuth.requireMember);
router.use('/:workspaceId/webhooks', workspaceAuth.requireAdminRole);
router.use('/:workspaceId/webhooks', function (req, res, next) {
  req.workspaceId = req.workspaceIdParam || req.params.workspaceId;
  next();
});

router.post(
  '/:workspaceId/webhooks',
  [
    body('url').notEmpty().withMessage('url is required').trim().isURL({ require_tld: false }),
    body('secret').optional().trim(),
    body('events').optional().isArray(),
    body('events.*').optional().isIn(EVENT_NAMES),
    body('active').optional().isBoolean(),
  ],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var workspaceId = req.workspaceId;
    var url = req.body.url.trim();
    var secret = req.body.secret && req.body.secret.trim() ? req.body.secret.trim() : crypto.randomBytes(24).toString('hex');
    var events = Array.isArray(req.body.events) ? req.body.events : EVENT_NAMES.slice();
    events = events.filter(function (e) { return EVENT_NAMES.indexOf(e) !== -1; });
    if (events.length === 0) events = EVENT_NAMES.slice();
    var active = req.body.active !== false;
    var webhook = new Webhook({
      workspace: workspaceId,
      url: url,
      secret: secret,
      events: events,
      active: active,
    });
    webhook.save(function (err, saved) {
      if (err) return next(err);
      res.status(201).json({
        id: saved._id,
        url: saved.url,
        events: saved.events,
        active: saved.active,
        createdAt: saved.createdAt,
      });
    });
  }
);

router.get('/:workspaceId/webhooks', function (req, res, next) {
  var workspaceId = req.workspaceId;
  Webhook.find({ workspace: workspaceId })
    .select('-secret')
    .lean()
    .exec(function (err, webhooks) {
      if (err) return next(err);
      res.json({
        webhooks: (webhooks || []).map(function (w) {
          return {
            id: w._id,
            url: w.url,
            events: w.events,
            active: w.active,
            createdAt: w.createdAt,
            lastFailure: w.lastFailure,
          };
        }),
      });
    });
});

router.delete(
  '/:workspaceId/webhooks/:id',
  [param('id').isMongoId()],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var workspaceId = req.workspaceId;
    var id = req.params.id;
    var idObj = new mongoose.Types.ObjectId(id);
    var workspaceObjId = new mongoose.Types.ObjectId(workspaceId);
    Webhook.findOneAndDelete({ _id: idObj, workspace: workspaceObjId }).exec(function (err, removed) {
      if (err) return next(err);
      if (!removed) return res.status(404).json({ error: 'Webhook not found' });
      res.status(204).send();
    });
  }
);

module.exports = router;
