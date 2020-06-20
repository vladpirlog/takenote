const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    if (req.cookies.jwt_auth) {
        jwt.verify(
            req.cookies.jwt_auth,
            process.env.JWT_SECRET,
            (err, decoded) => {
                if (err) {
                    res.clearCookie("jwt_auth");
                    return next(err);
                }
                if (decoded) {
                    res.locals.isAuthenticated = true;
                    res.locals.loggedUser = decoded;
                } else {
                    res.locals.isAuthenticated = false;
                    res.locals.loggedUser = null;
                }
                return next();
            }
        );
    } else {
        res.locals.isAuthenticated = false;
        res.locals.loggedUser = null;
        return next();
    }
};
