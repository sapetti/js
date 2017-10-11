angular
  .module('ImportDpbx', [])
  .controller('AppCtrl', function($http) {
    var ctrl = this;
    ctrl.importRunning = false;
    ctrl.refreshTime = new Date();

    ctrl.checkImportState = function() {
      console.log('checkImportState');
      $http({
        method: 'GET',
        url: '/dpbxImportStatus'
      }).then(function successCallback(response) {
          console.log('checkImportState - success ' + response.data.running);
          ctrl.importRunning = response.data.running;
        }, function errorCallback(response) {
          ctrl.importRunningError = 'Ocurrio un error al comprobar la importación';
        });
    };

    ctrl.stopImport =function() {
      console.log('stopImport');
      $http({
        method: 'GET',
        url: '/stopImport'
      }).then(function successCallback(response) {
          console.log('stopImport - success ' + response.data.running);
          ctrl.importRunning = response.data.running;
        }, function errorCallback(response) {
          console.log('stopImport - error ' + JSON.stringify(response));
          ctrl.importRunningError = 'Ocurrio un error al parar la importación';
        });
    };

    ctrl.startImport =function() {
      console.log('startImport');
      $http({
        method: 'GET',
        url: '/startImport'
      }).then(function successCallback(response) {
          console.log('startImport - success ' + response.data.running);
          ctrl.importRunning = response.data.running;
        }, function errorCallback(response) {
          console.log('startImport - error ' + JSON.stringify(response));
          ctrl.importRunningError = 'Ocurrio un error al arrancar la importación';
        });
    }

  });
