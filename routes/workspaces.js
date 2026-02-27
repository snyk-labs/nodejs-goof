/**
 * REST API: Workspaces and members.
 * POST /api/workspaces, GET /api/workspaces, GET/PATCH /api/workspaces/:id
 * POST /api/workspaces/:id/members, DELETE /api/workspaces/:id/members/:userId
 */

var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var { body, param, validationResult } = require('express-validator');
var Workspace = mongoose.model('Workspace');
var WorkspaceMember = mongoose.model('WorkspaceMember');
var apiAuth = require('../middleware/api-auth');
var workspaceAuth = require('../services/workspace-auth');
var auditService = require('../services/audit');
var webhookDelivery = require('../services/webhook-delivery');

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function handleValidation(req, res) {
  var errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  return null;
}

router.use(apiAuth.setApiUser);
router.use(apiAuth.requireApiUser);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 200 }),
    body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('slug must be URL-safe (a-z, 0-9, -)'),
  ],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var name = req.body.name.trim();
    var slug = req.body.slug ? req.body.slug.trim() : slugify(name);
    if (!slug) {
      return res.status(400).json({ error: 'slug could not be derived from name; provide slug explicitly' });
    }
    var userId = req.apiUserId;
    var workspace = new Workspace({ name: name, slug: slug });
    workspace.save(function (err, ws) {
      if (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Workspace slug already exists' });
        return next(err);
      }
      var member = new WorkspaceMember({ workspace: ws._id, user: userId, role: 'owner' });
      member.save(function (err2) {
        if (err2) return next(err2);
        auditService.createEvent({
          workspace: ws._id,
          actor: userId,
          action: 'workspace.created',
          resourceType: 'workspace',
          resourceId: String(ws._id),
          details: { name: name, slug: slug },
          ip: req.ip,
        });
        res.status(201).json({
          id: ws._id,
          name: ws.name,
          slug: ws.slug,
          createdAt: ws.createdAt,
          settings: ws.settings,
        });
      });
    });
  }
);

router.get('/', function (req, res, next) {
  var userId = req.apiUserId;
  WorkspaceMember.find({ user: userId })
    .populate('workspace')
    .lean()
    .exec(function (err, memberships) {
      if (err) return next(err);
      var workspaces = (memberships || [])
        .filter(function (m) { return m.workspace; })
        .map(function (m) {
          var ws = m.workspace;
          return {
            id: ws._id,
            name: ws.name,
            slug: ws.slug,
            createdAt: ws.createdAt,
            settings: ws.settings,
            role: m.role,
          };
        });
      res.json({ workspaces: workspaces });
    });
});

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid workspace ID')],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var id = req.params.id;
    var userId = req.apiUserId;
    workspaceAuth.getMembership(id, userId).then(function (membership) {
      if (!membership) {
        res.status(403).json({ error: 'Not a member of this workspace' });
        return null;
      }
      return Workspace.findById(id).lean().exec();
    }).then(function (ws) {
      if (!ws) {
        if (!res.headersSent) res.status(404).json({ error: 'Workspace not found' });
        return null;
      }
      res.json({
        id: ws._id,
        name: ws.name,
        slug: ws.slug,
        createdAt: ws.createdAt,
        settings: ws.settings,
      });
    }).catch(next);
  }
);

