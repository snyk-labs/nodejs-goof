/**
 * Automation rules: condition evaluation and action execution.
 * Triggers: schedule (cron), todo.created, todo.updated.
 * Actions: send_webhook, update_todos.
 */

var mongoose = require('mongoose');
var Todo = mongoose.model('Todo');
var Rule = mongoose.model('Rule');
var cron = require('node-cron');
var webhookDelivery = require('./webhook-delivery');

var MAX_RULES_PER_WORKSPACE = 50;
var MAX_ACTIONS_PER_RULE = 5;
var BULK_UPDATE_LIMIT = 100;

var CONDITION_OPS = {
  eq: function (a, b) { return a == b; },
  neq: function (a, b) { return a != b; },
  in: function (a, b) { return Array.isArray(b) && b.indexOf(a) !== -1; },
  contains: function (a, b) {
    if (!Array.isArray(a)) return false;
    return a.indexOf(b) !== -1;
  },
  before: function (a, b) {
    var d = a instanceof Date ? a : new Date(a);
    var ref = b instanceof Date ? b : new Date(b);
    return !isNaN(d.getTime()) && !isNaN(ref.getTime()) && d < ref;
  },
  after: function (a, b) {
    var d = a instanceof Date ? a : new Date(a);
    var ref = b instanceof Date ? b : new Date(b);
    return !isNaN(d.getTime()) && !isNaN(ref.getTime()) && d > ref;
  },
};

function todoToContext(todo) {
  var content = todo.content;
  var contentStr = Buffer.isBuffer(content) ? content.toString('utf8') : (content || '');
  return {
    _id: todo._id,
    content: contentStr,
    due_date: todo.due_date,
    priority: todo.priority,
    tags: todo.tags || [],
    updated_at: todo.updated_at,
    workspace: todo.workspace,
  };
}

function evaluateConditions(conditions, context) {
  if (!Array.isArray(conditions) || conditions.length === 0) return true;
  for (var i = 0; i < conditions.length; i++) {
    var c = conditions[i];
    var field = c.field;
    var op = c.op;
    var value = c.value;
    if (!field || !op) continue;
    var fieldValue = context[field];
    if (field === 'due_date' && fieldValue && !(fieldValue instanceof Date)) {
      fieldValue = new Date(fieldValue);
    }
    var fn = CONDITION_OPS[op];
    if (!fn) continue;
    if (op === 'contains' && field === 'tags') {
      if (!fn(context.tags || [], value)) return false;
    } else if (!fn(fieldValue, value)) {
      return false;
    }
  }
  return true;
}

function buildTodoQueryFromConditions(conditions, workspaceId) {
  var query = { workspace: workspaceId, deleted_at: null };
  if (!Array.isArray(conditions) || conditions.length === 0) return query;
  conditions.forEach(function (c) {
    var field = c.field;
    var op = c.op;
    var value = c.value;
    if (!field || !op) return;
    if (field === 'priority' && op === 'eq') query.priority = value;
    else if (field === 'priority' && op === 'in') query.priority = { $in: value };
    else if (field === 'tags' && op === 'contains') query.tags = value;
    else if (field === 'due_date' && op === 'before') query.due_date = { $lt: new Date(value) };
    else if (field === 'due_date' && op === 'after') query.due_date = { $gt: new Date(value) };
  });
  return query;
}

function executeActions(workspaceId, context, actions, cb) {
  if (!Array.isArray(actions) || actions.length === 0) return cb && cb();
  var run = function (idx) {
    if (idx >= Math.min(actions.length, MAX_ACTIONS_PER_RULE)) return cb && cb();
    var action = actions[idx];
    var type = action.type;
    if (type === 'send_webhook' && action.url) {
      var payload = {
        event: 'rule.triggered',
        resourceType: 'todo',
        resourceId: context._id ? String(context._id) : '',
        workspaceId: String(workspaceId),
        data: context,
        timestamp: new Date().toISOString(),
      };
      webhookDelivery.enqueueUrl(action.url, action.secret || '', payload);
      run(idx + 1);
      return;
    }
    if (type === 'update_todos' && action.updates && context.conditions) {
      var query = buildTodoQueryFromConditions(context.conditions, workspaceId);
      Todo.find(query).limit(BULK_UPDATE_LIMIT).exec(function (err, todos) {
        if (err) return run(idx + 1);
        var update = { updated_at: new Date() };
        if (action.updates.priority) update.priority = action.updates.priority;
        if (action.updates.tags) update.tags = action.updates.tags;
        if (action.updates.due_date) update.due_date = new Date(action.updates.due_date);
        Todo.updateMany(query, { $set: update }).exec(function () {
          run(idx + 1);
        });
      });
      return;
    }
    run(idx + 1);
  };
  run(0);
}

function runRulesForTodo(workspaceId, trigger, todo, cb) {
  Rule.find({
    workspace: workspaceId,
    enabled: true,
    trigger: trigger,
  }).lean().exec(function (err, rules) {
    if (err || !rules.length) return cb && cb();
    var context = todoToContext(todo);
    rules.forEach(function (rule) {
      if (evaluateConditions(rule.conditions, context)) {
        context.conditions = rule.conditions;
        executeActions(workspaceId, context, rule.actions, function () {});
      }
    });
    cb && cb();
  });
}

var cronJob = null;

function startScheduler() {
  if (cronJob) return;
  cronJob = cron.schedule('* * * * *', function () {
    Rule.find({ enabled: true, trigger: 'schedule' }).lean().exec(function (err, rules) {
      if (err || !rules.length) return;
      var now = new Date();
      var minuteStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);
      var minuteEnd = minuteStart.getTime() + 60000;
      rules.forEach(function (rule) {
        if (!rule.schedule) return;
        try {
          if (!cron.validate(rule.schedule)) return;
          var schedule = cron.schedule(rule.schedule);
          var nextRun = schedule.next();
          if (!nextRun) return;
          var nextMs = nextRun.getTime ? nextRun.getTime() : nextRun;
          if (nextMs >= minuteStart.getTime() && nextMs < minuteEnd) {
            var query = buildTodoQueryFromConditions(rule.conditions || [], rule.workspace);
            Todo.find(query).limit(BULK_UPDATE_LIMIT).lean().exec(function (e, todos) {
              if (e) return;
              var context = { conditions: rule.conditions };
              executeActions(rule.workspace, context, rule.actions, function () {});
            });
          }
        } catch (_) {}
      });
    });
  });
}

function stopScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }
}

module.exports = {
  evaluateConditions: evaluateConditions,
  buildTodoQueryFromConditions: buildTodoQueryFromConditions,
  executeActions: executeActions,
  runRulesForTodo: runRulesForTodo,
  todoToContext: todoToContext,
  startScheduler: startScheduler,
  stopScheduler: stopScheduler,
  MAX_RULES_PER_WORKSPACE: MAX_RULES_PER_WORKSPACE,
  MAX_ACTIONS_PER_RULE: MAX_ACTIONS_PER_RULE,
};
