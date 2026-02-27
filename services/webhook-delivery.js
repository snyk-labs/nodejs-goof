/**
 * Webhook delivery: in-memory queue and worker. POST to URL with HMAC signature.
 * Payload max 100kb, timeout 15s. Retry up to 3 times with backoff.
 */

var crypto = require('crypto');
var mongoose = require('mongoose');
var Webhook = mongoose.model('Webhook');
var WebhookDelivery = mongoose.model('WebhookDelivery');
var https = require('https');
var http = require('http');
var url = require('url');

var PAYLOAD_MAX_BYTES = 100 * 1024;
var REQUEST_TIMEOUT_MS = 15000;
var MAX_RETRIES = 3;
var BACKOFF_BASE_MS = 1000;

var queue = [];
var processing = false;
var MAX_QUEUE = 1000;

function signPayload(secret, body) {
  var bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  var hmac = crypto.createHmac('sha256', secret || '');
  hmac.update(bodyStr);
  return 'sha256=' + hmac.digest('hex');
}

function enqueue(webhookId, event, payload) {
  if (queue.length >= MAX_QUEUE) return;
  var bodyStr = JSON.stringify(payload);
  if (Buffer.byteLength(bodyStr, 'utf8') > PAYLOAD_MAX_BYTES) {
    bodyStr = JSON.stringify({
      event: payload.event,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      workspaceId: payload.workspaceId,
      timestamp: payload.timestamp,
      data: { truncated: true, reason: 'Payload exceeded size limit' },
    });
  }
  queue.push({
    webhookId: webhookId,
    event: event,
    body: bodyStr,
    payload: payload,
  });
  drain();
}

/**
 * Enqueue delivery to a raw URL (e.g. from rule action). webhookId may be null; url and optional secret provided.
 */
function enqueueUrl(urlStr, secret, payload) {
  if (queue.length >= MAX_QUEUE) return;
  var bodyStr = JSON.stringify(payload);
  if (Buffer.byteLength(bodyStr, 'utf8') > PAYLOAD_MAX_BYTES) {
    bodyStr = JSON.stringify({
      event: payload.event,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      workspaceId: payload.workspaceId,
      timestamp: payload.timestamp,
      data: { truncated: true, reason: 'Payload exceeded size limit' },
    });
  }
  queue.push({
    webhookId: null,
    url: urlStr,
    secret: secret || '',
    event: payload.event || 'rule.triggered',
    body: bodyStr,
    payload: payload,
  });
  drain();
}

function drain() {
  if (processing || queue.length === 0) return;
  processing = true;
  var item = queue.shift();
  deliver(item, 0, function () {
    processing = false;
    if (queue.length > 0) setImmediate(drain);
  });
}

function deliver(item, attempt, done) {
  function doRequest(targetUrl, secret, webhookOrNull) {
    var signature = signPayload(secret, item.body);
    var parsed = url.parse(targetUrl);
    var isHttps = parsed.protocol === 'https:';
    var client = isHttps ? https : http;
    var options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.path || '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(item.body, 'utf8'),
        'X-Webhook-Signature': signature,
      },
    };
    var req = client.request(options, function (res) {
      var statusCode = res.statusCode;
      res.on('data', function () {});
      res.on('end', function () {
        if (statusCode >= 200 && statusCode < 300) {
          if (webhookOrNull) saveDelivery(webhookOrNull._id, webhookOrNull.url, 'success', statusCode, null, function () {});
        } else {
          var errMsg = 'HTTP ' + statusCode;
          if (webhookOrNull) {
            saveDelivery(webhookOrNull._id, webhookOrNull.url, 'failed', statusCode, errMsg, function () {});
            updateWebhookLastFailure(webhookOrNull, 'failed', statusCode, errMsg);
          }
          if (attempt < MAX_RETRIES - 1) {
            var delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
            setTimeout(function () { deliver(item, attempt + 1, done); }, delay);
            return;
          }
        }
        done();
      });
    });
    req.on('error', function (e) {
      if (webhookOrNull) {
        saveDelivery(webhookOrNull._id, webhookOrNull.url, 'failed', null, e.message, function () {});
        updateWebhookLastFailure(webhookOrNull, 'failed', null, e.message);
      }
      if (attempt < MAX_RETRIES - 1) {
        var delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
        setTimeout(function () { deliver(item, attempt + 1, done); }, delay);
        return;
      }
      done();
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, function () {
      req.destroy();
    });
    req.write(item.body);
    req.end();
  }
  if (item.webhookId) {
    Webhook.findById(item.webhookId).exec(function (err, webhook) {
      if (err || !webhook || !webhook.active) {
        processing = false;
        return done();
      }
      doRequest(webhook.url, webhook.secret, webhook);
    });
  } else if (item.url) {
    doRequest(item.url, item.secret || '', null);
  } else {
    processing = false;
    done();
  }
}

function saveDelivery(webhookId, urlStr, status, statusCode, error, cb) {
  var doc = {
    webhook: webhookId,
    url: urlStr,
    status: status,
    statusCode: statusCode || null,
    error: error || null,
  };
  WebhookDelivery.create(doc, cb);
}

function updateWebhookLastFailure(webhook, status, statusCode, error) {
  webhook.lastFailure = {
    status: status,
    statusCode: statusCode || null,
    error: error || null,
    attemptedAt: new Date(),
  };
  webhook.save(function () {});
}

function notifyWebhooks(workspaceId, event, payload) {
  Webhook.find({ workspace: workspaceId, active: true, events: event }).lean().exec(function (err, webhooks) {
    if (err || !webhooks || webhooks.length === 0) return;
    var fullPayload = {
      event: event,
      resourceType: payload.resourceType || 'todo',
      resourceId: payload.resourceId || '',
      workspaceId: String(workspaceId),
      data: payload.data || payload,
      timestamp: new Date().toISOString(),
    };
    webhooks.forEach(function (w) {
      enqueue(w._id, event, fullPayload);
    });
  });
}

module.exports = {
  enqueue: enqueue,
  enqueueUrl: enqueueUrl,
  drain: drain,
  notifyWebhooks: notifyWebhooks,
  signPayload: signPayload,
};
