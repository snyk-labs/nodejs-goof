var utils = require('../utils');
var mongoose = require('mongoose');
var Todo = mongoose.model('Todo');
var User = mongoose.model('User');
// TODO:
var hms = require('humanize-ms');
var ms = require('ms');
var moment = require('moment');
var validator = require('validator');

// AI Refactor Patch: Removed unused and insecure requires (stream-buffers, readline, child_process.exec, fs, lodash) to reduce attack surface and address upgraded libs.

// zip-slip
var fileType = require('file-type');
var AdmZip = require('adm-zip');

// AI Refactor Patch: helper to coerce inputs to string for validator >=13 which only accepts strings
function toSafeString(val) {
  return typeof val === 'string' ? val : '';
}

// AI Refactor Patch: sanitize redirects to prevent open redirects with untrusted input
function sanitizeRedirect(target) {
  var t = toSafeString(target).trim();
  if (!t) return null;
  // Only allow relative paths starting with a single slash and no scheme
  if (!t.startsWith('/') || t.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t)) return null;
  return t;
}

function onLoginSuccessHook(redirectPage, session, username, res) {
  session.loggedIn = 1

  // Log the login action for audit
  console.log(`User logged in: ${username}`)

  // AI Refactor Patch: validate redirect target to avoid open redirect vulnerabilities
  var safeRedirect = sanitizeRedirect(redirectPage); // AI Refactor Patch: sanitize user-controlled redirect
  if (safeRedirect) {
      return res.redirect(safeRedirect)
  } else {
      return res.redirect('/admin')
  }
}

exports.index = function (req, res, next) {
  Todo.
    find({}).
    sort('-updated_at').
    exec(function (err, todos) {
      if (err) return next(err);

      res.render('index', {
        title: 'Patch TODO List',
        subhead: 'Vulnerabilities at their best',
        todos: todos,
      });
    });
};

exports.loginHandler = function (req, res, next) {
  const usernameStr = toSafeString(req.body && req.body.username); // AI Refactor Patch: coerce to string for validator 13+
  const passwordStr = toSafeString(req.body && req.body.password); // AI Refactor Patch: coerce to string for validator 13+

  if (validator.isEmail(usernameStr)) {
    User.find({ username: usernameStr, password: passwordStr }, function (err, users) {
      if (err) return next(err); // AI Refactor Patch: handle possible db errors
      if (users && users.length > 0) {
        const redirectPage = toSafeString(req.body && req.body.redirectPage); // AI Refactor Patch: coerce and later sanitize redirect
        const session = req.session
        const username = usernameStr
        return adminLoginSuccess(redirectPage, session, username, res)
      } else {
        return res.status(401).send()
      }
    });
  } else {
    return res.status(401).send()
  }
};

function adminLoginSuccess(redirectPage, session, username, res) {
  session.loggedIn = 1

  // Log the login action for audit
  console.log(`User logged in: ${username}`)

  // AI Refactor Patch: validate redirect target to avoid open redirect vulnerabilities
  var safeRedirect = sanitizeRedirect(redirectPage); // AI Refactor Patch: sanitize user-controlled redirect
  if (safeRedirect) {
      return res.redirect(safeRedirect)
  } else {
      return res.redirect('/admin')
  }
}

exports.login = function (req, res, next) {
  return res.render('admin', {
    title: 'Admin Access',
    granted: false,
    redirectPage: req.query.redirectPage
  });
};

exports.admin = function (req, res, next) {
  return res.render('admin', {
    title: 'Admin Access Granted',
    granted: true,
  });
};

exports.get_account_details = function(req, res, next) {
  // @TODO need to add a database call to get the profile from the database
  // and provide it to the view to display
  const profile = {}
 	return res.render('account.hbs', profile)
}

