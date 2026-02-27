/**
 * REST API: Audit log for a workspace.
 * GET /api/workspaces/:workspaceId/audit
 */

var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var { param, query, validationResult } = require('express-validator');
var AuditEvent = mongoose.model('AuditEvent');
var apiAuth = require('../middleware/api-auth');
var workspaceAuth = require('../services/workspace-auth');

var DEFAULT_PAGE = 1;
var DEFAULT_LIMIT = 50;
var MAX_LIMIT = 100;

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

router.use('/:workspaceId/audit', workspaceAuth.requireMember);
router.use('/:workspaceId/audit', function (req, res, next) {
  req.workspaceId = req.workspaceIdParam || req.params.workspaceId;
  next();
});

router.get(
  '/:workspaceId/audit',
  [
    query('action').optional().trim().isLength({ max: 100 }),
    query('resourceType').optional().isIn(['todo', 'workspace', 'member']),
    query('actor').optional().trim().isLength({ max: 200 }),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }).toInt(),
  ],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var workspaceId = req.workspaceId;
    var page = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE);
    var limit = Math.min(MAX_LIMIT, parseInt(req.query.limit, 10) || DEFAULT_LIMIT);
    var workspaceObjId = new mongoose.Types.ObjectId(workspaceId);
    var q = { workspace: workspaceObjId };
    if (typeof req.query.action === 'string' && req.query.action.trim()) q.action = req.query.action.trim();
    if (typeof req.query.resourceType === 'string' && ['todo', 'workspace', 'member'].indexOf(req.query.resourceType) !== -1) q.resourceType = req.query.resourceType;
    if (typeof req.query.actor === 'string' && req.query.actor.trim()) q.actor = req.query.actor.trim();
    if (req.query.from || req.query.to) {
      q.createdAt = {};
      if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) q.createdAt.$lte = new Date(req.query.to);
    }
    AuditEvent.countDocuments(q).exec(function (err, total) {
      if (err) return next(err);
      AuditEvent.find(q)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(function (err2, events) {
          if (err2) return next(err2);
          res.json({
            events: (events || []).map(function (e) {
              return {
                id: e._id,
                workspace: e.workspace,
                actor: e.actor,
                action: e.action,
                resourceType: e.resourceType,
                resourceId: e.resourceId,
                details: e.details,
                ip: e.ip,
                createdAt: e.createdAt,
              };
            }),
            meta: { total: total, page: page, limit: limit },
          });
        });
    });
  }
);

module.exports = router;