router.patch(
  '/:id',
  [param('id').isMongoId()],
  body('name').optional().trim().isLength({ max: 200 }),
  body('settings').optional().isObject(),
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var id = req.params.id;
    var userId = req.apiUserId;
    workspaceAuth.getMembership(id, userId).then(function (membership) {
      if (!membership) {
        res.status(403).json({ error: 'Not a member of this workspace' });
        return null;
      }
      if (!workspaceAuth.ROLES_WITH_ADMIN.includes(membership.role)) {
        res.status(403).json({ error: 'Only owner or admin can update workspace' });
        return null;
      }
      return Workspace.findById(id).exec();
    }).then(function (ws) {
      if (!ws) {
        res.status(404).json({ error: 'Workspace not found' });
        return null;
      }
      if (req.body.name !== undefined) ws.name = req.body.name.trim();
      if (req.body.settings !== undefined) ws.settings = req.body.settings;
      return ws.save();
    }).then(function (ws) {
      if (!ws) return null;
      auditService.createEvent({
        workspace: ws._id,
        actor: userId,
        action: 'workspace.updated',
        resourceType: 'workspace',
        resourceId: String(ws._id),
        details: { name: ws.name, settings: ws.settings },
        ip: req.ip,
      });
      webhookDelivery.notifyWebhooks(ws._id, 'workspace.updated', { resourceId: String(ws._id), data: { name: ws.name } });
      res.json({ id: ws._id, name: ws.name, slug: ws.slug, createdAt: ws.createdAt, settings: ws.settings });
      return null;
    }).catch(next);
  }
);

router.post(
  '/:id/members',
  [
    param('id').isMongoId(),
    body('user').notEmpty().withMessage('user (email or id) is required').trim(),
    body('role').isIn(['admin', 'member', 'viewer']).withMessage('role must be admin, member, or viewer'),
  ],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var workspaceId = req.params.id;
    var userId = req.apiUserId;
    var newUser = req.body.user.trim();
    var role = req.body.role;
    workspaceAuth.getMembership(workspaceId, userId).then(function (membership) {
      if (!membership) return res.status(403).json({ error: 'Not a member of this workspace' });
      if (!workspaceAuth.ROLES_WITH_ADMIN.includes(membership.role)) {
        return res.status(403).json({ error: 'Only owner or admin can add members' });
      }
      return WorkspaceMember.findOne({ workspace: workspaceId, user: newUser }).exec();
    }).then(function (existing) {
      if (existing) return res.status(409).json({ error: 'User is already a member' });
      var member = new WorkspaceMember({ workspace: workspaceId, user: newUser, role: role });
      return member.save();
    }).then(function (member) {
      auditService.createEvent({
        workspace: workspaceId,
        actor: userId,
        action: 'member.added',
        resourceType: 'member',
        resourceId: String(member._id),
        details: { user: newUser, role: role },
        ip: req.ip,
      });
      webhookDelivery.notifyWebhooks(workspaceId, 'member.added', { resourceId: String(member._id), data: { user: newUser, role } });
      res.status(201).json({ id: member._id, workspace: workspaceId, user: newUser, role: role });
    }).catch(next);
  }
);

router.delete(
  '/:id/members/:userId',
  [param('id').isMongoId(), param('userId').notEmpty().trim()],
  function (req, res, next) {
    var v = handleValidation(req, res);
    if (v) return v;
    var workspaceId = req.params.id;
    var targetUserId = req.params.userId;
    var actorId = req.apiUserId;
    workspaceAuth.getMembership(workspaceId, actorId).then(function (membership) {
      if (!membership) return res.status(403).json({ error: 'Not a member of this workspace' });
      if (!workspaceAuth.ROLES_WITH_ADMIN.includes(membership.role)) {
        return res.status(403).json({ error: 'Only owner or admin can remove members' });
      }
      if (targetUserId === actorId && membership.role === 'owner') {
        return res.status(400).json({ error: 'Owner cannot remove themselves; transfer ownership first' });
      }
      return WorkspaceMember.findOneAndDelete({ workspace: workspaceId, user: targetUserId }).exec();
    }).then(function (removed) {
      if (!removed) return res.status(404).json({ error: 'Member not found' });
      auditService.createEvent({
        workspace: workspaceId,
        actor: actorId,
        action: 'member.removed',
        resourceType: 'member',
        resourceId: targetUserId,
        details: { removedUser: targetUserId },
        ip: req.ip,
      });
      res.status(204).send();
    }).catch(next);
  }
);

module.exports = router;