exports.save_account_details = function(req, res, next) {
  // AI Refactor Patch: whitelist and coerce fields to prevent prototype pollution and validator type issues
	const raw = req.body || {}; // AI Refactor Patch: avoid using req.body directly in templates
  const sanitized = {
    email: toSafeString(raw.email),
    phone: toSafeString(raw.phone),
    firstname: toSafeString(raw.firstname),
    lastname: toSafeString(raw.lastname),
    country: toSafeString(raw.country),
  };

  // validate the input
  if (validator.isEmail(sanitized.email, { allow_display_name: true })
    // allow_display_name allows us to receive input as:
    // Display Name <email-address>
    // which we consider valid too
    && validator.isMobilePhone(sanitized.phone, 'he-IL')
    && validator.isAscii(sanitized.firstname)
    && validator.isAscii(sanitized.lastname)
    && validator.isAscii(sanitized.country)
  ) {
    // trim any extra spaces on the right of the name
    sanitized.firstname = validator.rtrim(sanitized.firstname) // AI Refactor Patch: operate on sanitized copy
    sanitized.lastname = validator.rtrim(sanitized.lastname) // AI Refactor Patch: operate on sanitized copy

    // render the view
    return res.render('account.hbs', sanitized)
  } else {
    // if input validation fails, we just render the view as is
    console.log('error in form details')
    return res.render('account.hbs')
  }
}

exports.isLoggedIn = function (req, res, next) {
  if (req.session.loggedIn === 1) {
    return next()
  } else {
    return res.redirect('/')
  }
}

exports.logout = function (req, res, next) {
  req.session.loggedIn = 0
  req.session.destroy(function() { 
    return res.redirect('/')  
  })
}

function parse(todo) {
  var t = todo;

  var remindToken = ' in ';
  var reminder = t.toString().indexOf(remindToken);
  if (reminder > 0) {
    var time = t.slice(reminder + remindToken.length);
    time = time.replace(/\n$/, '');

    var period = hms(time);

    console.log('period: ' + period);

    // remove it
    t = t.slice(0, reminder);
    if (typeof period != 'undefined') {
      t += ' [' + ms(period) + ']';
    }
  }
  return t;
}

