const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Note = require("../models/Note");

/* GET home page. */
router.get("/", (req, res, next) => {
    return res.render("index", { title: "Home" });
});

// GET note page shared with unique link
router.get("/share/:str", async (req, res, next) => {
    const str = req.sanitize(req.params.str);
    const link = "/share/" + str;
    // TODO: de construit o pagina pt afisarea notelor share-uite
    const note = await Note.findOne({ link: link });
    if (!note) {
        return next(new Error("Not Found."));
    }
    const owner = await User.findById(note.userID);
    return res.render("shared", { title: note.title, note: note, owner: owner });
});

// GET verification page
router.get("/confirm/:id", async (req, res, next) => {
    const id = req.sanitize(req.params.id);
    const link = "/confirm/" + id;
    const user = await User.findOne({ verificationLink: link });
    if (!user) {
        return next(new Error("Not Found."));
    } else {
        const verifiedUser = await User.findOneAndUpdate(
            { verificationLink: link },
            { verified: true, verificationLink: "" },
            { new: true }
        );
        if (!verifiedUser) {
            return next(new Error("Not Found."));
        } else {
            return res.redirect("/");
        }
    }
});

module.exports = router;
