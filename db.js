var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var Todo = new Schema({
  content    : Buffer,
  updated_at : Date
});

mongoose.model('Todo', Todo);
var mongoUri = 'mongodb://localhost/express-todo';
if (process.env.MONGOLAB_URI) {
	mongoUri = process.env.MONGOLAB_URI;
}

mongoose.connect(mongoUri);
