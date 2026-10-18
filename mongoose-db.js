var mongoose = require('mongoose');
var cfenv = require("cfenv");
var Schema = mongoose.Schema;

// Harden Mongoose against query operator injection
mongoose.set('sanitizeFilter', true); // AI Refactor Patch: Enable query sanitization introduced in Mongoose 6 to mitigate `$` operator injection from untrusted input.

var Todo = new Schema({
  content: Buffer,
  updated_at: Date,
});

mongoose.model('Todo', Todo);

var User = new Schema({
  username: String,
  password: String,
});

mongoose.model('User', User);

// CloudFoundry env vars
var appEnv = cfenv.getAppEnv(); // AI Refactor Patch: Cache appEnv to avoid repeated calls and prepare for safer logging.
var mongoCFUri = appEnv.getServiceURL('goof-mongo');
// Avoid logging entire appEnv as it may contain credentials
console.log('CF env detected. App:', appEnv && appEnv.name ? appEnv.name : 'unknown'); // AI Refactor Patch: Prevent leaking sensitive service credentials by not serializing full appEnv.

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

// Mask potential credentials in logged URI
function sanitizeMongoUri(uri) { // AI Refactor Patch: Avoid logging DB credentials by masking userinfo in the URI.
  try {
    var u = new URL(uri);
    if (u.username || u.password) {
      u.username = u.username ? '***' : '';
      u.password = u.password ? '***' : '';
    }
    return u.toString();
  } catch (e) {
    return uri.replace(/\/\/([^@\/]+)@/, '//***:***@');
  }
}

console.log("Using Mongo URI " + sanitizeMongoUri(mongoUri)); // AI Refactor Patch: Log sanitized URI to prevent secret leakage.

mongoose.connect(mongoUri).catch(function (err) { // AI Refactor Patch: In Mongoose 6, connect returns a Promise; attach catch to avoid unhandled rejections.
  console.error('Mongo connection error:', err && err.message ? err.message : err);
});

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
