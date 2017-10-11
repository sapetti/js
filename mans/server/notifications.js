var MAIL_NAME = 'RSE Training app';
var MAIL_ADDRESS = '[[EMAIL]]';
var MAIL_PASS = '[[PASSWORD]]';

var nodemailer = require("nodemailer");

function loginNotificationService() {
    var smtpTransport = nodemailer.createTransport("SMTP",{
        service: "Gmail",
        host: "smtp.gmail.com", 
        secureConnection: true,
        port: 465,
        auth: {
           user: MAIL_ADDRESS, 
           pass: MAIL_PASS 
        }
    });
    return smtpTransport;
}

exports.sendAcceptedMail = function(trainers, workout_date, workout_title, callback) {
    //only send the mail if there is any user in the list
    if(trainers && trainers.length > 0) {
        var message = "Hola REPLACE_NAME, </br></br> <b>Has sido seleccionado</b> para la clase de " + workout_title
                    + " que tendrá lugar el próximo <b>" + getFormattedDate(workout_date) + " a las 18:30</b>";// plaintext body
        sendMail(loginNotificationService(), trainers, workout_title, workout_date, message, callback) ;
    }
};

exports.sendRejectedMail = function(trainers, workout_date, workout_title, callback) {
    //only send the mail if there is any user in the list
    if(trainers && trainers.length > 0) {
        var message = "Hola REPLACE_NAME, </br></br> Lamentablemente <b>no has sido seleccionado</b> para la clase de " + workout_title
                + " del <b>" + getFormattedDate(workout_date) + "</b>";
        sendMail(loginNotificationService(), trainers, workout_title, workout_date, message, callback) ;
    }
};

function sendMail(service, trainers, workout_title, workout_date, message, callback) {
    
    //loop the users
    for(var i=0;i<trainers.length;i++) {
        if(trainers[i] && trainers[i].email) {
            //send mail to each user
            service.sendMail({
              from: MAIL_NAME + " <" + MAIL_ADDRESS + ">", // sender address
              to: trainers[i].email, // comma separated list of receivers
              subject: workout_title + " " + getFormattedDate(workout_date), // Subject line
              html: '<p>'+message.replace('REPLACE_NAME', trainers[i].name)+'</p>'
            }, function(error, response){
              if(error){
                  console.log('Error raised sending notification:: ' + error);
              }else{
                  console.log("Notification sent!");
                  callback();
              }
            });
        }
    }
}

exports.sendPasswordReset = function(email, name, token, host) {
    if(email) {
        console.log('Send passwordReset to ' + email + ' - ' + name + ' - ' + token + ' - ' + host);
        //send mail to the user
        loginNotificationService().sendMail({
          from: MAIL_NAME + " <" + MAIL_ADDRESS + ">", // sender address
          to: email,
          subject: 'Asistente de RSE Training app',
          html: '<p>Hola '+name+',</br></br> Has recibido este email porque has solicitado resetear tu contraseña.</br>' + 
                'Por favor, haz click en el siguiente link o copialo en tu navegador para completar el proceso:</br>' +
              ' <a href="http://' + host + '/reset/' + token + '">Restablecer contraseña</a></br>' +
              'Si no has solicitado crear un nuevo password, por favor ignora este email y tu contraseña no se modificará.</p>'
        }, function(error, response){
          if(error){
              console.log('Error raised sending password reset:: ' + error);
          }else{
              console.log("Password reset sent!");
          }
        });
    }
};

exports.sendResetConfirmation = function(email, name, done) {
    if(done) console.log('Notification done is not null!!');
    if(email) {
        //send mail to the user
        loginNotificationService().sendMail({
          from: MAIL_NAME + " <" + MAIL_ADDRESS + ">", // sender address
          to: email,
          subject: 'Asistente de RSE Training app',
          html: '<p>Hola '+name+',</br></br> Tu password ha sido guardado con exito.</p>'
        }, function(err, response){
          if(err){
              console.log('Error sending password reset notification:: ' + err);
          }else{
              console.log("Password has been changed and notification sent!");
          }
          done(err);
        });
    }
};

function getFormattedDate(workout_date) {
    return workout_date.getDate() + '/' + (workout_date.getMonth()+1)  + '/' + workout_date.getFullYear();
}