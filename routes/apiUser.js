const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const Collection = require("../models/Collection");
// TODO: de adaugat functii pt a reduce codul duplicat
// TODO: de adugat autorizarea pt note la care esti colaborator

// GET all collections of a user; collaborating notes can be included too
router.get("/collections", getAllCollections);

function getAllCollections(req, res, next) {
    const { includeCollaborations } = req.query;
    Collection.find(
        {
            userID: res.locals.loggedUser.userID,
        },
        (err, collections) => {
            if (err) {
                return res
                    .status(500)
                    .json({ status: 500, msg: "Server error." });
            }
            if (collections) {
                collections = JSON.parse(JSON.stringify(collections)); // altfel nu pot adauga key-uri noi la obiectul collections
                collections.forEach((col) => (col.notes = []));

                Note.find(
                    { userID: res.locals.loggedUser.userID },
                    (err, notes) => {
                        if (err) {
                            return res.status(500).json({
                                status: 500,
                                message: "Server error.",
                            });
                        }
                        if (notes) {
                            notes.forEach((n) => {
                                for (let col of collections) {
                                    if (col._id.toString() == n.collectionID) {
                                        col.notes.push(n);
                                        break;
                                    }
                                }
                            });
                            let response = {
                                status: 200,
                                msg: "OK",
                                collections: collections,
                            };
                            // TODO: de adaugat un query pt gasirea notelor la care user-ul colaboreaza
                            // Note.find(
                            //         {
                            //             collaborators: res.locals.loggedUser.username,
                            //         },
                            //         (err, collabNotes) => {
                            //             if (err)
                            //                 return res.status(500).json({
                            //                     status: 500,
                            //                     message: "Server error.",
                            //                 });
                            //             response.collaborations = collabNotes;
                            //             return res.status(200).json(response);
                            //         }
                            //     );
                            return res.status(200).json(response);
                        } else {
                            return res
                                .status(404)
                                .json({ status: 404, msg: "Notes not found." });
                        }
                    }
                );
            } else {
                return res
                    .status(404)
                    .json({ status: 404, msg: "Collections not found." });
            }
        }
    );
}

module.exports = router;
