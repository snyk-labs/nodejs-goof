// Demonstration of an insecure Mongoose call vulnerable to NoSQL injection
// Usage: node mongoose-injection-demo.js '{"username": "admin@snyk.io", "password": {"$gt": ""}}'

const mongoose = require('mongoose');
const cfenv = require('cfenv');

// Reuse connection logic from mongoose-db.js
var mongoCFUri = cfenv.getAppEnv().getServiceURL('goof-mongo');
const DOCKER = process.env.DOCKER;
let mongoUri;
if (DOCKER === '1') {
  mongoUri = 'mongodb://goof-mongo/express-todo';
} else {
  mongoUri = 'mongodb://localhost/express-todo';
}
if (mongoCFUri) {
  mongoUri = mongoCFUri;
} else if (process.env.MONGOLAB_URI) {
  mongoUri = process.env.MONGOLAB_URI;
} else if (process.env.MONGODB_URI) {
  mongoUri = process.env.MONGODB_URI;
}

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String,
}));

// Simulate user input from command line
// Example: node mongoose-injection-demo.js '{"username": "admin@snyk.io", "password": {"$gt": ""}}'
const input = process.argv[2];
if (!input) {
  console.error('Usage: node mongoose-injection-demo.js "{\"username\": \"admin@snyk.io\", \"password\": {\"$gt\": \"\"}}"');
  process.exit(1);
}

let credentials;
try {
  credentials = JSON.parse(input);
} catch (e) {
  console.error('Invalid JSON input.');
  process.exit(1);
}

// INSECURE: Directly passing user input to the query (vulnerable to NoSQL injection)
User.find(credentials).exec((err, users) => {
  if (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
  if (users.length > 0) {
    console.log('Login successful! Users found:', users);
  } else {
    console.log('Login failed. No users found.');
  }
  mongoose.disconnect();
}); 