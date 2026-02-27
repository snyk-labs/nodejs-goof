#!/usr/bin/env node
/**
 * Optional: Delete audit events older than a retention period (e.g. 90 days).
 * Run via: node scripts/audit-retention.js [days]
 * Default: 90 days.
 */

var mongoose = require('mongoose');
require('../mongoose-db');
var AuditEvent = mongoose.model('AuditEvent');

var retentionDays = parseInt(process.argv[2], 10) || 90;
var cutoff = new Date();
cutoff.setDate(cutoff.getDate() - retentionDays);

AuditEvent.deleteMany({ createdAt: { $lt: cutoff } }).exec(function (err, result) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Deleted ' + (result && result.deletedCount) + ' audit events older than ' + retentionDays + ' days.');
  process.exit(0);
});
