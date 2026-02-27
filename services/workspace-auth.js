/**
 * Workspace membership and role checks for API.
 */

var mongoose = require('mongoose');
var Workspace = mongoose.model('Workspace');
var WorkspaceMember = mongoose.model('WorkspaceMember');

var ROLES_WITH_WRITE = ['owner', 'admin', 'member'];
var ROLES_WITH_ADMIN = ['owner', 'admin'];

function getMembership(workspaceId, userId) {
  if (!workspaceId || !userId) return Promise.resolve(null);
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) return Promise.resolve(null);
  var wid = typeof workspaceId === 'string' ? workspaceId : String(workspaceId);
  var uid = typeof userId === 'string' ? userId : String(userId);
  return WorkspaceMember.findOne({
    workspace: new mongoose.Types.ObjectId(wid),
    user: uid,
  }).lean().exec();
}

function requireMember(req, res, next) {
  var workspaceId = req.params.workspaceId || req.params.id;
  var userId = req.apiUserId;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return res.status(400).json({ error: 'Invalid workspace ID' });
  }
  getMembership(workspaceId, userId).then(function (membership) {
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }
    req.workspaceMembership = membership;
    req.workspaceId = membership.workspace;
    next();
  }).catch(function (err) {
    next(err);
  });
}

function requireRole(allowedRoles) {
  return function (req, res, next) {
    var membership = req.workspaceMembership;
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }
    if (!allowedRoles.includes(membership.role)) {
      return res.status(403).json({ error: 'Insufficient role. Required: ' + allowedRoles.join(' or ') });
    }
    next();
  };
}

function requireWriteRole(req, res, next) {
  return requireRole(ROLES_WITH_WRITE)(req, res, next);
}

function requireAdminRole(req, res, next) {
  return requireRole(ROLES_WITH_ADMIN)(req, res, next);
}

module.exports = {
  getMembership: getMembership,
  requireMember: requireMember,
  requireRole: requireRole,
  requireWriteRole: requireWriteRole,
  requireAdminRole: requireAdminRole,
  ROLES_WITH_WRITE: ROLES_WITH_WRITE,
  ROLES_WITH_ADMIN: ROLES_WITH_ADMIN,
};
