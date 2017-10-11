// server.js
// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var path = require('path');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var compress     = require('compression');

var configDB = require('./config/database.js');

var server = require("http").createServer(app);

var io = require('socket.io').listen(server, { log: false });

// configuration ===============================================================
mongoose.connect(configDB.url, {auto_reconnect: true}); // connect to our database

// uncomment this line
require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
//--------------------------------------------
app.set('socketio', io);
app.use(express.static(__dirname + '/client'));
var favicon = require('serve-favicon');
app.use(favicon(__dirname + '/client/images/favicon.ico'));
//app.use(express.favicon(__dirname + '/client/images/favicon.ico'));
app.use('/socket.io', express.static(path.resolve(__dirname+'node_modules/lib', 'socket.io')));
//app.use(compress()); // to compress content to gzip
app.set('views', __dirname + '/client/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// required for passport
app.use(session({ secret: 'session_secret' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
require('./app/files.js')(app, server, io);
// launch ======================================================================
app.set('port', port);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
