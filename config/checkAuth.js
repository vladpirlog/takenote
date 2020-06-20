const jwt = require('jsonwebtoken');

// Middleware function for checking the signature of the JWT
module.exports = function (req, res, next) {
    if (req.cookies.jwt_auth) {
        jwt.verify(req.cookies.jwt_auth, process.env.JWT_SECRET, function (err, decoded) {
            if (err) return next(err);
            if (decoded) {
                next();
            } else {
                return res.status(401).json({
                    status: 401,
                    msg: 'Unauthorized.'
                });
            }
        });
    } else {
        return res.status(401).json({
            status: 401,
            msg: 'Unauthorized.'
        });
    }
};