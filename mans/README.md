#RSE Training app

The aim of this MEAN application is to track the workouts for Functional Training and Pilates coursed in Mans.

##Platforms and Frameworks: 
- Cloud 9 ide 
- Amazon AWS EC2 
- Nodejs 
- Express 
- Angularjs 
- MongoDB 
- Mongoose 
- Nodemailer 
- Node-schedule

##Functional specs: 
- El horario de las clases es: o Entrenamiento Funcional los lunes de 18:30 a 19:30 hrs. o Pilates los martes de 18:30 a 19:30 hrs. 
- Estas clases están abiertas para todos los colaboradores que estén interesados en asistir, con un máximo de 7 alumnos por clase a la semana. 
- Una persona no podrá hacer inscripciones para varias semanas. Solo se puede hacer inscripciones para la siguiente clase. 
- Para inscribirse a una clase, tendrán preferencia aquellas personas que no hayan asistido a ese mismo grupo la semana anterior. Las personas que quieran inscribirse a una clase a la que asistieron la semana anterior, pasarán a formar parte de una lista de reservas por orden de inscripción, a la espera de si se cubren las 7 plazas. En caso de que no se inscriban 7 personas más, se completarán las plazas con las personas de la lista de reservas. 
- Una misma persona sólo podrá participar en un grupo por semana, a excepción de que no se cubran las plazas en alguno de los grupos, en cuyo caso aplica el punto anterior. 
- Las inscripciones podrán realizarse hasta un máximo de 24 horas antes de que inicie la clase de cada grupo, a no ser, que no se hayan cubierto las 7 plazas, caso en el que se podrán recibir inscripciones hasta completar aforo sin restricción alguna. 
- 24 horas antes del inicio de cada clase, la aplicación deberá emitir un aviso a los alumnos que han solicitado inscripción, para informarles de si finalmente participarán o no en la clase a la que se inscribieron.