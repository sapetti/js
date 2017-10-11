//passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User            = require('./model/user');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);
            // if no user is found or password is not the right one, return the message
            if (!user || !user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Usuario o password incorrectos.'));
            // all is well, return successful user
            console.log('Pass:: ' + user.password);
            return done(null, user);
        });

    }));
    
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================

    passport.use('local-signup', new LocalStrategy({
        // override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        process.nextTick(function() {
            // checking if the user trying to login already exists
            User.findOne({ 'email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err) return done(err);
                // check to see if theres already a user with that email
                if (user) {
                    console.log('Email already in use...');
                    return done(null, false, req.flash('signupMessage', 'Esa dirección de correo ya está siendo usada.'));
                } else {
                    // if there is no user with that email create the user
                    var newUser            = new User();
                    // set the user's local credentials
                    newUser.email    = email;
                    newUser.password = newUser.generateHash(password);
                    newUser.name = req.body.name;
                    // save the user
                    newUser.save(function(err) {
                        if (err) throw err;
                        return done(null, newUser);
                    });
                }
    
            });    

        });

    }));
    
};