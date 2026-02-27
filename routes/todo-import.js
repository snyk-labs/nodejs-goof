var crypto = require('crypto');
var { Readable } = require('stream');
var { parse } = require('csv-parse');
var multer = require('multer');
var mongoose = require('mongoose');
var validator = require('validator');

var Todo = mongoose.model('Todo');

var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (_req, file, cb) {
    if (file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
});

var jobs = new Map();

var JOB_TTL_MS = 5 * 60 * 1000;
var VALID_PRIORITIES = ['low', 'medium', 'high'];

function computeContentHash(content) {
  return crypto.createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
}

function validateRow(row) {
  var errors = [];

  if (!row.content || !row.content.trim()) {
    errors.push('content is required');
  }

  if (row.due_date && row.due_date.trim()) {
    var d = new Date(row.due_date.trim());
    if (isNaN(d.getTime())) {
      errors.push('due_date must be a valid date');
    }
  }

  if (row.priority && row.priority.trim()) {
    if (!VALID_PRIORITIES.includes(row.priority.toLowerCase().trim())) {
      errors.push('priority must be one of: low, medium, high');
    }
  }

  return errors;
}

function parseTags(tagsStr) {
  if (!tagsStr || !tagsStr.trim()) return [];
  return tagsStr.split(';').map(function (t) { return t.trim(); }).filter(Boolean);
}

function buildProgressPayload(job) {
  return {
    jobId: job.id,
    status: job.status,
    totalRows: job.totalRows,
    processed: job.processed,
    created: job.results.filter(function (r) { return r.status === 'created'; }).length,
    skippedDuplicate: job.results.filter(function (r) { return r.status === 'skipped-duplicate'; }).length,
    failed: job.results.filter(function (r) { return r.status === 'failed'; }).length,
  };
}

function emitProgress(job) {
  var data = buildProgressPayload(job);
  job.listeners.forEach(function (listener) {
    try {
      listener(data);
    } catch (_e) {
      job.listeners.delete(listener);
    }
  });
}

function parseCsvBuffer(buffer) {
  return new Promise(function (resolve, reject) {
    var rows = [];
    var readable = Readable.from(buffer.toString('utf-8'));
    var parser = readable.pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }));

    parser.on('data', function (row) { rows.push(row); });
    parser.on('error', reject);
    parser.on('end', function () { resolve(rows); });
  });
}

exports.uploadMiddleware = upload.single('file');

exports.importCsv = async function (req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded. Use field name "file".' });
  }

  var jobId = crypto.randomUUID();
  var job = {
    id: jobId,
    status: 'processing',
    totalRows: 0,
    processed: 0,
    results: [],
    listeners: new Set(),
  };
  jobs.set(jobId, job);

  try {
    var rows = await parseCsvBuffer(req.file.buffer);

    job.totalRows = rows.length;
    emitProgress(job);

    var csvHashes = rows
      .filter(function (r) { return r.content && r.content.trim(); })
      .map(function (r) { return computeContentHash(r.content); });

    var existingTodos = await Todo.find({
      content_hash: { $in: csvHashes },
    }).select('content_hash').lean();

    var existingHashes = new Set(
      existingTodos
        .filter(function (t) { return t.content_hash; })
        .map(function (t) { return t.content_hash; })
    );

    var session = await mongoose.startSession();

    try {
      await session.withTransaction(async function () {
        var seenInBatch = new Set();

        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var rowResult = { row: i + 1, content: (row.content || '').substring(0, 200) };

          var errors = validateRow(row);
          if (errors.length > 0) {
            rowResult.status = 'failed';
            rowResult.reason = errors.join('; ');
            job.results.push(rowResult);
            job.processed++;
            emitProgress(job);
            continue;
          }

          var hash = computeContentHash(row.content);
          if (existingHashes.has(hash) || seenInBatch.has(hash)) {
            rowResult.status = 'skipped-duplicate';
            job.results.push(rowResult);
            job.processed++;
            emitProgress(job);
            continue;
          }

          var dueDate = row.due_date && row.due_date.trim() ? new Date(row.due_date.trim()) : undefined;
          var priority = row.priority ? row.priority.toLowerCase().trim() : undefined;
          var tags = parseTags(row.tags);

          try {
            await Todo.findOneAndUpdate(
              { content_hash: hash },
              {
                $setOnInsert: {
                  content: Buffer.from(row.content.trim()),
                  content_hash: hash,
                  due_date: dueDate,
                  priority: priority,
                  tags: tags,
                  updated_at: new Date(),
                },
              },
              { upsert: true, new: true, session: session }
            );

            seenInBatch.add(hash);
            rowResult.status = 'created';
          } catch (upsertErr) {
            rowResult.status = 'failed';
            rowResult.reason = upsertErr.message;
          }

          job.results.push(rowResult);
          job.processed++;
          emitProgress(job);
        }
      });
    } finally {
      await session.endSession();
    }

    job.status = 'completed';
    emitProgress(job);

    setTimeout(function () { jobs.delete(jobId); }, JOB_TTL_MS);

    return res.status(200).json({
      jobId: jobId,
      status: 'completed',
      totalRows: job.totalRows,
      created: job.results.filter(function (r) { return r.status === 'created'; }).length,
      skippedDuplicate: job.results.filter(function (r) { return r.status === 'skipped-duplicate'; }).length,
      failed: job.results.filter(function (r) { return r.status === 'failed'; }).length,
      rows: job.results,
    });

  } catch (err) {
    job.status = 'failed';
    job.error = err.message;
    emitProgress(job);

    setTimeout(function () { jobs.delete(jobId); }, JOB_TTL_MS);

    return res.status(500).json({
      jobId: jobId,
      error: 'Import failed',
      details: err.message,
    });
  }
};

exports.importStatus = function (req, res) {
  var jobId = req.params.jobId;

  if (!validator.isUUID(jobId)) {
    return res.status(400).json({ error: 'Invalid job ID format' });
  }

  var job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('\n');

  var currentData = buildProgressPayload(job);
  res.write('data: ' + JSON.stringify(currentData) + '\n\n');

  if (job.status === 'completed' || job.status === 'failed') {
    res.write('event: done\ndata: ' + JSON.stringify(currentData) + '\n\n');
    return res.end();
  }

  var listener = function (progressData) {
    try {
      res.write('data: ' + JSON.stringify(progressData) + '\n\n');
      if (progressData.status === 'completed' || progressData.status === 'failed') {
        res.write('event: done\ndata: ' + JSON.stringify(progressData) + '\n\n');
        job.listeners.delete(listener);
        res.end();
      }
    } catch (_e) {
      job.listeners.delete(listener);
    }
  };

  job.listeners.add(listener);

  req.on('close', function () {
    job.listeners.delete(listener);
  });
};
