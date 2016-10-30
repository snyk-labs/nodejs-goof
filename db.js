var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

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

var mongoUri = 'mongodb://localhost/express-todo';
if (process.env.MONGOLAB_URI) {
  mongoUri = process.env.MONGOLAB_URI;
}

mongoose.connect(mongoUri);

User = mongoose.model('User');
User.find({ username: 'admin' }).exec(function (err, users) {
  console.log(users);
  if (users.length === 0) {
    console.log('no admin');
    new User({ username: 'admin', password: 'SuperSecretPassword' }).save(function (err, user, count) {
        if (err) {
          console.log('error saving admin user');
        }
      });
  }
});
