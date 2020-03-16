const LocalStrategy = require('passport-local').Strategy;
const sha256 = require('sha256');
const User = require('../models/User');

module.exports = function (passport) {
    passport.use(new LocalStrategy({usernameField: 'email'}, function (email, password, done) {
        User.findOne({$or: [{email: email}, {username: email}]}, function (err, user) {
            // se accepta autentificarea username-parola sau email-parola
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {msg: 'User does not exist.'});
            }
            let hash = sha256(user.salt + password);
            return user.validPassword(hash) ?
                done(null, user) :
                done(null, false, {msg: 'Incorrect password.'});
        });
    }));

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
};