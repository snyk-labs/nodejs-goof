var utils    = require('../utils');
var mongoose = require('mongoose');
var Todo     = mongoose.model('Todo');
// TODO:
var hms = require('humanize-ms');
var ms = require('ms');

exports.index = function (req, res, next) {
  Todo.
    find({}).
    sort('-updated_at').
    exec(function (err, todos) {
      if (err) return next(err);

      res.render('index', {
          title : 'Goof TODO',
          subhead: 'Vulnerabilities at their best',
          todos : todos
      });
    });
};

exports.create = function (req, res, next) {
  // console.log('req.body: ' + JSON.stringify(req.body));

  var remindToken = ' in ';
  var reminder = req.body.content.toString().indexOf(remindToken);
  if (reminder > 0) {
    var time = req.body.content.slice(reminder + remindToken.length);
    time = time.replace(/\n$/, '');

    var period = hms(time);

    console.log('period: ' + period);

    // remove it
    req.body.content = req.body.content.slice(0, reminder);
    if (typeof period != 'undefined') {
      req.body.content += ' [' + ms(period) + ']';
    }
  }

  new Todo({
      content    : req.body.content,
      updated_at : Date.now()
  }).save(function (err, todo, count) {
    if (err) return next(err);

    /*
    res.setHeader('Data', todo.content.toString('base64'));
    res.redirect('/');
    */

    res.setHeader('Location', '/');
    res.status(302).send(todo.content.toString('base64'));

    // res.redirect('/#' + todo.content.toString('base64'));
  });
};

exports.destroy = function (req, res, next) {
  Todo.findById(req.params.id, function (err, todo) {

    try {
	todo.remove(function(err, todo) {
      	  if (err) return next(err);
     	   res.redirect('/');
    	});
    } catch(e) {
    }
  });
};

exports.edit = function(req, res, next) {
  Todo.
    find({}).
    sort('-updated_at').
    exec(function (err, todos) {
      if (err) return next(err);

      res.render('edit', {
        title   : 'TODO',
        todos   : todos,
        current : req.params.id
      });
    });
};

exports.update = function(req, res, next) {
  Todo.findById(req.params.id, function (err, todo) {

    todo.content    = req.body.content;
    todo.updated_at = Date.now();
    todo.save(function (err, todo, count) {
      if(err) return next(err);

      res.redirect('/');
    });
  });
};

// ** express turns the cookie key to lowercase **
exports.current_user = function (req, res, next) {

  next();
};
