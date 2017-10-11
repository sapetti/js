

var Quiz            = require('../app/model/quiz');
var User            = require('../app/model/user');
var Raffle          = require('../app/model/raffle');

var BITNAMI = false;

var PHOTO_MODE  = 'PHOTO_MODE';
var QUIZ_MODE   = 'QUIZ_MODE';
var RAFFLE_MODE = 'RAFFLE_MODE';

var camera_path = BITNAMI ? '/home/bitnami/fotos' : '/home/pi/fotos';//__dirname + '/../../../fotos';

var raffle_users_path = '/../data/raffle_users.txt';
var fs = require("fs");
var photoCount = 0;
var questionCount = -1;
var app_mode = PHOTO_MODE; //Set this to false!!
var slideshow = null;
var participants = null;
var winners = [];
var sockets_ids = {};

module.exports = function(app, server, io) {

    io.on('connection', function (socket) {

        socket.on('endQuiz', function() {
            //the quiz has ended, restart the slideshow
            app_mode = PHOTO_MODE;
            io.sockets.emit('refresh');
            startSlideshow(io);
         });

         socket.on('restartQuiz', function() {
            stopSlideshow();
            questionCount = -1;
            //deleting previous results
            var count = 0;
            Quiz.find({}).sort({creation_date: 1}).exec(function(err, questions) {
                if (err) throw err;
                if(questions != null && questions.length > 0) {
                    for(var i=0;i<questions.length;i++) {
                        questions[i].results = [];
                        questions[i].save(function(err) {
                            if (err) throw err;
                            count++;
                            if(count == questions.length) {
                                showQuestion(io);
                            }
                        });
                    }
                } else {
                    showQuestion(io);
                }
            });
         });

        socket.on('previousQuestion', function() {
            questionCount = questionCount - 1;
            showQuestion(io);
         });

        socket.on('nextQuestion', function() {
            questionCount++;
            showQuestion(io);
         });

        socket.on('updateResults', function() {
            //retrieve non admin users
            User.find({}, function(err, users) {
                if (err) throw err;
                var jsonResults = {};
                //retrieve the results
                Quiz.find({}).sort({creation_date: 1}).exec(function(err, questions) {
                    if (err) throw err;
                    for(var i=0;i<questions.length;i++) {
                        //restart values for each user
                        for(var z=0;z<users.length;z++) {
                            if(users[z].local.admin != true) {
                                if(jsonResults[users[z].local.email] == null) jsonResults[users[z].local.email] = [];
                                jsonResults[users[z].local.email][i] = -1;
                            }
                        }
                        for(var j=0;j<questions[i].results.length;j++) {
                            var str = questions[i].results[j];
                            var username = str.substring(0, str.indexOf(" "));
                            var savedResult = str.substring(str.lastIndexOf(" "), str.length);;
                            jsonResults[username][i]=savedResult;
                        }
                    }
                    io.sockets.emit('updateResultsTable', {data: jsonResults, max: questions.length});     //add handler at quiz view to handle this and display the table
                });
            });
        });

        //----------------------------------------------------------------------
        //RAFFLE ---------------------------------------------------------------
        //----------------------------------------------------------------------

        socket.on('chooseWinner', function() {
            chooseWinnerForRaffle(io);
        });

        socket.on('restartRaffle', function() {
            stopSlideshow();
            winners = [];
            participants = null;
            showRaffle(io);
        });

        if(app_mode == QUIZ_MODE) {
            stopSlideshow();
            showQuestion(io, socket.id);
        } else if(app_mode == RAFFLE_MODE) {
            stopSlideshow(io);
            showRaffle(io, socket.id);
        } else  {
	          startSlideshow(io);
        }

    });
}

function startSlideshow(io) {
    if(slideshow == null) {
        slideshow = setInterval(function () {
            displayPhoto(io);
        }, 10000);
    }
}

