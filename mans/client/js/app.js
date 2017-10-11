
(function() {
    
    /**
     * Controllers
     */
    angular.module('FunctionalLastWeekController', []).controller('functionalLastWeekCtrl', ['$scope','$http', '$window',
        function($scope,$http,$window) {
            var controller = this;
            $http.get('/get_training', {params:{type: 'functional', lastWeek: true}}).
              then(function(response) {
                controller = setupDataForPlanningWidget(response, controller, $scope, $window, 'functional', 'lastWeek', 'Entrenamiento funcional');
              });
        }]);
    
    angular.module('FunctionalCurrentWeekController', []).controller('functionalCurrentWeekCtrl', ['$scope','$http', '$window',
        function($scope,$http,$window) {
            var controller = this;
            $http.get('/get_training', {params:{type: 'functional'}}).
              then(function(response) {
                controller = setupDataForPlanningWidget(response, controller, $scope, $window, 'functional', 'thisWeek', 'Entrenamiento funcional');
              });
        }]);
    
    angular.module('PilatesLastWeekController', []).controller('pilatesLastWeekCtrl', ['$scope','$http', '$window',
        function($scope,$http,$window) {
            var controller = this;
            $http.get('/get_training', {params:{type: 'pilates', lastWeek: true}}).
              then(function(response) {
                controller = setupDataForPlanningWidget(response, controller, $scope, $window, 'pilates', 'lastWeek', 'Pilates');
              });
        }]);
    
    angular.module('PilatesCurrentWeekController', []).controller('pilatesCurrentWeekCtrl', ['$scope','$http', '$window',
        function($scope,$http, $window) {
            var controller = this;
            $http.get('/get_training', {params:{type: 'pilates'}}).
              then(function(response) {
                controller = setupDataForPlanningWidget(response, controller, $scope, $window, 'pilates', 'thisWeek', 'Pilates');
              });
        }]);    
        
    angular.module('SubmitUserController', []).controller('submitUserCtrl', ['$scope', '$http','$resource', 
    
        function($scope, $http, $resource) {
          var controller = this;
          controller.data = {};
          //controller.data.name = '';
          controller.data.type = 'functional';
          $scope.addUser = function() {
            var User = $resource('/add_user', {charge: {method:'POST', params:{charge:true}}});
            var user = new User();
            //user.name = controller.data.name;
            //user.mail = controller.data.mail;
            user.type = controller.data.type;
            user.$save(
              function(response){
                
                if(!response.error) {
                  users_data = users_data || {};
                  users_data.thisWeek = users_data.thisWeek || {};
                  users_data.thisWeek[controller.data.type] = response;
                  //controller.data.name = '';
                  //controller.data.mail = '';
                  controller.data.type = 'functional';
                  delete controller.formError;
                } else {
                  controller.formError = 'La petición no se pudo ejecutar :: ' + response.error; //TODO: show error
                }
              }
            );
              
          };
        }]);
    
    angular.module('ScheduleController', []).controller('scheduleCtrl', 
        function($scope, $http, session) {
          $scope.active = session.data.active;
        });
        
    /**
     * Directives
     */
    angular.module('TrainingDirective', []).directive('planningWidget', function() {
        return {
            restrict: 'E',
            templateUrl: 'views/directives/planning-widget.html'
        };
    });
    
    /**
     * Main app
     */
    
    angular.module('TrainingApp', 
    ['ngRoute',
    'ngResource',
    'FunctionalLastWeekController',
    'FunctionalCurrentWeekController',
    'PilatesLastWeekController',
    'PilatesCurrentWeekController',
    'ScheduleController',
    'SubmitUserController',
    'TrainingDirective']) //Missing js library
        .config(['$routeProvider',
          function($routeProvider) {
            $routeProvider.
              when('/', {
                templateUrl: 'views/schedule.html',
                controller: 'scheduleCtrl',
                controllerAs: 'schedule',
                resolve: {
                  session: isActive
                }
              });
          }]);
})();

var users_data = {};
users_data.thisWeek = {};
users_data.lastWeek = {};

function isActive($http){
  var promise = $http({ 
    method: 'GET', 
    url: '/is_active' 
  });
  promise.success(function(data, status, headers, conf) {
    if(!data.active) {
      return false;
    }
    return true;
  });
  return promise;
}

function setupDataForPlanningWidget(response, controller, $scope, $window, type, week, title) {
  //initialize data structure
  $scope.data = users_data || {};
  $scope.data[week] = users_data[week] || {};
  $scope.data[week][type] = users_data[week][type] || {};
  //set data from response
  if(response.data && response.data.users) {
    users_data[week][type] = response.data;
    //set controller specific data
    controller.data = {};
    controller.data.week = week;
    controller.data.type = type;
    controller.data.title = title;
    return controller;
  } else {
    $window.location.href = '/logout';
  }
}
