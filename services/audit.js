/**
 * Audit log: create events for workspace/todo/member mutations.
 */

var mongoose = require('mongoose');
var AuditEvent = mongoose.model('AuditEvent');

function createEvent(options, cb) {
  var doc = {
    workspace: options.workspace,
    actor: options.actor,
    action: options.action,
    resourceType: options.resourceType,
    resourceId: options.resourceId,
    details: options.details || {},
    ip: options.ip || null,
  };
  var event = new AuditEvent(doc);
  event.save(function (err, saved) {
    if (cb) cb(err, saved);
  });
}

function createEventPromise(options) {
  return new Promise(function (resolve, reject) {
    createEvent(options, function (err, saved) {
      if (err) reject(err);
      else resolve(saved);
    });
  });
}

module.exports = {
  createEvent: createEvent,
  createEventPromise: createEventPromise,
};
