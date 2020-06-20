const mongoose = require('mongoose');

const CollectionSchema = new mongoose.Schema({
    title: {
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

const Collection = mongoose.model('Collection', CollectionSchema);

module.exports = Collection;