function stopSlideshow() {
    clearInterval(slideshow);
    slideshow=null;
}

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function showQuestion(io, socketId) {
    app_mode = QUIZ_MODE;
    var options = {
        "sort": "creation_date"
    }
    Quiz.find({}).sort({creation_date: 1}).exec(function(err, questions) {
         if (err) throw err;
         if(questionCount < 0) questionCount = 0;
         if(questionCount >= questions.length) {
            questionCount = questions.length;
            showResults(io, questions);
         } else {
            var dataToSend = {q: questions[questionCount].question,
                a: questions[questionCount].answers, key: questions[questionCount]._id,
                s: questions[questionCount].results, number: questionCount
            };
            io.sockets.emit('showQuestionToAdmin', dataToSend);

            if(socketId) {
                //a socket replied to a question and the page is being reloaded
                io.sockets.socket(socketId).emit('showQuestion', dataToSend);
            } else {
                //the quiz has started, init all users
                io.sockets.emit('showQuestion', dataToSend);
            }
         }
    });
}

function displayPhoto(io, socketId) {
    fs.readdir(camera_path, function(err, files) {

        if (err) throw err;
        if(photoCount >= files.length) photoCount = 0;
        if(socketId == null) {
            io.sockets.emit('emitPhoto', {path: '/photos', photo: files[photoCount]});
            photoCount++;
        } else {
            var photoId = photoCount - 1;
            if(photoId < 0) {
                photoId = files.length - 1;
            }
            io.sockets.socket(socketId).emit('emitPhoto', {path: '/photos', photo: files[photoId]});
        }
    });
}

function showResults(io, questions) {
    User.find({}, function(err, users) {
        if (err) throw err;

        var jsonResults = {};
        var max = 0;
        var winnerTracking = {};
        for(var i=0;i<questions.length;i++) {
            for(var z=0;z<users.length;z++) {
                if(users[z].local.admin != true) {
                    if(jsonResults[users[z].local.email] == null) {
                      jsonResults[users[z].local.email] = {};
                      jsonResults[users[z].local.email].q = [];
                    }
                    jsonResults[users[z].local.email].q[i] = false;
                }
            }
            for(var j=0;j<questions[i].results.length;j++) {
                var str = questions[i].results[j];
                var username = str.substring(0, str.indexOf(" "));
                var savedResult = str.substring(str.lastIndexOf(" "), str.length);;
                var isRight = (questions[i].solution == savedResult) ? true : false;
                jsonResults[username].q[i]=isRight;
                if(jsonResults[username].total == undefined)
                  jsonResults[username].total = 0;
                if(isRight) {
                  jsonResults[username].total = 1 + jsonResults[username].total;
                  if(winnerTracking[jsonResults[username].total] == undefined)
                    winnerTracking[jsonResults[username].total] = [];
                  if(max < jsonResults[username].total)
                    max = jsonResults[username].total;
                  winnerTracking[jsonResults[username].total].push(username);
                }
            }
        }

        if(winnerTracking[max] != null) {
          for(var i=0;i<winnerTracking[max].length;i++){
            jsonResults[winnerTracking[max][i]].isWinner = true;
          }
        }

        io.sockets.emit('showResults', {results: jsonResults, max: questions.length});
    });
}


function showRaffle(io, socketId) {
    app_mode = RAFFLE_MODE;
    stopSlideshow();

    if(socketId) {
	       io.sockets.socket(socketId).emit('showRaffle', {w: winners });
    } else {
        io.sockets.emit('showRaffle', {w: winners });
    }
}

function chooseWinnerForRaffle(io) {
    //Load the participant list the first time
    if(participants == null) {
        //Read the file that contains the names
        fs.readFile(__dirname + raffle_users_path, function (err, data) {
          if (err) throw err;
          //Split the file content and set it into the array
          participants = data.toString().split(',');
          console.log('participants length :: ' + participants.length);
          //Now choose one participant
          chooseWinnerForRaffle(io);
        });
    } else {
        //The participants are loaded, now return one!
        //First shuffle the participants
        participants = shuffle(participants);
        if(participants.length > 0) {
            //If there are participants, pick one
            var winner = participants.pop().trim();
            winners.push(winner);

            io.sockets.emit('newWinner', { w: winner });
            setTimeout(function() {
              io.sockets.emit('newWinnerTable', { n: winners });
            }, 10000);

        } else {
            //No more participants, update the list displayed
            io.sockets.emit('showRaffle', { w: winners });
        }
    }
}
