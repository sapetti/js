
//Set the local timezone
var time = require("time");
time.tzset("Europe/Madrid");
Date = time.Date;

module.exports = function(notifications, dataManager) {
    // Declare
    var cron = require('node-schedule');
    var max_accepted = dataManager.getMaxPlaces();
    
    //Notification schedule for Functional Training
    var FUNCTIONAL_PREVIOUS_DAY_18_TO_22 = {hour: [18, 19, 20, 21, 22], minute: 30, dayOfWeek: dataManager.getFunctionalDay()-1};
    var FUNCTIONAL_DAY_10_TO_17 = {hour: [10, 11, 12, 13, 14, 15, 16, 17], minute: 30, dayOfWeek: dataManager.getFunctionalDay()};
    var FUNCTIONAL_DAY_LAST_CALL = {hour: 18, minute: 0, dayOfWeek: dataManager.getFunctionalDay()};
    var FUNCTIONAL_DAY_RENEW_SESSION = {hour: 1, minute: 0, dayOfWeek: dataManager.getFunctionalDay()+1};
    
    //Notification schedule for Pilates
    var PILATES_PREVIOUS_DAY_18_TO_22 = {hour: [18, 19, 20, 21, 22], minute: 30, dayOfWeek: dataManager.getPilatesDay()-1};
    var PILATES_DAY_10_TO_17 = {hour: [10, 11, 12, 13, 14, 15, 16, 17], minute: 30, dayOfWeek: dataManager.getPilatesDay()};
    var PILATES_DAY_LAST_CALL = {hour: 18, minute: 0,  dayOfWeek: dataManager.getPilatesDay()};
    var PILATES_DAY_RENEW_SESSION = {hour: 1, minute: 0, dayOfWeek: dataManager.getPilatesDay()+1};
    
    //cronjobs for Functional
    cron.scheduleJob(FUNCTIONAL_PREVIOUS_DAY_18_TO_22, function(){
            console.log('Scheduled notifications... FUNCTIONAL_PREVIOUS_DAY_18_TO_22');
            sendNotifications(dataManager.getFunctional(), 'Entrenamiento funcional', false);
        });
    
    cron.scheduleJob(FUNCTIONAL_DAY_10_TO_17, function(){
            console.log('Scheduled notifications... FUNCTIONAL_DAY_10_TO_17');
            sendNotifications(dataManager.getFunctional(), 'Entrenamiento funcional', false);
        });
    
    cron.scheduleJob(FUNCTIONAL_DAY_LAST_CALL, function(){
            console.log('Scheduled notifications... FUNCTIONAL_DAY_LAST_CALL');
            sendNotifications(dataManager.getFunctional(), 'Entrenamiento funcional', true);
        });
    
    cron.scheduleJob(FUNCTIONAL_DAY_RENEW_SESSION, function(){
            console.log('Scheduled bulk data... FUNCTIONAL_DAY_RENEW_SESSION');
            // bulk functional workout info with news session date
            dataManager.bulkData(dataManager.getFunctional());
        });
    
    
    //cronjobs for Pilates
    cron.scheduleJob(PILATES_PREVIOUS_DAY_18_TO_22, function(){
            console.log('Scheduled notifications... PILATES_PREVIOUS_DAY_18_TO_22');
            sendNotifications(dataManager.getPilates(), 'Pilates', false);
        });
    
    cron.scheduleJob(PILATES_DAY_10_TO_17, function(){
            console.log('Scheduled notifications... PILATES_DAY_10_TO_17');
            sendNotifications(dataManager.getPilates(), 'Pilates', false);
        });
    
    cron.scheduleJob(PILATES_DAY_LAST_CALL, function(){
            console.log('Scheduled notifications... PILATES_DAY_LAST_CALL');
            sendNotifications(dataManager.getPilates(), 'Pilates', true);
        });
    
    cron.scheduleJob(PILATES_DAY_RENEW_SESSION, function(){
            console.log('Scheduled bulk data... PILATES_DAY_RENEW_SESSION');
            // bulk pilates workout info with news session date
            dataManager.bulkData(dataManager.getPilates());
        });
    
    /**
     * This function loops the users retrieved from the dataManager for the given workout and
     * filters what of them are accepted, rejected or reserve accepted in the last call.
     * After that, if it is the time ask to the notification service to send the notification mails.
     * -type: workout type
     * -workout_title: title to display in the mail
     * -lastCall: true if it is the lastCall that will be done for the users for the given workout session
     * @method
     */
    function sendNotifications(type, workout_title, lastCall) {
        var accepted = [];
        var rejected = [];
        var count = 0;
        dataManager.getWorkout(type, false, function(data) {
            //review which users will be accepted in the workout and which ones will be rejected
            var users = data.users;
            for(var i=0;i<users.length;i++) {
                if(!users[i].waitList && count<max_accepted) {
                    if(!users[i].notified) {
                        accepted.push(users[i]);
                    }
                    count++;
                } else if(!users[i].notified) {
                    rejected.push(users[i]);
                }
            }
            
            //notify those accepted users that were not notified previously
            notifications.sendAcceptedMail(accepted, data.date, workout_title, function() {
                dataManager.updateUserOnProperty(accepted,type,'notified',true);
            });
            
            if(count>=max_accepted) {
                //all places are ocupated, send rejected mails to all rejected users
                notifications.sendRejectedMail(rejected, data.date, workout_title, function() {
                    dataManager.updateUserOnProperty(rejected,type,'notified',true);
                });
                
            } else if(lastCall) {
                //it is last call, but there are remaining places in the workout
                var lastCallUsers = [];
                for(var j=count;j<max_accepted;j++){
                    //fill the remaining places
                    lastCallUsers.push(rejected.splice(0,1)[0]);
                }
                //notify new accepted users
                notifications.sendAcceptedMail(lastCallUsers, data.date, workout_title, function() {
                    dataManager.updateUserOnProperty(lastCallUsers,type,'notified',true);
                    dataManager.updateUserOnProperty(lastCallUsers,type,'waitList',false);
                });
                
                //notify finally rejected users
                notifications.sendRejectedMail(rejected, data.date, workout_title, function() {
                    dataManager.updateUserOnProperty(rejected,type,'notified',true);
                });
            }
        });
    }
};