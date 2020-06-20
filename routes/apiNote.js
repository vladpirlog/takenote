const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const Collection = require("../models/Collection");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const randomString = require("randomstring");

// GET a note
router.get("/:collectionTitle/:noteTitle", getNote);

async function getNote(req, res, next) {
    const { noteTitle, collectionTitle } = req.params;
    if (!noteTitle || !collectionTitle) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(noteTitle, collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    const collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });

    if (!collection) {
        return res.status(404).json({
            status: 404,
            msg: "Collection name invalid.",
        });
    }

    const note = await Note.findOne({
        collectionID: collection._id.toString(),
        title: noteTitle,
        userID: res.locals.loggedUser.userID,
    });

    if (note) {
        return res.status(200).json({
            status: 200,
            msg: "OK",
            note: note,
        });
    } else
        return res.status(404).json({
            status: 404,
            msg: "Could not get note.",
        });
}

// ADD a note
router.post("/add", addNote);

async function addNote(req, res, next) {
    const { noteTitle, noteContent, collectionTitle } = req.body;
    if (!noteTitle || !collectionTitle)
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });

    if (!checkRegex(noteTitle, collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    if (noteTitle.length > 20)
        return res.status(422).json({
            status: 422,
            msg: "Note title too long.",
        });

    // Check if collection exists
    const collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });
    if (!collection) {
        return res.status(404).json({
            status: 404,
            msg: "Collection name invalid.",
        });
    }

    // Check if note with that title already exists in the collection
    const note = await Note.findOne({
        title: noteTitle,
        userID: res.locals.loggedUser.userID,
        collectionID: collection._id.toString(),
    });
    if (note) {
        return res.status(409).json({
            status: 409,
            msg: "There is already a note with that name in the collection.",
        });
    }

    const newNote = new Note({
        title: noteTitle,
        content: noteContent || "",
        userID: res.locals.loggedUser.userID,
        collectionTitle: collectionTitle,
        collectionID: collection._id.toString(),
    });

    newNote.save(function (err, note) {
        if (err) return next(err);
        if (note) {
            return res.status(201).json({
                status: 201,
                msg: "Note created.",
                note: note,
            });
        }
        return res.status(500).json({
            status: 500,
            msg: "Could not create note.",
        });
    });
}

// UPDATE a note
router.post("/update", updateNote);

async function updateNote(req, res, next) {
    let { noteTitle, collectionTitle, newNoteTitle, newNoteContent } = req.body;

    if (!noteTitle || !collectionTitle || !newNoteTitle) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(noteTitle, collectionTitle, newNoteTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    if (noteTitle.length > 20 || newNoteTitle.length > 20)
        return res.status(422).json({
            status: 422,
            msg: "Note title too long.",
        });

    // Check if collection exists
    const collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });
    if (!collection) {
        return res.status(404).json({
            status: 404,
            msg: "Collection name invalid.",
        });
    }

    // Check if note with that name already in collection
    const note = await Note.findOne({
        title: newNoteTitle,
        collectionID: collection._id.toString(),
        userID: res.locals.loggedUser.userID,
    });
    if (note && noteTitle !== newNoteTitle) {
        return res.status(409).json({
            status: 409,
            msg: "There is already a note with that name in the collection.",
        });
    }

    const newNote = await Note.findOneAndUpdate(
        {
            title: noteTitle,
            userID: res.locals.loggedUser.userID,
            collectionID: collection._id.toString(),
        },
        {
            edited: Date.now(),
            content: newNoteContent,
            title: newNoteTitle,
        },
        { new: true }
    );
    if (newNote) {
        return res.status(200).json({
            status: 200,
            msg: "Note updated.",
            note: newNote,
        });
    } else
        return res.status(404).json({
            status: 404,
            msg: "Could not update note.",
        });
}

// DELETE a note
router.post("/delete", deleteNote);

async function deleteNote(req, res, next) {
    let { noteTitle, collectionTitle } = req.body;

    if (!noteTitle || !collectionTitle) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(noteTitle, collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    if (noteTitle.length > 20)
        return res.status(422).json({
            status: 422,
            msg: "Note title too long.",
        });

    // Check if collection exists
    const collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });
    if (!collection) {
        return res.status(404).json({
            status: 404,
            msg: "Collection name invalid.",
        });
    }

    const deletedNote = await Note.findOneAndDelete({
        title: noteTitle,
        userID: res.locals.loggedUser.userID,
        collectionID: collection._id.toString(),
    });
    if (deletedNote) {
        return res.status(200).json({
            status: 200,
            msg: "Note deleted.",
            note: deletedNote,
        });
    } else {
        return res.status(404).json({
            status: 404,
            msg: "Could not delete note.",
        });
    }
}

