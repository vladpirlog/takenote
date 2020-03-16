const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const User = require('../models/User');
const sha256 = require('sha256');
const randomString = require('randomstring');

// GET register page
// router.get('/', function (req, res, next) {
//     return res.render('register', {title: 'Register'});
// });

const validationRequirements = [
    check('username', 'Username must contain letters and numbers only.').isAlphanumeric(),
    check('username', 'Username must have between 4 and 12 characters.').isLength({min: 4, max: 12}),
    check('email', 'Email not valid.').isEmail(),
    check('password', 'Password must have at least 8 characters.').isLength({min: 8}),
    check('confirm_password', 'Passwords do not match.').custom(function (value, {req}) {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match.');
        } else {
            return value;
        }
    })
];

// Register handler
router.post('/', validationRequirements, checkSanitized, checkValid, checkUnique, createUser);

function checkSanitized(req, res, next) {
    const {username, email, password, confirm_password} = req.body;
    let errors = [];

    if (username !== req.sanitize(username)) {
        errors.push({
            status: 422,
            msg: 'Username is invalid.'
        });
    }

    if (email !== req.sanitize(email)) {
        errors.push({
            status: 422,
            msg: 'Email is invalid.'
        });
    }

    if (password !== req.sanitize(password)) {
        errors.push({
            status: 422,
            msg: 'Password is invalid.'
        });
    }

    if (errors.length > 0) {
        return res.status(422).json(errors);
    }
    return next();
}

function checkValid(req, res, next) {
    const errors = validationResult(req).array();
    if (errors.length > 0) {
        return res.status(422).json(errors);
    }
    return next();
}

function checkUnique(req, res, next) {
    const {username, email, password, confirm_password} = req.body;

    User.findOne({$or: [{email: email}, {username: username}]}, function (err, user) {
        if (err) {
            return next(err);
        }
        if (user) {
            return res.status(422).json([{
                status: 422,
                location: 'body',
                msg: 'User already exists.'
            }]);
        }
        return next();
    });
}

function createUser(req, res, next) {
    const {username, email, password, confirm_password} = req.body;

    const salt = randomString.generate(10);
    const hash = sha256(salt + password);
    const newUser = new User({
        username: username,
        email: email,
        password: hash,
        salt: salt
    });

    newUser.save(function (err, user) {
        if (err) {
            return next(err);
        }
        if (user) {
            let notif = {
                status: 201,
                redirectPath: '/',
                msg: `User created successfully.`,
                user: user
            };
            return res.status(201).json([notif]);
        }
        return res.status(500).json([{
            status: 500,
            msg: 'Could not create user.',
            location: 'body'
        }]);
    })
}

module.exports = router;