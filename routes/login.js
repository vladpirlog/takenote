const express = require("express");
const router = express.Router();
const User = require("../models/User");
const sha256 = require("sha256");
const jwt = require("jsonwebtoken");

// Login handler
router.post("/", checkSanitized, authUser);

function checkSanitized(req, res, next) {
    const { email, password } = req.body;
    let errors = [];

    if (email !== req.sanitize(email)) {
        errors.push({
            status: 422,
            msg: "Email/username is invalid.",
        });
    }

    if (password !== req.sanitize(password)) {
        errors.push({
            status: 422,
            msg: "Password is invalid.",
        });
    }

    if (errors.length > 0) {
        return res.status(422).json({ errors: errors });
    }
    return next();
}

function authUser(req, res, next) {
    const { email, password } = req.body;

    if (req.cookies.jwt_auth)
        return res.status(409).json({
            errors: [
                {
                    status: 409,
                    msg: "User already logged in.",
                },
            ],
        });

    User.findOne(
        { $or: [{ email: email }, { username: email }] },
        (err, user) => {
            // se accepta autentificarea username-parola sau email-parola
            if (err) {
                return res.status(500).json({
                    errors: [
                        {
                            status: 500,
                            msg: "Authentication failed.",
                        },
                    ],
                });
            }
            if (!user) {
                return res.status(404).json({
                    errors: [
                        {
                            status: 404,
                            msg: "User does not exist.",
                        },
                    ],
                });
            }
            let hash = sha256(user.salt + password);
            if (!user.isVerified()) {
                return res.status(409).json({
                    errors: [
                        {
                            status: 409,
                            msg: "Confirm your account before logging in.",
                        },
                    ],
                });
            }
            if (user.validPassword(hash)) {
                const token = jwt.sign(
                    {
                        userID: user._id.toString(),
                        username: user.username,
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: "2h" }
                );
                res.cookie("jwt_auth", token, {
                    expires: new Date(Date.now() + 7200000),
                    httpOnly: true,
                    sameSite: "Strict",
                });
                return res.status(200).json({
                    redirectPath: "/dashboard",
                    status: 200,
                    msg: "Authentication successful.",
                    username: user.username,
                    userID: user._id.toString(),
                });
            } else
                return res.status(404).json({
                    errors: [
                        {
                            status: 404,
                            msg: "Incorrect password.",
                        },
                    ],
                });
        }
    );
}

module.exports = router;