exports.create = function (req, res, next) {
  // console.log('req.body: ' + JSON.stringify(req.body));

  var item = req.body.content;
  var imgRegex = /\!\[alt text\]\((http.*)\s\".*/;
  if (typeof (item) == 'string' && item.match(imgRegex)) {
    var url = item.match(imgRegex)[1];
    console.log('found img: ' + url);

    // AI Refactor Patch: remove exec of external command with untrusted input to prevent command injection
    // Previously: exec('identify ' + url, ...) which is unsafe.

  } else {
    item = parse(item);
  }

  new Todo({
    content: item,
    updated_at: Date.now(),
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
    if (err) return next(err); // AI Refactor Patch: handle db error
    if (!todo) { // AI Refactor Patch: handle not found safely
      return res.redirect('/');
    }
    // AI Refactor Patch: use deleteOne in Mongoose 6 and handle callback
    todo.deleteOne(function (err) {
      if (err) return next(err);
      res.redirect('/');
    });
  });
};

exports.edit = function (req, res, next) {
  Todo.
    find({}).
    sort('-updated_at').
    exec(function (err, todos) {
      if (err) return next(err);

      res.render('edit', {
        title: 'TODO',
        todos: todos,
        current: req.params.id
      });
    });
};

exports.update = function (req, res, next) {
  Todo.findById(req.params.id, function (err, todo) {
    if (err) return next(err); // AI Refactor Patch: handle db error
    if (!todo) return res.redirect('/'); // AI Refactor Patch: handle not found safely

    todo.content = req.body.content;
    todo.updated_at = Date.now();
    todo.save(function (err, todo, count) {
      if (err) return next(err);

      res.redirect('/');
    });
  });
};

// ** express turns the cookie key to lowercase **
exports.current_user = function (req, res, next) {

  next();
};

function isBlank(str) {
  return (!str || /^\s*$/.test(str));
}

exports.import = function (req, res, next) {
  if (!req.files) {
    res.send('No files were uploaded.');
    return;
  }

  var importFile = req.files.importFile;
  // AI Refactor Patch: handle multiple files case safely for express-fileupload >=1.x
  if (Array.isArray(importFile)) importFile = importFile[0];

  if (!importFile || !importFile.data) {
    res.send('Invalid file upload.');
    return;
  }

  var data;
  var importedFileType = fileType(importFile.data);
  var zipFileExt = { ext: "zip", mime: "application/zip" };
  // AI Refactor Patch: handle undefined falsy from file-type
  if (!importedFileType) {
    importedFileType = { ext: "txt", mime: "text/plain" };
  }
  if (importedFileType["mime"] === zipFileExt["mime"]) {
    // AI Refactor Patch: avoid extractAllTo (zip-slip). Read specific entry from buffer safely.
    var zip = new AdmZip(importFile.data); // AI Refactor Patch: use constructor per new adm-zip API
    var entry = zip.getEntry('backup.txt'); // AI Refactor Patch: only read expected file
    if (entry) {
      data = zip.readAsText(entry); // AI Refactor Patch: read entry content without touching filesystem
    } else {
      data = "No backup.txt file found";
    }
  } else {
    data = importFile.data.toString('ascii');
  }
  var lines = data.split('\n');
  lines.forEach(function (line) {
    var parts = line.split(',');
    var what = parts[0];
    console.log('importing ' + what);
    var when = parts[1];
    var locale = parts[2];
    var format = parts[3];
    var item = what;
    if (!isBlank(what)) {
      if (!isBlank(when) && !isBlank(locale) && !isBlank(format)) {
        console.log('setting locale ' + parts[1]);
        moment.locale(locale);
        var d = moment(when);
        console.log('formatting ' + d);
        item += ' [' + d.format(format) + ']';
      }

      new Todo({
        content: item,
        updated_at: Date.now(),
      }).save(function (err, todo, count) {
        if (err) return next(err);
        console.log('added ' + todo);
      });
    }
  });

  res.redirect('/');
};

exports.about_new = function (req, res, next) {
  console.log(JSON.stringify(req.query));
  return res.render("about_new.dust",
    {
      title: 'Patch TODO List',
      subhead: 'Vulnerabilities at their best',
      device: req.query.device
    });
};

// Prototype Pollution

///////////////////////////////////////////////////////////////////////////////
// In order of simplicity we are not using any database. But you can write the
// same logic using MongoDB.
const users = [
  // You know password for the user.
  { name: 'user', password: 'pwd' },
  // You don't know password for the admin.
  { name: 'admin', password: Math.random().toString(32), canDelete: true },
];

let messages = [];
let lastId = 1;

function findUser(auth) {
  return users.find((u) =>
    u.name === auth.name &&
    u.password === auth.password);
}
///////////////////////////////////////////////////////////////////////////////

exports.chat = {
  get(req, res) {
    res.send(messages);
  },
  add(req, res) {
    const user = findUser(req.body.auth || {});

    if (!user) {
      res.status(403).send({ ok: false, error: 'Access denied' });
      return;
    }

    const message = {
      // Default message icon. Cen be overwritten by user.
      icon: '👋',
    };

    // AI Refactor Patch: replace _.merge with explicit whitelist to prevent prototype pollution
    const incoming = (req.body && typeof req.body.message === 'object' && !Array.isArray(req.body.message)) ? req.body.message : {};
    if (typeof incoming.icon === 'string') {
      message.icon = incoming.icon;
    }
    if (typeof incoming.text === 'string') {
      message.text = incoming.text;
    }

    Object.assign(message, {
      id: lastId++,
      timestamp: Date.now(),
      userName: user.name,
    }); // AI Refactor Patch: assign trusted fields after merging allowed user fields

    messages.push(message);
    res.send({ ok: true });
  },
  delete(req, res) {
    const user = findUser(req.body.auth || {});

    if (!user || !user.canDelete) {
      res.status(403).send({ ok: false, error: 'Access denied' });
      return;
    }

    messages = messages.filter((m) => m.id !== req.body.messageId);
    res.send({ ok: true });
  }
};