// ADD an attachment
router.post("/attachment/add", uploadFile, addAttachment);

function uploadFile(req, res, next) {
    const file = req.files.photo;
    if (file) {
        cloudinary.uploader
            .upload(file.tempFilePath)
            .then((result) => {
                fs.unlinkSync(file.tempFilePath);
                result.status = 200;
                res.photoURL = result.secure_url;
                return next();
            })
            .catch((err) => {
                return res
                    .status(err.http_code)
                    .json({ msg: err.message, status: err.http_code });
            });
    } else
        return res.status(422).json({
            status: 422,
            msg: "File not found.",
        });
}

// TODO: de adaugat o limita pt numarul maxim de atasamente la o nota (~10)
async function addAttachment(req, res, next) {
    let { noteTitle, collectionTitle } = req.body;

    if (!noteTitle || !collectionTitle) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(noteTitle, collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    if (noteTitle.length > 20)
        return res.status(422).json({
            status: 422,
            msg: "Note title too long.",
        });

    // Check if collection exists
    const collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });
    if (!collection) {
        return res.status(404).json({
            status: 404,
            msg: "Collection name invalid.",
        });
    }

    // Check if note exists
    const note = await Note.findOne({
        title: noteTitle,
        userID: res.locals.loggedUser.userID,
        collectionID: collection._id.toString(),
    });
    if (!note) {
        return res.status(404).json({
            status: 404,
            msg: "Could not find note.",
        });
    }

    let oldAttachments = note.attachments;
    oldAttachments.push(res.photoURL);

    const newNote = await Note.findOneAndUpdate(
        {
            title: noteTitle,
            userID: res.locals.loggedUser.userID,
            collectionID: collection._id.toString(),
        },
        {
            edited: Date.now(),
            attachments: oldAttachments,
        },
        { new: true }
    );

    if (newNote) {
        return res.status(200).json({
            status: 200,
            msg: "Attachment added to note.",
            photoURL: res.photoURL,
            note: newNote,
        });
    } else {
        return res.status(500).json({
            status: 500,
            msg: "Could not add attachment to note.",
        });
    }
}

// DELETE an attachment
router.post("/attachment/delete", deleteAttachment);

async function deleteAttachment(req, res, next) {
    let { noteTitle, collectionTitle, photoURL } = req.body;

    if (!noteTitle || !collectionTitle || !photoURL) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(noteTitle, collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    if (noteTitle.length > 20)
        return res.status(422).json({
            status: 422,
            msg: "Note title too long.",
        });

    // Check if collection exists
    const collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });
    if (!collection) {
        return res.status(404).json({
            status: 404,
            msg: "Collection name invalid.",
        });
    }

    // Check if note exists
    const note = await Note.findOne({
        title: noteTitle,
        userID: res.locals.loggedUser.userID,
        collectionID: collection._id.toString(),
    });
    if (!note) {
        return res.status(404).json({
            status: 404,
            msg: "Could not find note.",
        });
    }

    let oldAttachments = note.attachments;
    const index = oldAttachments.indexOf(photoURL);
    if (index > -1) {
        oldAttachments.splice(index, 1);
    } else {
        return res.status(404).json({
            status: 404,
            msg: "Attachment not in the list.",
        });
    }

    const newNote = await Note.findOneAndUpdate(
        {
            title: noteTitle,
            userID: res.locals.loggedUser.userID,
            collectionID: collection._id.toString(),
        },
        {
            edited: Date.now(),
            attachments: oldAttachments,
        },
        { new: true }
    );

    if (newNote) {
        return res.status(200).json({
            status: 200,
            msg: "Attachment deleted from note.",
            note: newNote,
        });
    } else {
        return res.status(500).json({
            status: 500,
            msg: "Could not delete attachment from note.",
        });
    }
}

// ADD a collaborator
router.post("/collaborator/add", addCollaborator);

