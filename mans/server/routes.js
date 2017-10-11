var url     = require('url');
var async = require('async');
var notifications = require('./notifications');

module.exports = function(app, dataManager, passport) {
    
    // =====================================
    // SERVICES ============================
    // =====================================
    // Retrieve the data from a specific workout and week
    app.get('/get_training', isLoggedIn, function(req, res) {
        var url_parts = url.parse(req.url, true).query;
        var type = url.parse(req.url, true).query.type;
        var lastWeek = url.parse(req.url, true).query.lastWeek;
        dataManager.getWorkout(type, lastWeek, function(data) {
            res.json(data);
        });
    });

     // Add a new user to the workout
    app.post('/add_user', isLoggedIn, validateUser, function(req, res){
        var type = req.body.type;
        dataManager.addUserToList(req.user.name, type, req.user.email, function(err, status) {
            if (err) throw err;
            if(status.error) {
                console.log('Validation error: show error');
                res.json({error: status.error});
            } else {//if(status.data) {
                dataManager.getWorkout(type, false, function(data) {
                    res.json(data);
                });
            }
        });
    });
    
    // Review if the session is active
    app.get('/is_active', isLoggedIn, function(req, res) {
        //if this lines are executed, the user is logged in
        res.json({active: true});
    });
    
    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res){
        res.render('views/login.html', { message: req.flash('loginMessage') || '' });
    });

    // process the login form
    app.post('/login', validateLoginForm, passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the login page if there is an error
        failureFlash : true // allow flash messages
    }));
    
    // =====================================
    // RESET PASSWORD ======================
    // =====================================
    // send a mail to the user with 
    app.get('/forgot', function(req, res) {
      res.render('views/forgot.html', {
        user: req.user,
        message: req.flash('forgotMessage') || ''
      });
    });
    
    app.post('/forgot', function(req, res, next) {
        dataManager.setupPasswordReset(req.body.email, req.headers.host, 
            function(){
              req.flash('loginMessage', 'Su petición ha sido procesada, revise su correo.');
              req.flash('loginStatus', 'success');
              return res.redirect('/login');  
            },
            function(error){
              req.flash('forgotMessage', error);
              req.flash('forgotStatus', 'fail');
              //return res.redirect('/forgot', {message: error});
              return res.redirect('/forgot');
            });
    });
    
    app.get('/reset/:token', function(req, res) {
      dataManager.passwordReset(req.params.token, function(err, user) {
        if(err) throw err;
        if (!user) {
          req.flash('forgotMessage', 'La clave para resetear la contraseña no es valida o el tiempo ha expirado.');
          req.flash('forgotStatus', 'fail');
          return res.redirect('/forgot');
        }
        res.render('views/reset.html', {
            user: req.user,
            message: req.flash('resetMessage')
        });
      });
    });
    
    app.post('/reset/:token', function(req, res) {
      async.waterfall([
        function(done) {
          dataManager.updatePassword(req.body.password, req.params.token, done,
            function(done, user){
                req.logIn(user, function(err) {
                  return done(err, user);
                });
            },
            function(done){
                req.flash('loginMessage', 'Su petición no ha podido ser procesada, inténtelo de nuevo más tarde.');
                req.flash('loginStatus', 'success');
                res.redirect('/login');
            });
        },
        function(user, done) {
          notifications.sendResetConfirmation(user.email, user.name, done);
        }
      ], function(err) {
        res.redirect('/');
      });
    });
    
    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res){
        res.render('views/signup.html', { message: req.flash('signupMessage') });
    });

     // process the signup form
    app.post('/signup', validateSignupForm, passport.authenticate('local-signup', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/login');
    });
    
    // =====================================
    // HOME ================================
    // =====================================
    // Render the specific view
    app.get('/views/:name', isLoggedIn, function (req, res, next) {
        //res.render('../client/views/' + req.params.name);
        res.render('views/' + req.params.name);
    });
    
    app.get('/favicon.ico');
    
    // Render the main page of the app
    app.get('/', isLoggedIn, function(req, res) {
        res.render('index.html');
    });
    app.get('*', isLoggedIn, function(req, res) {
        res.render('index.html');
    });
};

// Checks the user data before register him/her in the workout
function validateUser(req, res, next) {
    //Check that all fields contains info
    if(req.user.name && req.user.email && req.body.type && (req.body.type == 'functional' || req.body.type == 'pilates'))
        return next();
    // if they aren't redirect them to the home page
    res.json({error: 'No se ha podido completar la petición revise los datos e intentelo de nuevo'});
}

// Checks if the user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.user != null && req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect('/login');
}

function validateSignupForm(req, res, next) {
    var message = '';
    if(!req.body.email) {
        message = 'La dirección de correo no puede quedar en blanco.';
    } else if(!req.body.password) {
        message ='La contraseña no puede quedar en blanco.';
    } else if(!req.body.name) {
        message = 'El nombre no puede quedar en blanco.';
    } 
    if(message) {
        return res.render('views/signup.html', { message: message});
    }else {
        next();
    }
}

function validateLoginForm(req, res, next) {
    if(!req.body.email) {
        res.render('views/login.html', { message: 'La dirección de correo no puede quedar en blanco.' });
    } else {
        next();
    }
}

function validateResetForm(req, res, next) {
    if(!req.body.password) {
        res.render('views/reset.html', { message: 'La contraseña no puede quedar en blanco.' });
    } else {
        next();
    }
}