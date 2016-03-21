var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var Todo = new Schema({
  content    : Buffer,
  updated_at : Date
});

mongoose.model('Todo', Todo);
mongoose.connect('mongodb://localhost/express-todo');
