// app/models/raffle.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var raffleSchema = mongoose.Schema({
    creation_date   : Date,
    winners         : Array
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Raffle', raffleSchema);
