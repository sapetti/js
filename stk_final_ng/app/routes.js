

// load up the user model
var User            = require('../app/model/user');
var Quiz            = require('../app/model/quiz');
var Files           = require('../app/files');
var Express         = require('express');
var exec            = require('child_process').exec;

var BITNAMI         = false;
var SEPARATOR       = ' - ';
var DPBX_SCRIPT_PATH = '/home/bitnami/scripts/download_dpbx.py';
var cronWorking = false;
var dpbxImportInterval = null;


// app/routes.js
module.exports = function(app, passport) {
    if(BITNAMI) {
      app.use('/photos', Express.static('/home/bitnami/fotos'));
    } else {
      app.use('/photos', Express.static('/home/pi/fotos'));
    }

    // =====================================
    // Import Dropbox utility
    // =====================================
    app.get('/dpbxImportStatus', isAdmin, function(req, res) {
      console.log('dpbxImportStatus ' + (dpbxImportInterval != null));
      res.json({running: (dpbxImportInterval != null)});
    });

    app.get('/stopImport', isAdmin, function(req, res) {
      console.log('stopImport ' + (dpbxImportInterval != null));
      stopDropboxImport();
      res.json({running: (dpbxImportInterval != null)});
    });

    app.get('/startImport', isAdmin, function(req, res) {
      console.log('startImport ' + (dpbxImportInterval != null));
      startDropboxImport();
      res.json({running: (dpbxImportInterval != null)});
    });

    app.get('/adminImport', isAdmin, function(req, res) {
        res.render('admin_import.html');
    });

    // =====================================
    // RAFFLE
    // =====================================
    app.get('/raffle_view', isAdmin, function(req, res) {
        //console.log('/raffle ');
        res.render('view_raffle.html', {});
    });

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', isLoggedIn, function(req, res) {
        //console.log('/home ' + req.user.local.email + " " + req.user.local.admin);
        // if user is admin, continue to admin mode
        if (req.user.local.admin) {
            if(req.user.local.email == 'lilsap') {
              res.redirect('/adminImport');
            } else {
              res.redirect('/slideshow');
            }
        } else {
            // if not, go to home page
            res.render('index.html', {
                user: req.user.local.email
            });
        }
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.html', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post("/login", passport.authenticate('local-login',
        { failureRedirect: '/login', failureFlash: true }),
          function(req, res) {
            var expireTime = 3600000 * 24; //24 hours
    	req.session.cookie.expires = new Date(Date.now() + expireTime);
    	req.session.cookie.maxAge = expireTime;
          	res.redirect('/');
    });

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    // app.get('/signup', function(req, res) {
    //
    //     // render the page and pass in any flash data if it exists
    //     res.render('signup.html', { message: req.flash('signupMessage') });
    // });
    //
    //  // process the signup form
    // app.post('/signup', passport.authenticate('local-signup', {
    //     successRedirect : '/', // redirect to the secure profile section
    //     failureRedirect : '/signup', // redirect back to the signup page if there is an error
    //     failureFlash : true // allow flash messages
    // }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.html', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/slideshow', isAdmin, function(req, res) {
        res.render('slideshow_view.html');
    });

    app.get('/user_admin', isAdmin, function(req, res) {
        //console.log('/user_admin ' + req.user.local.email + " " + req.user.local.admin);
        // get all the users and show admin page
        User.find({}, function(err, users) {
            if (err) throw err;
            res.render('admin_users.html', {
                users : users // get the user out of session and pass to template
            });
        });
    });

    // =====================================
    // ADMIN QUIZ ==========================
    // =====================================
    app.get('/quiz_admin', isAdmin, function(req, res) {
        // get all the questions and show quiz admin page
        Quiz.find({}, function(err, questions) {
            if (err) throw err;
            res.render('admin_quiz.html', {
                quiz_data : questions
            });
        });
    });

     // Add a question with its possible answers and the solution
    app.post('/add_quiz', isAdmin, function(req, res){
        var newQuestion                 = new Quiz();
        newQuestion.question            = req.body.q;
        newQuestion.creation_date       = new Date();
        newQuestion.results             = [];
        newQuestion.answers             = [];
        newQuestion.answers[0]          = req.body.a1;
        newQuestion.answers[1]          = req.body.a2;
        newQuestion.answers[2]          = req.body.a3;
        newQuestion.answers[3]          = req.body.a4;
        newQuestion.solution            = req.body.right_answer-1;

        newQuestion.save(function(err) {
           if (err)
               throw err;
           res.redirect('/quiz_admin');
        });
    });

    // Delete the question for the quiz
    app.post('/remove_quiz', isAdmin, function(req, res){

        Quiz.findOne({question: req.body.question}, function(err, questions) {
            if (err) throw err;

            if(questions != null) {
                questions.remove();
                res.status(200);
            } else {
                res.send( {reason:"Not found"}, 404 );
            }
        });
    });

    // =====================================
    // LAUNCH QUIZ =========================
    // =====================================
    app.get('/quiz_view', isAdmin, function(req, res) {
        res.render('view_quiz.html');
    });

    // Gets the answer previously saved for this user
    app.get('/check_user_values', isLoggedIn, function(req, res) {
        var saveResult = null;

        //find by question id... and then loop the results to find the one for the user...
        Quiz.findOne({_id: req.query.key}, function(err, question) {
            if (err) throw err;
            if(question != undefined && question.results != undefined) {
                for(var i=0;i<question.results.length;i++) {
                    if(question.results[i].indexOf(req.user.local.email + SEPARATOR) == 0) {
                        var str = question.results[i];
                        saveResult = str.substring(str.lastIndexOf(" "), str.length);;
                        break;
                    }
                }
            }
            //console.log('returning result... ' + saveResult);
            // res.end('', {
            //     saved : saveResult // get the user out of session and pass to template
            // });
            res.status(200);
            res.send(saveResult);
        });
    });

    app.post('/reply_question', isLoggedIn, function(req, res) {
        var userid = req.user.local.email;
        var choice = Number(req.body.answers) || 0;

        Quiz.findOne({_id: req.body.key}, function(err, questions) {
            if (err) throw err;

            if(questions != null) {
                var final_results = [];
                //overwrite previous responses
                for(var i=0;i<questions.results.length;i++) {
                    if(questions.results[i].indexOf(userid + SEPARATOR) == 0) {
                        //console.log('skipping last results from ' + userid);
                        //questions.results.splice(i, 1);
                    } else {
                        final_results.push(questions.results[i]);
                    }
                }
                final_results.push(userid + SEPARATOR + choice);
                questions.results = final_results;
                questions.save(function(err) {
                    if (err) {
                        throw err;
                        res.send( {reason:"Error saving"}, 403 );
                    }
                    //res.redirect('/');
                    res.send(200);
                });
            } else {
                res.send( {reason:"Not found"}, 404 );
            }

        });
    });

};

// route middleware to make sure a user is logged in

function isLoggedIn(req, res, next) {
    if(req.user != null){
        //console.log('isLoggedIn ' + JSON.stringify(req.user.local.email));
    }
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}


// route middleware to make sure a user is logged in
function isAdmin(req, res, next) {
    isLoggedIn(req, res, function(){
        if (req.user.local.admin)
            return next();
        // if they aren't redirect them to the home page
        res.redirect('/logout');
    });
}

// Dropbox download

function startDropboxImport() {
  if(dpbxImportInterval == null) {
    importFromDropbox();
    dpbxImportInterval = setInterval(importFromDropbox, 300000);
  }
}

function stopDropboxImport() {
  clearInterval(dpbxImportInterval);
  dpbxImportInterval = null;
}

function importFromDropbox() {
  if(BITNAMI) {
    console.log("Dropbox Download: start!");
    if(!cronWorking) {
      cronWorking = true;
      exec(DPBX_SCRIPT_PATH, function(error, stdout, stderr) {
        console.log('Done');
        cronWorking = false;
      });
    } else {
      console.log('Already working');
    }
  } else {
    console.log('Local mode - unable to import photos');
  }
}
