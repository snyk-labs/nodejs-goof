var mongoose = require('mongoose');
var cfenv = require("cfenv");
var Schema = mongoose.Schema;

var ObjectId = Schema.Types.ObjectId;

var Todo = new Schema({
  content: Buffer,
  content_str: { type: String, default: '', select: false },
  content_hash: { type: String, index: true, sparse: true },
  due_date: Date,
  priority: { type: String, enum: ['low', 'medium', 'high'] },
  tags: [String],
  updated_at: Date,
  workspace: { type: ObjectId, ref: 'Workspace', default: null },
  deleted_at: { type: Date, default: null },
});
Todo.index({ workspace: 1, updated_at: -1 });
Todo.index({ workspace: 1, due_date: 1 });
mongoose.model('Todo', Todo);

var Workspace = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  settings: { type: Schema.Types.Mixed, default: {} },
});
Workspace.index({ slug: 1 });
mongoose.model('Workspace', Workspace);

var ROLES = ['owner', 'admin', 'member', 'viewer'];
var WorkspaceMember = new Schema({
  workspace: { type: ObjectId, ref: 'Workspace', required: true },
  user: { type: String, required: true },
  role: { type: String, enum: ROLES, required: true },
});
WorkspaceMember.index({ workspace: 1, user: 1 }, { unique: true });
WorkspaceMember.index({ user: 1 });
mongoose.model('WorkspaceMember', WorkspaceMember);

var AuditEvent = new Schema({
  workspace: { type: ObjectId, ref: 'Workspace', required: true },
  actor: { type: String, required: true },
  action: { type: String, required: true },
  resourceType: { type: String, enum: ['todo', 'workspace', 'member'], required: true },
  resourceId: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  ip: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});
AuditEvent.index({ workspace: 1, createdAt: -1 });
AuditEvent.index({ workspace: 1, action: 1, resourceType: 1, actor: 1 });
mongoose.model('AuditEvent', AuditEvent);

var Webhook = new Schema({
  workspace: { type: ObjectId, ref: 'Workspace', required: true },
  url: { type: String, required: true },
  secret: { type: String, required: true },
  events: [String],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastFailure: {
    status: String,
    statusCode: Number,
    error: String,
    attemptedAt: Date,
  },
});
Webhook.index({ workspace: 1 });
mongoose.model('Webhook', Webhook);

var WebhookDelivery = new Schema({
  webhook: { type: ObjectId, ref: 'Webhook', required: true },
  url: { type: String, required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  statusCode: { type: Number, default: null },
  error: { type: String, default: null },
  attemptedAt: { type: Date, default: Date.now },
});
WebhookDelivery.index({ webhook: 1, attemptedAt: -1 });
mongoose.model('WebhookDelivery', WebhookDelivery);

var Rule = new Schema({
  workspace: { type: ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  trigger: { type: String, enum: ['schedule', 'todo.created', 'todo.updated'], required: true },
  schedule: { type: String, default: null },
  conditions: { type: Schema.Types.Mixed, default: [] },
  actions: { type: Schema.Types.Mixed, default: [] },
});
Rule.index({ workspace: 1 });
Rule.index({ workspace: 1, trigger: 1, enabled: 1 });
mongoose.model('Rule', Rule);

var User = new Schema({
  username: String,
  password: String,
});

mongoose.model('User', User);

var Note = new Schema({
  title: String,
  content: String,
  created_at: Date,
  updated_at: Date,
});

mongoose.model('Note', Note);

// CloudFoundry env vars
var mongoCFUri = cfenv.getAppEnv().getServiceURL('goof-mongo');
console.log(JSON.stringify(cfenv.getAppEnv()));

// Default Mongo URI is local
const DOCKER = process.env.DOCKER
if (DOCKER === '1') {
  var mongoUri = 'mongodb://goof-mongo/express-todo';
} else {
  var mongoUri = 'mongodb://localhost/express-todo';
}


// CloudFoundry Mongo URI
if (mongoCFUri) {
  mongoUri = mongoCFUri;
} else if (process.env.MONGOLAB_URI) {
  // Generic (plus Heroku) env var support
  mongoUri = process.env.MONGOLAB_URI;
} else if (process.env.MONGODB_URI) {
  // Generic (plus Heroku) env var support
  mongoUri = process.env.MONGODB_URI;
}

console.log("Using Mongo URI " + mongoUri);

mongoose.connect(mongoUri);

User = mongoose.model('User');
User.find({ username: 'admin@snyk.io' }).exec(function (err, users) {
  console.log(users);
  if (users.length === 0) {
    console.log('no admin');
    new User({ username: 'admin@snyk.io', password: 'SuperSecretPassword' }).save(function (err, user, count) {
      if (err) {
        console.log('error saving admin user');
      }
    });
  }
});