// TODO: de adaugat o limita pt numarul maxim de colaboratori la o nota (~5)
async function addCollaborator(req, res, next) {
    let { noteTitle, collectionTitle, collaboratorUsername } = req.body;

    if (!noteTitle || !collectionTitle || !collaboratorUsername) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(noteTitle, collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    if (noteTitle.length > 20)
        return res.status(422).json({
            status: 422,
            msg: "Note title too long.",
        });

    // Check if collection exists
    const collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });
    if (!collection) {
        return res.status(404).json({
            status: 404,
            msg: "Collection name invalid.",
        });
    }

    // Check if note exists
    const note = await Note.findOne({
        title: noteTitle,
        userID: res.locals.loggedUser.userID,
        collectionID: collection._id.toString(),
    });
    if (!note) {
        return res.status(404).json({
            status: 404,
            msg: "Could not find note.",
        });
    }

    // Check if collaborator exists
    const user = await User.findOne({ username: collaboratorUsername });
    if (!user) {
        return res.status(404).json({
            status: 404,
            msg: "Collaborator does not exist.",
        });
    }

    // Check if collaborator already in the list
    if (note.collaborators.indexOf(collaboratorUsername) !== -1) {
        return res.status(409).json({
            status: 409,
            msg: "Collaborator already added.",
        });
    }
    // Check if collaborator is already the owner
    if (collaboratorUsername === res.locals.loggedUser.username) {
        return res.status(409).json({
            status: 409,
            msg: "Collaborator is already owner.",
        });
    }

    let oldCollaborators = note.collaborators;
    oldCollaborators.push(collaboratorUsername);

    const newNote = await Note.findOneAndUpdate(
        {
            title: noteTitle,
            userID: res.locals.loggedUser.userID,
            collectionID: collection._id.toString(),
        },
        {
            edited: Date.now(),
            collaborators: oldCollaborators,
        },
        { new: true }
    );

    if (newNote) {
        return res.status(200).json({
            status: 200,
            msg: "Collaborator added to note.",
            note: newNote,
        });
    } else {
        return res.status(500).json({
            status: 500,
            msg: "Could not add collaborator to note.",
        });
    }
}

// DELETE a collaborator
router.post("/collaborator/delete", deleteCollaborator);

async function deleteCollaborator(req, res, next) {
    let { noteTitle, collectionTitle, collaboratorUsername } = req.body;

    if (!noteTitle || !collectionTitle || !collaboratorUsername) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(noteTitle, collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    if (noteTitle.length > 20)
        return res.status(422).json({
            status: 422,
            msg: "Note title too long.",
        });

    // Check if collection exists
    const collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });
    if (!collection) {
        return res.status(404).json({
            status: 404,
            msg: "Collection name invalid.",
        });
    }

    // Check if note exists
    const note = await Note.findOne({
        title: noteTitle,
        userID: res.locals.loggedUser.userID,
        collectionID: collection._id.toString(),
    });
    if (!note) {
        return res.status(404).json({
            status: 404,
            msg: "Could not find note.",
        });
    }

    // Check if collaborator exists
    const user = await User.findOne({ username: collaboratorUsername });
    if (!user) {
        return res.status(404).json({
            status: 404,
            msg: "Collaborator does not exist.",
        });
    }

    let oldCollaborators = note.collaborators;
    const index = oldCollaborators.indexOf(collaboratorUsername);
    if (index > -1) {
        oldCollaborators.splice(index, 1);
    } else {
        return res.status(404).json({
            status: 404,
            msg: "Collaborator not in the list.",
        });
    }

    const newNote = await Note.findOneAndUpdate(
        {
            title: noteTitle,
            userID: res.locals.loggedUser.userID,
            collectionID: collection._id.toString(),
        },
        {
            edited: Date.now(),
            collaborators: oldCollaborators,
        },
        { new: true }
    );

    if (newNote) {
        return res.status(200).json({
            status: 200,
            msg: "Collaborator deleted from note.",
            note: newNote,
        });
    } else {
        return res.status(500).json({
            status: 500,
            msg: "Could not delete collaborator from note.",
        });
    }
}

router.post("/share", getShareLink);

async function getShareLink(req, res, next) {
    const { noteTitle, collectionTitle } = req.body;

    if (!noteTitle || !collectionTitle) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(noteTitle, collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    if (noteTitle.length > 20)
        return res.status(422).json({
            status: 422,
            msg: "Note title too long.",
        });

    // Check if collection exists
    const collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });
    if (!collection) {
        return res.status(404).json({
            status: 404,
            msg: "Collection name invalid.",
        });
    }

    // Check if note exists
    const note = await Note.findOne({
        title: noteTitle,
        userID: res.locals.loggedUser.userID,
        collectionID: collection._id.toString(),
    });
    if (!note) {
        return res.status(404).json({
            status: 404,
            msg: "Could not find note.",
        });
    }
    if (note.link) {
        return res.status(200).json({
            status: 200,
            msg: "Link successfully fetched.",
            link: note.link,
        });
    } else {
        const str = "/share/" + randomString.generate(20);
        const newNote = await Note.findOneAndUpdate(
            {
                title: noteTitle,
                userID: res.locals.loggedUser.userID,
                collectionID: collection._id.toString(),
            },
            {
                edited: Date.now(),
                link: str,
            },
            { new: true }
        );
        return res.status(201).json({
            status: 201,
            msg: "New link created.",
            link: newNote.link,
        });
    }
}

function checkRegex() {
    const regex = /^[\s\w.\-,()]*$/;
    for (let i = 0; i < arguments.length; i++) {
        if (!regex.test(arguments[i])) return false;
    }
    return true;
}

module.exports = router;
