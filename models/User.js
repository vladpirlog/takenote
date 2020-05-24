const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    salt: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        default: Date.now,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    verificationLink: {
        type: String,
        required: false,
    },
});

UserSchema.methods.validPassword = function (password) {
    return this.password === password;
};

UserSchema.methods.isVerified = function () {
    return this.verified;
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
