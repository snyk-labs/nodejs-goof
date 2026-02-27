/**
 * API authentication: resolve "current user" from X-User-Id header or session.
 * All /api/* workspace and todo endpoints should use requireApiUser to ensure a user is set.
 */

function getApiUserId(req) {
  var headerId = req.get && req.get('X-User-Id');
  if (headerId && typeof headerId === 'string' && headerId.trim()) {
    return headerId.trim();
  }
  if (req.session && req.session.loggedIn === 1 && req.session.username) {
    return req.session.username;
  }
  return null;
}

/**
 * Middleware: set req.apiUserId. Does not reject if missing (call requireApiUser for that).
 */
function setApiUser(req, res, next) {
  req.apiUserId = getApiUserId(req);
  next();
}

/**
 * Middleware: require that a current user is present. Responds 401 if not.
 */
function requireApiUser(req, res, next) {
  if (!req.apiUserId) {
    return res.status(401).json({ error: 'Authentication required. Set X-User-Id header or log in via session.' });
  }
  next();
}

module.exports = {
  getApiUserId: getApiUserId,
  setApiUser: setApiUser,
  requireApiUser: requireApiUser,
};
