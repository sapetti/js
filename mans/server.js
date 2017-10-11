//Nodejs libraries
var express       = require('express'),
    app           = express(),
    compress      = require('compression'),
    mongoose      = require('mongoose'),
    passport      = require('passport'),
    flash         = require('connect-flash'),
    session       = require('express-session');
    //morgan        = require('morgan');

//Custom libraries for server setup
var configDB      = require('./server/resources/database.js');
mongoose.connect(configDB.url); // connect to the database
require('./server/passport')(passport); // pass passport for configuration

//Setup server
app.configure(function(){
  //Static directories
  app.use(express.static(require('path').resolve(__dirname, 'client')));
  app.set('views', __dirname + '/client'); //View path
  app.engine('html', require('ejs').renderFile); //Ejs setup
  app.set('view engine', 'html'); //Needed to render the views
  app.use(compress()); // to compress content to gzip
  app.use(express.static('public'));
  app.use(express.cookieParser()); //For auth
  app.use(express.bodyParser()); //For form uploading
  app.use(flash()); //For messages
  
  // required for passport
  app.use(session({ secret: 'mans_app_secret' })); // session secret
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
  app.use(app.router);
  
  //app.use(morgan('dev')); //Debug purpouses
  app.set('port', process.env.PORT || 8080);
  app.set('host', process.env.IP || '0.0.0.0');
});


//Custom libraries after the server setup!
var dataManager = require('./server/data-manager');
require('./server/routes')(app, dataManager, passport);
var notifications = require('./server/notifications');
require('./server/cron')(notifications, dataManager);

//Startup server
var server = require('http').createServer(app);
server.listen(app.get('port'), app.get('host'), function(){
  console.log('Server listening on port ' + app.get('port'));
});

