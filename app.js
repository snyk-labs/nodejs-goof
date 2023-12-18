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
var marked = require('marked');
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
marked.setOptions({ sanitize: true });
app.locals.marked = marked;

// development only
if (app.get('env') == 'development') {
  app.use(errorHandler());
}

var token = 'SECRET_TOKEN_f8ed84e8f41e4146403dd4a6bbcea5e418d23a9';

var sshkey = "-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----"

var sshPubKey = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC/hIPZ3kDwm6PrE5UT0Y8TONVs++QbjVMLNBOkNc/EGYTMc66gUJ3Kay0SXhXZLYByEv82FjPFsfNZWwtl6KTKoov/23GmJha+YK64MWNXf3Tzjy+kEzIm7Ols40sfnIE9moOu5zA9TjcSSMvHs9MQ3xc86NffixwXYtxq7zXFjbhwI989s2OVf+3Kv20fUUd1+rpHTwo4hmTj2i44qNePnZO0DEumkQD6/hh1xs6RzRjNIOQzXuC6N165bukhLdCTOerrkAMn+M3WQMzYptOrfNv1ml0KvSN34gavA0UxL66UF4LNEP2/yIWvmsJYY24U8WscJDFk0vQqfUjqP2A4OXoYUzh6XiXtRSHElCtA7AGdE4WOyIvLDXWTvbASmQvT6RRl9KBfMJQDHnAHOOIpa+JfroqynXMp3B1wqrgcjNpX8xulc6VThcB5sV0ODdkfRcMyVUh3yOpK41b3LKRJz2wsDEBbWQimzgExTWkP1iri+AgjIO11aCgYubVwZK8= uday@uksnyk.lan";


console.log('token: ' + token);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
