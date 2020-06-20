const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const Collection = require("../models/Collection");

// GET a collection
router.get("/:collectionTitle", getCollection);

async function getCollection(req, res, next) {
    const { collectionTitle } = req.params;
    if (!collectionTitle) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    let collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });

    if (!collection) {
        return res.status(404).json({
            status: 404,
            msg: "Collection name invalid.",
        });
    }

    const notes = await Note.find({
        collectionID: collection._id.toString(),
        userID: res.locals.loggedUser.userID,
    });
    collection = JSON.parse(JSON.stringify(collection)); // altfel nu pot adauga alte key-uri la obiectul collection
    collection.notes = notes;

    return res.status(200).json({
        status: 200,
        msg: "OK",
        collection: collection,
    });
}

// ADD a collection
router.post("/add", addCollection);

async function addCollection(req, res, next) {
    const { collectionTitle } = req.body;
    if (!collectionTitle) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    const newCollection = new Collection({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });

    const collection = await Collection.findOne({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });

    if (collection) {
        return res.status(409).json({
            status: 409,
            msg: "A collection with that name already exists.",
        });
    }

    newCollection.save(function (err, collection) {
        if (err) return next(err);
        if (collection) {
            return res.status(201).json({
                status: 201,
                msg: "Collection created.",
                collection: collection,
            });
        }
        return res.status(500).json({
            status: 500,
            msg: "Could not create collection.",
        });
    });
}

// UPDATE a collection
router.post("/update", updateCollection);

async function updateCollection(req, res, next) {
    const { collectionTitle, newCollectionTitle } = req.body;
    if (!collectionTitle || !newCollectionTitle) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(collectionTitle, newCollectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    const newCollection = await Collection.findOneAndUpdate(
        { title: collectionTitle, userID: res.locals.loggedUser.userID },
        { title: newCollectionTitle },
        { new: true }
    );

    if (newCollection) {
        return res.status(200).json({
            status: 200,
            msg: "Collection updated.",
            collection: newCollection,
        });
    } else
        return res.status(404).json({
            status: 404,
            msg: "Could not update collection.",
        });
}

// DELETE a collection
router.post("/delete", deleteCollection);

async function deleteCollection(req, res, next) {
    const { collectionTitle } = req.body;

    if (!collectionTitle) {
        return res.status(422).json({
            status: 422,
            msg: "Input data missing.",
        });
    }

    if (!checkRegex(collectionTitle)) {
        return res.status(422).json({
            status: 422,
            msg: "Input data contains unaccepted characters.",
        });
    }

    const collection = await Collection.findOneAndDelete({
        title: collectionTitle,
        userID: res.locals.loggedUser.userID,
    });

    if (collection) {
        // Also delete all notes in that collection
        const notes = await Note.deleteMany({
            collectionID: collection._id.toString(),
            userID: res.locals.loggedUser.userID,
        });

        return res.status(200).json({
            status: 200,
            msg: "Collection deleted.",
            collection: collection,
        });
    } else {
        return res.status(404).json({
            status: 404,
            msg: "Could not delete collection.",
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
