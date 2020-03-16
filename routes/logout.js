const express = require('express');
const router = express.Router();

// Logout handler
router.post('/', function (req, res, next) {
    if (req.cookies.jwt_auth) {
        res.clearCookie('jwt_auth');
        return res.status(200).json([{
            status: 200,
            redirectPath: '/',
            msg: 'User logged out.'
        }]);
    } else {
        return res.status(404).json([{
            status: 404,
            msg: 'Could not log out.'
        }]);
    }
});

module.exports = router;