/**
 * Module dependencies.
 */

// mongoose setup
require('./mongoose-db');
require('./typeorm-db')

var st = require('st');
var crypto = require('crypto');
var express = require('express');
var http = require('http');
var path = require('path');
var ejsEngine = require('ejs-locals');
var bodyParser = require('body-parser');
var session = require('express-session')
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var optional = require('optional');
// var marked = require('marked'); // AI Refactor Patch: removed CommonJS require; marked v4 is ESM-only and requires dynamic import.
var fileUpload = require('express-fileupload');
var dust = require('dustjs-linkedin');
var dustHelpers = require('dustjs-helpers');
var cons = require('consolidate');
const hbs = require('hbs')

var app = express();
var routes = require('./routes');
var routesUsers = require('./routes/users.js')

// all environments
app.set('port', process.env.PORT || 3001);
app.engine('ejs', ejsEngine);
app.engine('dust', cons.dust);
app.engine('hbs', hbs.__express);
cons.dust.helpers = dustHelpers;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(methodOverride());
app.use(session({
  secret: 'keyboard cat',
  name: 'connect.sid',
  cookie: { path: '/' }
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());

// Routes
app.use(routes.current_user);
app.get('/', routes.index);
app.get('/login', routes.login);
app.post('/login', routes.loginHandler);
app.get('/admin', routes.isLoggedIn, routes.admin);
app.get('/account_details', routes.isLoggedIn, routes.get_account_details);
app.post('/account_details', routes.isLoggedIn, routes.save_account_details);
app.get('/logout', routes.logout);
app.post('/create', routes.create);
app.get('/destroy/:id', routes.destroy);
app.get('/edit/:id', routes.edit);
app.post('/update/:id', routes.update);
app.post('/import', routes.import);
app.get('/about_new', routes.about_new);
app.get('/chat', routes.chat.get);
app.put('/chat', routes.chat.add);
app.delete('/chat', routes.chat.delete);
app.use('/users', routesUsers)

// Static
app.use(st({ path: './public', url: '/public' }));

// Add the option to output (sanitized!) markdown
// AI Refactor Patch: marked v4 is ESM-only and removed the insecure `sanitize` option; dynamically import and provide a basic sanitizer wrapper.
(async () => {
  const { marked } = await import('marked'); // AI Refactor Patch: Use dynamic import for ESM-only package.

  function sanitizeHtml(html) {
    // AI Refactor Patch: Replace removed `sanitize` option with conservative server-side sanitization to mitigate XSS.
    if (typeof html !== 'string') return '';
    // Strip script/style/iframe tags and their contents
    html = html.replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    // Remove inline event handlers like onclick, onerror, etc.
    html = html.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
    // Disallow javascript: in href/src
    html = html.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, '');
    return html;
  }

  // Provide a helper compatible with previous templates that called `marked(text)`
  app.locals.marked = function (src) {
    const md = src == null ? '' : String(src);
    const html = marked.parse(md); // AI Refactor Patch: Use marked.parse per v4 API.
    return sanitizeHtml(html);
  };

  // development only
  if (app.get('env') == 'development') {
    app.use(errorHandler());
  }

  var token = 'SECRET_TOKEN_f8ed84e8f41e4146403dd4a6bbcea5e418d23a9';
  console.log('token: ' + (token.slice(0, 6) + '...')); // AI Refactor Patch: Avoid leaking full secret token in logs.

  http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port')); // AI Refactor Patch: Server start moved after async init to ensure marked is ready.
  });
})().catch(err => {
  // If marked fails to load, fail closed by providing a safe no-op renderer and still start the server
  console.error('Failed to initialize markdown renderer:', err); // AI Refactor Patch: Defensive fallback for ESM import failure.
  app.locals.marked = function () { return ''; };

  // development only
  if (app.get('env') == 'development') {
    app.use(errorHandler());
  }

  var token = 'SECRET_TOKEN_f8ed84e8f41e4146403dd4a6bbcea5e418d23a9';
  console.log('token: ' + (token.slice(0, 6) + '...')); // AI Refactor Patch: Avoid leaking full secret token in logs.

  http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
  });
});
