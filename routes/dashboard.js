const express = require('express');
const router = express.Router();
// const checkAuth = require('../config/checkAuth');
const jwt = require('jsonwebtoken');

// GET dashboard page
router.get('/', checkIfLoggedIn, function (req, res, next) {
    res.render('dashboard', {title: 'Dashboard'});
});

function checkIfLoggedIn(req, res, next) {
    if (req.cookies.jwt_auth) {
        jwt.verify(req.cookies.jwt_auth, process.env.JWT_SECRET, function (err, decoded) {
            if (err) return next(err);
            if (decoded) {
                next();
            } else return next(new Error('Unauthorized.'));
        });
    } else return next(new Error('Unauthorized.'));
}

// function getData(req, res, next) {
//     request(url.format({
//         protocol: req.protocol,
//         host: req.get('host'),
//         pathname: '/api/user/collections',
//         query: 'includeCollaborations=true'
//     }), {json: true}, function (err, response, body) {
//         if (err) {
//             return next(err);
//         }
//         console.log(body);
//         return next();
//     });
// }

module.exports = router;
