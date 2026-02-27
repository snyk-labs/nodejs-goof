/**
 * Mount all /api routes: workspaces, workspace-todos, audit, webhooks, rules.
 */

var express = require('express');
var workspaces = require('./workspaces');
var workspaceTodos = require('./workspace-todos');
var audit = require('./audit');
var webhooks = require('./webhooks');
var rules = require('./rules');

var router = express.Router();

router.use('/workspaces', workspaces);
router.use('/workspaces', workspaceTodos);
router.use('/workspaces', audit);
router.use('/workspaces', webhooks);
router.use('/workspaces', rules);

module.exports = router;
