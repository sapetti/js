
var mongoose = require('mongoose');

// define the schema for our session model
var sessionSchema = mongoose.Schema({

    week: String,
    type: String,
    date: Date,
    users: [{
            name: String, 
            creationDate: Date,
            email: String,
            waitList: {type: Boolean, default: false},
            notified: {type: Boolean, default: false}
        }]

});

// methods ======================
// create the model for session and expose it to our app
module.exports = mongoose.model('Session', sessionSchema);
