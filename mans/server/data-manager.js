
var crypto = require('crypto');
var async = require('async');
var notifications = require('./notifications');
var Session           = require('./model/session');
var User              = require('./model/user');

var MAX_PLACES = 7;
var FUNCTIONAL = 'functional';
var PILATES = 'pilates';
var THIS_WEEK = 'thisWeek';
var LAST_WEEK = 'lastWeek';
var FUNCTIONAL_DAY = 1;
var PILATES_DAY = 2;
var DELETE_JSON_ELEMENT = 'DELETE JSON ELEMENT';

//initialize db values
setupData();

exports.getDeleteJSONElement = function() {
  return DELETE_JSON_ELEMENT;
};

exports.getMaxPlaces = function() {
  return MAX_PLACES;
};

exports.getFunctional = function() {
  return FUNCTIONAL;
};

exports.getPilates = function() {
  return PILATES;
};

exports.getFunctionalDay = function() {
  return FUNCTIONAL_DAY;
};

exports.getPilatesDay = function() {
  return PILATES_DAY;
};

/**
 * Returns the data for the requested workout
 * -lastWeek: True for lastWeek data, false for thisWeek
 * -callback: callback to be called if needed
 * @method
 */
exports.getWorkout = function(type, lastWeek, callback) {
    Session.findOne({type: type, week: (lastWeek? LAST_WEEK:THIS_WEEK)}, 
      function(err, session) {
        if (err) throw err;
        callback(session);
      });
    
};

/**
 * Add the user sent as parameter to the users for the next workout session
 * -name: User name
 * -type: Workout type (functional or pilates)
 * -email: email address
 * -callback: callback to be called if needed
 * @method
 */
exports.addUserToList = function (name, type, email, callback) {
  var otherGroup = type == FUNCTIONAL ? PILATES : FUNCTIONAL;
  var count = MAX_PLACES;
  
  //Find sessions to compare if the user is already in any list
  Session.find({}, function(err, sessions) {
      if (err) throw err;
      
      if(sessions && sessions.length > 0) {
        var thisWeek = {},
          lastWeek = {};
         
        //gather info from this weeks sessions, and from same workout type of the last week 
        for(var i=0;i<sessions.length;i++) {
          if(sessions[i].week == THIS_WEEK) {
            thisWeek[sessions[i].type] = sessions[i];
          } else if(type == sessions[i].type) {
            lastWeek[type] = sessions[i];
          }
        }
        //create the user object
        var userToSave = {name: name, creationDate: new Date(), email: email};
        //Check if the user was in last workout session or in the session for the other workout
        //if so, set it in the awaiting list
        userToSave.waitList = checkUserInList(userToSave, lastWeek[type].users) 
              || checkUserInList(userToSave, thisWeek[otherGroup].users);
        
        //Check if the user is already in the list
        for(var i=0;i<thisWeek[type].users.length;i++) {
          if(thisWeek[type].users[i].email.toUpperCase() == email.toUpperCase()) {
            return callback ? callback(null, {error:'Usuario ya registrado'}) : {error:'Usuario ya registrado'};
          }
          if(!thisWeek[type].users[i].waitList) {
            count--;
          }
        }
        if(count < 1) {
          console.log('No remaining places in this workout')
          return callback ? callback(null, {error:'Plazas completas'}) : {error:'Plazas completas'};
        }
        
        //save the session with its changes
        for(var i=0;i<sessions.length;i++) {
          if(sessions[i].week == THIS_WEEK && sessions[i].type==type) {
            
            sessions[i].users.push(userToSave);
            sessions[i].save(function(err) {
               if (err) throw err;
               callback(null, {});
            });
            
            break;
          }
        }
        
      } else {
        return callback ? callback(null, {error:'Session no encontrada'}) : {error:'Session no encontrada'};
      }
      
  });
  
};

/**
 * Add the user sent as parameter to the users for the next workout session
 * -users: Users to modify
 * -type: Workout type (functional or pilates)
 * -key: property name to change
 * -value: value to be set (if it matches DELETE_JSON_ELEMENT, the property will be removed)
 * @method
 */
exports.updateUserOnProperty = function (users, type, key, value) {
  Session.findOne({type: type, week: THIS_WEEK}, function(err, session) {
      if (err) throw err;
      var changes = false; //to track if the session must be saved
      for(var i=0;i<users.length;i++) {
        for(var j=0;j<session.users.length;j++) {
          if(users[i].email == session.users[j].email && users[i].name == session.users[j].name) {
            if(value != DELETE_JSON_ELEMENT) {
              session.users[j][key] = value;
            } else {
              delete session.users[j][key];
            }
            changes = true;
          }
        }
      }
      if(changes) {
        session.save(function(err) {
           if (err) throw err;
        });
      }
    });
};

/**
 * Called to move the data from thisWeek to lastWeek and sets {} for thisWeek
 * -initilizate: Just to indicate if the data must be initializated or if thisWeeks's data must be moved to lastWeek
 * -workout_type: Workout type (functional or pilates)
 * @method
 */
exports.bulkData = function (workoutType) {
  return bulkDataLocal(workoutType);
};

