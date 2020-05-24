const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const sha256 = require("sha256");
const randomString = require("randomstring");
const nodemailer = require("nodemailer");
const url = require("url");

// GET register page -> nu mai este pagina separata
// router.get('/', function (req, res, next) {
//     return res.render('register', {title: 'Register'});
// });

const validationRequirements = [
    check(
        "username",
        "Username must contain letters and numbers only."
    ).isAlphanumeric(),
    check(
        "username",
        "Username must have between 4 and 12 characters."
    ).isLength({ min: 4, max: 12 }),
    check("email", "Email not valid.").isEmail(),
    check("password", "Password must have at least 8 characters.").isLength({
        min: 8,
    }),
    check("confirm_password", "Passwords do not match.").custom(function (
        value,
        { req }
    ) {
        if (value !== req.body.password) {
            throw new Error("Passwords do not match.");
        } else {
            return value;
        }
    }),
];

// Register handler
router.post(
    "/",
    validationRequirements,
    checkSanitized,
    checkValid,
    checkUnique,
    createUser
);

function checkSanitized(req, res, next) {
    const { username, email, password, confirm_password } = req.body;
    let errors = [];

    if (username !== req.sanitize(username)) {
        errors.push({
            status: 422,
            loaction: "username",
            msg: "Username is invalid.",
        });
    }

    if (email !== req.sanitize(email)) {
        errors.push({
            status: 422,
            loaction: "email",
            msg: "Email is invalid.",
        });
    }

    if (password !== req.sanitize(password)) {
        errors.push({
            status: 422,
            loaction: "password",
            msg: "Password is invalid.",
        });
    }

    if (errors.length > 0) {
        return res.status(422).json({ errors: errors });
    }
    return next();
}

function checkValid(req, res, next) {
    const errors = validationResult(req).array();
    if (errors.length > 0) {
        return res.status(422).json({ errors: errors });
    }
    return next();
}

function checkUnique(req, res, next) {
    const { username, email, password, confirm_password } = req.body;

    User.findOne(
        { $or: [{ email: email }, { username: username }] },
        (err, user) => {
            if (err) {
                return next(err);
            }
            if (user) {
                return res.status(422).json({
                    errors: [
                        {
                            status: 422,
                            location: "body",
                            msg: "User already exists.",
                        },
                    ],
                });
            }
            return next();
        }
    );
}

function createUser(req, res, next) {
    const { username, email, password, confirm_password } = req.body;

    const salt = randomString.generate(10);
    const hash = sha256(salt + password);
    const verificationLink = "/confirm/" + randomString.generate(24);
    const newUser = new User({
        username: username,
        email: email,
        password: hash,
        salt: salt,
        verificationLink: verificationLink,
    });

    newUser.save((err, user) => {
        if (err) {
            return res.status(500).json({
                errors: [
                    {
                        status: 500,
                        location: "body",
                        msg: "Could not create user.",
                    },
                ],
            });
        }
        if (user) {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });
            const completeURL = url.format({
                protocol: req.protocol,
                host: req.get("host"),
                pathname: user.verificationLink,
            });
            transporter.sendMail(
                {
                    from: `"TakeNote" ${process.env.EMAIL_USER}`,
                    to: user.email,
                    subject: `TakeNote Account Confirmation - ${user.username}`,
                    text: `Go to this URL to confirm your account: ${completeURL}`,
                    html: `<h3>Click the button below to confirm your TakeNote account</h3><button><a href=${completeURL} target="_blank">Confirm</a></button><p>Button not working? Go to this URL: ${completeURL}</p>`,
                    // TODO: de creat un template pt email-ul de confirmare
                },
                (err, info) => {
                    if (err) {
                        return res.status(500).json({
                            errors: [
                                {
                                    status: 500,
                                    location: "body",
                                    msg: "Could not create user.",
                                },
                            ],
                        });
                    }
                    let notif = {
                        status: 201,
                        redirectPath: "/",
                        msg: `Check your inbox for the confirmation link.`,
                        user: user,
                    };
                    return res.status(201).json({ notifications: [notif] });
                }
            );
        } else
            return res.status(500).json({
                errors: [
                    {
                        status: 500,
                        location: "body",
                        msg: "Could not create user.",
                    },
                ],
            });
    });
}

module.exports = router;
