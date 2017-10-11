// app/models/quiz.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var quizSchema = mongoose.Schema({
    question        : String,
    creation_date   : Date,
    solution        : Number,
    answers         : [String],
    results         : [String]
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Quiz', quizSchema);