function bulkDataLocal(workoutType) {
    //setupData(data, initilizate, workout_type);
  Session.find({}, function(err, sessions) {
    if(err) throw err;
    var index = {};
    for(var i=0;i<sessions.length;i++) {
      index[sessions[i].week + sessions[i].type] = i;
    }
    //Remove obsolete data for the previous ending week
    sessions[index[LAST_WEEK + workoutType]].remove();
    //Save data of the ending week
    sessions[index[THIS_WEEK + workoutType]].week = LAST_WEEK;
    sessions[index[THIS_WEEK + workoutType]].save();
    //Initializate data structure for the starting week
    var workoutDay = workoutType == FUNCTIONAL? FUNCTIONAL_DAY : PILATES_DAY;
    initializateWeekSession(THIS_WEEK, workoutType, getNextDayOfWeek(new Date(), workoutDay));
  });
}

exports.passwordReset = function(token, callback) {
  User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        callback(err, user);
      });
};

exports.updatePassword = function(password, token, done, loginCallback, errorCallback) {
  console.log('search for :: ' + token);
  User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gte: Date.now() } }, function(err, user) {
    if (!user) {
      console.log('User NOT retrieved');
      return errorCallback('La clave para restablecer la contraseña no es valida o ha expirado');
    }
    console.log('User retrieved:: ' + user.email);
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    user.save(function(err) {
      if(err) throw err;
      return loginCallback(done, user);
    });
  });
};

exports.setupPasswordReset = function(email, host, successCallback, errorCallback) {
      async.waterfall([
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          if(token) console.log('Token generated');
          User.findOne({ email: email }, function(err, user) {
            if (!user) {
              // req.flash('error', 'No existe ninguna cuenta con esa dirección de correo');
              // return res.redirect('/forgot');
              return errorCallback('No existe ninguna cuenta con esa dirección de correo');
            }
    
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
            user.save(function(err) {
              done(err, token, user);
            });
          });
        },
        function(token, user, done) {
            notifications.sendPasswordReset(user.email, user.name, token, host);
            successCallback();
        }
      ], function(err) {
        if (err) throw err;
        return errorCallback('No se pudo completar su petición, intentelo más tarde.');
      });
};

/**
 * Called to initialize data structure if needed
 * @method
 */
function setupData() {
  Session.find({}, function(err, sessions) {
    if(err) throw err;
    
    if(!sessions || sessions.length < 1) {
      console.log('setupData');
      //there isn't any existing data, create the structure in db
      initializateWeekSession(THIS_WEEK, FUNCTIONAL, getNextDayOfWeek(new Date(), FUNCTIONAL_DAY));
      initializateWeekSession(LAST_WEEK, FUNCTIONAL, getNextDayOfWeek(new Date((new Date()).getTime() - 7 * 24 * 60 * 60 * 1000), FUNCTIONAL_DAY));
      initializateWeekSession(THIS_WEEK, PILATES, getNextDayOfWeek(new Date(), PILATES_DAY));
      initializateWeekSession(LAST_WEEK, PILATES, getNextDayOfWeek(new Date((new Date()).getTime() - 7 * 24 * 60 * 60 * 1000), PILATES_DAY));
    } else {
      //check if after a application restart there is outdated data
      //if so, update it
      var workouts_outdated = [];
      var i =0;
      for(i=0;i<sessions.length;i++) {
        if(sessions[i].week == THIS_WEEK && (new Date()) > sessions[i].date) {
          console.log('updateData for ' + sessions[i].type);
          workouts_outdated.push(sessions[i].type);
        }
      }
      for(i=0;i<workouts_outdated.length;i++) {
          console.log('updatingData for ' + workouts_outdated[i]);
        bulkDataLocal(workouts_outdated[i]);
      }
    }
  });
}

function initializateWeekSession(workoutWeek, workoutType, workoutDate) {
  var workout = new Session({week: workoutWeek, type: workoutType, date: workoutDate, users: []});
  workout.save();
}

/**
 * Returns the closest day that matches the day of week. Used to get the next training session day
 * i.e.: 
 *    getNextDayOfWeek(12/08/2015, 1) -> 17/08/2015 (as is the closest Monday)
 *    getNextDayOfWeek(12/08/2015, 2) -> 18/08/2015 (as is the closest Tuesday)
 *    getNextDayOfWeek(12/08/2015, 3) -> 12/08/2015 (as is the closest Wednesday)
 *    getNextDayOfWeek(12/08/2015, 4) -> 13/08/2015 (as is the closest Thursday)
 *    getNextDayOfWeek(12/08/2015, 5) -> 14/08/2015 (as is the closest Friday)
 *    getNextDayOfWeek(12/08/2015, 6) -> 15/08/2015 (as is the closest Saturday)
 *    getNextDayOfWeek(12/08/2015, 0) -> 16/08/2015 (as is the closest Sunday)
 * -date: Date of the week when the day must be extracted
 * -dayOfWeek: From 0 to 6 (Sunday to Saturday), day needed
 * @method
 */
function getNextDayOfWeek(date, dayOfWeek) {
    var resultDate = new Date(date.getTime());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
    return resultDate;
}

/**
 * Returns true if a user is in the given list, used to validate when a must be in the awaiting list.
 * If the user is in the awaiting list is like it is not in that list
 */
function checkUserInList(user, user_list)  {
  for(var j=0;j<user_list.length;j++) {
      if(user.email.toUpperCase() == user_list[j].email.toUpperCase() && !user_list[j].waitList) {
        return true;
      }
    }
  return false;
}
