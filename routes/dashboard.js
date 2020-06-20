const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// GET dashboard page
router.get('/', checkIfLoggedIn, function (req, res, next) {
    res.render('dashboard', {title: 'Dashboard', includeSandwich: true});
});

function checkIfLoggedIn(req, res, next) {
    if (req.cookies.jwt_auth) {
        jwt.verify(req.cookies.jwt_auth, process.env.JWT_SECRET, function (err, decoded) {
            if (err) return next(err);
            if (decoded) {
                next();
            } else return res.redirect('/');
        });
    } else return res.redirect('/');
}

module.exports = router;
