const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false
    },
    content: {
        type: String,
        required: false
    },
    attachments: {
        type: [String],
        required: false
    },
    userID: {
        type: String,
        required: true
    },
    collectionTitle: {
        type: String,
        required: true
    },
    collectionID: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    edited: {
        type: Date,
        default: Date.now
    },
    collaborators: {
        type: [String],
        required: false
    }
});

const Note = mongoose.model('Note', NoteSchema);

module.exports = Note;