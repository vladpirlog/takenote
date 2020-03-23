const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Note = require('../models/Note');
const jwt = require('jsonwebtoken');

/* GET home page. */
router.get('/', function (req, res, next) {
    return res.render('index', {title: 'Home'});
});

// GET attachments page for note
router.get('/:username/:note/attachments', checkNote);

function checkNote(req, res, next) {
    const paramUsername = req.sanitize(req.params.username); // username-ul utilizatorului care detine nota
    const paramNote = req.sanitize(req.params.note); // id-ul notei

    Note.findById(paramNote, function (err, note) {
        if (err) {
            return next(err);
        }
        if (note) {
            User.findById(note.userID, function (err, user) {
                if (err) {
                    return next(err);
                }
                if (user) {
                    const verified = jwt.verify(req.cookies.jwt_auth, process.env.JWT_SECRET);
                    if (user._id.toString() === verified.userID
                        && user.username === paramUsername) {
                        return res.render('attachments', {title: 'Attachments', data: note.attachments});
                    }
                    return next(new Error('Page not found.'));
                }
                return next(new Error('Page not found.'));
            });
        }
        return next(new Error('Page not found.'));
    });
}

// GET note page shared with unique link
router.get('/share/:str', async function (req, res, next) {
    const {str} = req.params;
    const link = '/share/' + str;
    // TODO: de construit o pagina pt afisarea notelor share-uite
    const note = await Note.findOne({link: link});
    if (!note) {
        return next(new Error('Not Found.'));
    }
    return res.send(note);
});

module.exports = router;
