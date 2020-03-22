const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true
    },
    noteID: {
        type: String,
        required: true
    },
    collectionID: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

const Link = mongoose.model('Link', LinkSchema);

module.exports = Link;