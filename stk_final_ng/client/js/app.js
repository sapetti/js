(function() {

  var slideshow = null;
  var PHOTO = 'photo';
  var RESULTS = 'results';
  var RAFFLE = 'raffle';
  var QUIZ = 'quiz';

  function indexCtrl(socket, $mdToast) {
    //Init variables
    var ctrl = this;
    ctrl.photo = '/photos/home.jpg';
    ctrl.quiz = {};
    ctrl.results = {};
    ctrl.winners = [];
    ctrl.fullScreen = false;

    //Functions
    ctrl.showPanel = function(panel) {
      ctrl.showPhoto = (panel == PHOTO);
      ctrl.showQuiz = (panel == QUIZ);
      ctrl.showResults = (panel == RESULTS);
      ctrl.showRaffle = (panel == RAFFLE);
    };

    ctrl.isWinner = function(userName) {
      if(ctrl.results.winners != null) {
        //ctrl.results.winners.indexOf(particpant.name) > -1;
        for(var item in ctrl.results.winners) {
          if(ctrl.results.winners[item] == userName) {
            return true;
          }
        }
      }
      return false;
    };

    //Initializate state
    ctrl.showPanel(PHOTO);

    //----------------------------------------------->> Slideshow

    socket.on('emitPhoto', function (data) {
        ctrl.photo = data.path + '/' + data.photo + '?' + Math.random();
    });

    //----------------------------------------------->> Quiz

    socket.on('showQuestion', function (data) {
        ctrl.showPanel(QUIZ);
        ctrl.quiz.key = data.key;
        ctrl.quiz.number = data.number;
        ctrl.quiz.q = data.q;
        ctrl.quiz.a = data.a;
        ctrl.selected = 0;

        $.get("/check_user_values", { key: data.key }, function(data, status){
            if(data != null) {
                ctrl.selected = Number(data.trim());
            }
        });

    });


    // //add submit behavior
    $( "#replyQuestion" ).submit(function( event ) {
      event.preventDefault();
      $.ajax({
          type: "POST",
          url: "/reply_question",
          data: $("#replyQuestion").serialize(),
          success: function(data) {
              $mdToast.show(
                $mdToast.simple()
                  .content('Su respuesta ha sido enviada!')
                  .position('top left')
                  .hideDelay(3000)
              );
              socket.emit('updateResults');
          },
          failure: function(data) {
              $mdToast.show(
                $mdToast.simple()
                  .content('Error:: Su respuesta NO ha sido enviada!')
                  .position('top left')
                  .hideDelay(3000)
              );
              console.log('sendReply failed ');
              socket.emit('updateResults');
          }
      });
    });

    socket.on('refresh', function (data) {
        ctrl.showPanel(PHOTO);
    });

    socket.on('showResults', function (data) {
        ctrl.showPanel(RESULTS);
        ctrl.results.max = new Array(data.max);
        ctrl.results.winners=[];
        ctrl.results.participants = [];
        for(var key in data.results) {
            var total = 0;
            var participant = {};
            participant.name = key;
            participant.isWinner = data.results[key].isWinner;
            participant.q = {};
            for(var i=0;i<data.max;i++) {
                if(i<data.results[key].q.length && data.results[key].q[i]!= null && data.results[key].q[i] == true) {
                    participant.q[i] = true;
                    total++;
                } else {
                    participant.q[i] = false;
                }
            }
            ctrl.results.participants.push(participant);
        }
    });

    //----------------------------------------------->> Raffle

    socket.on('newWinnerTable', function (data) {
      ctrl.showPanel(RAFFLE);
      ctrl.winners = data.n;
    });

    socket.on('showRaffle', function (data) {
      ctrl.showPanel(RAFFLE);
      ctrl.winners = [];
    });
  }

    angular.module('CenaSTK', ['ngMaterial', 'ngMdIcons', 'ngAnimate', 'btford.socket-io'])
      .factory('socketio', ['$rootScope', function ($rootScope) {
        var socket = io.connect(getUrl());
        return {
          on: function (eventName, callback) {
            socket.on(eventName, function () {
              var args = arguments;
              $rootScope.$apply(function () {
                callback.apply(socket, args);
              });
            });
          },
          emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
              var args = arguments;
              $rootScope.$apply(function () {
                if (callback) {
                  callback.apply(socket, args);
                }
              });
            })
          }
        };
      }])
      .controller('ngIndexCtrl', ['socketio','$mdToast', indexCtrl])
      .config(function($mdThemingProvider) {
          $mdThemingProvider.theme('default')
              .primaryPalette('orange', {
                'default': '600',
                'hue-1': '200',
                'hue-2': '900',
                'hue-3': 'A700'
              })
              .accentPalette('yellow', {
                'default': '600',
                'hue-1': '200',
                'hue-2': '900',
                'hue-3': 'A700'
              })
              .warnPalette('amber', {
                'default': '600',
                'hue-1': '200',
                'hue-2': '900',
                'hue-3': 'A700'
              });

    });
})();
