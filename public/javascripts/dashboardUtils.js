const sidebar = document.getElementsByClassName("sidebar")[0];
const dashbordWorkspace = document.getElementsByClassName(
    "dashboard-workspace"
)[0];
const dashboardContent = document.getElementsByClassName(
    "dashboard-content"
)[0];
const dashBoardWorkspaceTextarea = document.getElementsByClassName(
    "dashboard-workspace-textarea"
)[0];
const saveButton = document.getElementsByClassName("save-button")[0];
const noteTitleField = document.getElementsByClassName("note-title-field")[0];

// ============================= FUNCTIONS FOR FETCHING DATA/INTERACTING WITH THE BACKEND ===========================

// Initialize dashboard
if (window.location.pathname === "/dashboard") {
    window.onload = () => {
        displayWorkspaceButtons(false);
        sessionStorage.clear();
    };
    axios
        .get("/api/user/collections?includeCollaborations=true")
        .then(initializeDashboard)
        .catch((err) => {
            errorHandler([
                { msg: err.response.data.msg || "There was a problem." },
            ]);
        });

    window.onkeydown = (ev) => {
        if (
            ev.keyCode === 83 &&
            (navigator.platform.match("Mac") ? ev.metaKey : ev.ctrlKey)
        ) {
            ev.preventDefault();
            updateNote();
        } /*else if (
            ev.keyCode === 67 &&
            (navigator.platform.match("Mac") ? ev.metaKey : ev.ctrlKey)
        ) {
            ev.preventDefault();
            copyContentToClipboard();
        }*/
    };

    noteTitleField.addEventListener("keydown", limitTitleLength);
}

function limitTitleLength(ev) {
    if (
        this.textContent.length >= 20 &&
        ![8, 9, 17, 37, 38, 39, 40, 46].includes(ev.keyCode)
    )
        ev.preventDefault();
}

// GET note content
function getNote(ev) {
    const noteTitle = ev.target.textContent;
    const collectionTitle = ev.target.parentElement
        .querySelector(".sidebar-container-heading")
        .textContent.trim();
    axios
        .get(`/api/note/${collectionTitle}/${noteTitle}`)
        .then((response) => {
            modifyActiveNote(ev.target);
            sessionStorage.setItem(
                "currentNote",
                JSON.stringify(response.data.note)
            );
            displayWorkspaceButtons(true);
            displayNote(response.data.note);
            closeSidebar();
        })
        .catch((err) => {
            errorHandler([
                { msg: err.response.data.msg || "There was a problem." },
            ]);
        });
}

// ADD note to collection
function addNote(ev) {
    const container = ev.parentElement.parentElement.parentElement;
    const collectionTitle = ev.parentElement.parentElement.textContent.trim();
    const form = new FormData();
    form.append("collectionTitle", collectionTitle);
    // Set the title of the new note to be "New Note(<number>)"
    let newNoteIndex = 0;
    const arr = Array.prototype.filter
        .call(container.querySelectorAll(".sidebar-container-element"), (el) =>
            el.textContent.trim().match(/^New Note\([0-9]*\)$/)
        )
        .map((el) =>
            parseInt(
                el.textContent
                    .trim()
                    .slice(
                        1 + el.textContent.trim().indexOf("("),
                        el.textContent.trim().indexOf(")")
                    ),
                10
            )
        );
    if (arr.length > 0) {
        newNoteIndex = Math.max.apply(null, arr);
    }
    form.append("noteTitle", `New Note(${newNoteIndex + 1})`);
    axios
        .post("/api/note/add", form)
        .then((response) => {
            const containerElement = addNoteToContainer(
                response.data.note,
                container
            );
            modifyActiveNote(containerElement);
            sessionStorage.setItem(
                "currentNote",
                JSON.stringify(response.data.note)
            );
            displayWorkspaceButtons(true);
            displayNote(response.data.note);
            closeSidebar();
            notificationHandler([{ msg: "Note created." }], 2000);
        })
        .catch((err) => {
            errorHandler([
                { msg: err.response.data.msg || "There was a problem." },
            ]);
        });
}

// UPDATE a note when the save button is clicked
function updateNote() {
    if (noteTitleField.textContent === "") {
        errorHandler([{ msg: "Note title cannot be empty." }]);
        return;
    }
    saveToLoading(true);
    const form = new FormData();
    if (sessionStorage.getItem("currentNote")) {
        // current note updates
        form.append(
            "noteTitle",
            JSON.parse(sessionStorage.getItem("currentNote")).title
        );
        form.append(
            "collectionTitle",
            JSON.parse(sessionStorage.getItem("currentNote")).collectionTitle
        );
        form.append("newNoteTitle", noteTitleField.textContent);
        form.append(
            "newNoteContent",
            dashBoardWorkspaceTextarea.textContent || ""
        );
        axios
            .post("/api/note/update", form)
            .then((response) => {
                sessionStorage.setItem(
                    "currentNote",
                    JSON.stringify(response.data.note)
                );
                document.querySelector(".active-note").textContent =
                    response.data.note.title;
                notificationHandler([{ msg: "Note saved." }], 2000);
            })
            .catch((err) => {
                errorHandler([
                    { msg: err.response.data.msg || "There was a problem." },
                ]);
            })
            .finally(() => {
                saveToLoading(false);
            });
    } else {
        // no note is currently open, so another one is created
        const temp = document.querySelectorAll(".sidebar-container-heading");
        if (temp.length > 0) {
            form.append("noteTitle", noteTitleField.textContent);
            form.append(
                "noteContent",
                dashBoardWorkspaceTextarea.textContent || ""
            );
            form.append("collectionTitle", temp[0].textContent.trim());
            axios
                .post("/api/note/add", form)
                .then((response) => {
                    const containerElement = addNoteToContainer(
                        response.data.note,
                        temp[0].parentElement
                    );
                    modifyActiveNote(containerElement);
                    sessionStorage.setItem(
                        "currentNote",
                        JSON.stringify(response.data.note)
                    );
                    displayWorkspaceButtons(true);
                    displayNote(response.data.note);
                    closeSidebar();
                    notificationHandler([{ msg: "Note created." }], 2000);
                })
                .catch((err) => {
                    errorHandler([
                        {
                            msg:
                                err.response.data.msg || "There was a problem.",
                        },
                    ]);
                })
                .finally(() => {
                    saveToLoading(false);
                });
        } else {
            errorHandler([{ msg: "No collection to add note to." }]);
            saveToLoading(false);
        }
    }
}

// DELETE note from collection
function deleteNote() {
    if (sessionStorage.getItem("currentNote")) {
        const form = new FormData();
        form.append(
            "noteTitle",
            JSON.parse(sessionStorage.getItem("currentNote")).title
        );
        form.append(
            "collectionTitle",
            JSON.parse(sessionStorage.getItem("currentNote")).collectionTitle
        );
        axios
            .post("/api/note/delete", form)
            .then((response) => {
                let container = null;
                document
                    .querySelectorAll(".sidebar-container-heading")
                    .forEach((elem) => {
                        if (
                            elem.textContent.trim() ===
                            JSON.parse(sessionStorage.getItem("currentNote"))
                                .collectionTitle
                        ) {
                            container = elem.parentElement;
                        }
                    });
                deleteNoteFromContainer(response.data.note, container);
                sessionStorage.removeItem("currentNote");
                resetDashboard();
                modifyActiveNote(null);
                displayWorkspaceButtons(false);
                notificationHandler([{ msg: "Note deleted." }], 2000);
            })
            .catch((err) => {
                errorHandler([
                    { msg: err.response.data.msg || "There was a problem." },
                ]);
            });
    } else {
        errorHandler([
            { msg: err.response.data.msg || "There was a problem." },
        ]);
    }
}

// ADD an empty collection
function addCollection() {
    // Set the title of the new note to be "New Note(<number>)"
    let newColIndex = 0;
    let arr = Array.prototype.filter
        .call(document.querySelectorAll(".sidebar-container-heading"), (el) =>
            el.textContent.trim().match(/^New Col\([0-9]*\)$/)
        )
        .map((el) =>
            parseInt(
                el.textContent
                    .trim()
                    .slice(
                        1 + el.textContent.trim().indexOf("("),
                        el.textContent.trim().indexOf(")")
                    ),
                10
            )
        );
    if (arr.length > 0) {
        newColIndex = Math.max.apply(null, arr);
    }

    const form = new FormData();
    form.append("collectionTitle", `New Col(${newColIndex + 1})`);
    axios
        .post("/api/collection/add", form)
        .then((response) => {
            addContainer(response.data.collection);
            notificationHandler([{ msg: "Collection created." }], 2000);
        })
        .catch((err) => {
            errorHandler([
                { msg: err.response.data.msg || "There was a problem." },
            ]);
        });
}

// DELETE an entire collection, including the notes inside
function deleteCollection(ev) {
    const collectionTitle = ev.parentElement.parentElement.textContent.trim();
    const form = new FormData();
    form.append("collectionTitle", collectionTitle);
    axios
        .post("/api/collection/delete", form)
        .then((response) => {
            deleteContainer(response.data.collection);
            if (
                sessionStorage.getItem("currentNote") &&
                JSON.parse(sessionStorage.getItem("currentNote"))
                    .collectionTitle === collectionTitle
            ) {
                sessionStorage.removeItem("currentNote");
                displayWorkspaceButtons(false);
                resetDashboard();
                modifyActiveNote(null);
            }
            notificationHandler([{ msg: "Collection deleted." }], 2000);
        })
        .catch((err) => {
            errorHandler([
                { msg: err.response.data.msg || "There was a problem." },
            ]);
        });
}

function shareNote() {
    const note = JSON.parse(sessionStorage.getItem("currentNote"));
    const form = new FormData();
    form.append("noteTitle", note.title);
    form.append("collectionTitle", note.collectionTitle);
    axios
        .post("/api/note/share", form)
        .then((response) => {
            copyTextToClipboard(
                `${window.location.origin}${response.data.link}`
            );
            notificationHandler(
                [
                    {
                        msg: `Share link copied to clipboard.`,
                    },
                ],
                5000
            );
        })
        .catch((err) => {
            errorHandler([
                { msg: err.response.data.msg || "There was a problem." },
            ]);
        });
}

// ========================= FUNCTIONS FOR MODIFYING DISPLAYED DATA ======================

// DISPLAY note content
function displayNote(note) {
    dashBoardWorkspaceTextarea.textContent = note.content;
    noteTitleField.textContent = note.title;
}

function initializeDashboard(response) {
    response.data.collections.forEach(addContainer);
    sidebar.scrollTop = 0;
}

function addContainer(collection) {
    let container = document.createElement("div");
    container.classList.add("sidebar-container");
    container.classList.add("animate");

    let containerHeading = document.createElement("div");
    containerHeading.classList.add("sidebar-container-heading");
    containerHeading.textContent = collection.title;

    let containerTools = document.createElement("div");
    containerTools.classList.add("sidebar-container-tools");
    containerTools.innerHTML =
        '<i class="fas fa-plus no-select" onclick="addNote(this)"></i>' +
        '<i class="fas fa-trash no-select" onclick="deleteCollection(this)"></i>';
    containerHeading.appendChild(containerTools);
    container.appendChild(containerHeading);
    if (collection.notes) {
        collection.notes.forEach((note) => addNoteToContainer(note, container));
    }
    sidebar.appendChild(container);
    sidebar.scrollTop = sidebar.scrollHeight;
    return container;
}

function deleteContainer(collection) {
    Array.prototype.filter
        .call(
            document.querySelectorAll(".sidebar-container-heading"),
            (h) => h.textContent.trim() === collection.title
        )
        .forEach((h) => {
            h.parentElement.classList.add("animate-out");
            setTimeout(() => {
                h.parentElement.parentElement.removeChild(h.parentElement);
            }, 300);
        });
}

function addNoteToContainer(note, container) {
    let containerElement = document.createElement("div");
    containerElement.classList.add("sidebar-container-element");
    containerElement.classList.add("animate");
    containerElement.classList.add("no-select");
    containerElement.textContent = note.title;
    containerElement.onclick = getNote;
    container.appendChild(containerElement);
    return containerElement;
}

function deleteNoteFromContainer(note, container) {
    Array.prototype.filter
        .call(
            container.querySelectorAll(".sidebar-container-element"),
            (el) => el.textContent.trim() === note.title
        )
        .forEach((el) => {
            el.classList.add("animate-out");
            setTimeout(() => {
                el.parentElement.removeChild(el);
            }, 300);
        });
}

function modifyActiveNote(containerElement) {
    document.querySelectorAll(".active-note").forEach((el) => {
        el.classList.remove("active-note");
        el.onclick = getNote;
    });
    if (containerElement) {
        containerElement.classList.add("active-note");
        containerElement.onclick = null;
    }
}

function resetDashboard() {
    dashBoardWorkspaceTextarea.textContent = "";
    noteTitleField.textContent = "";
}

function saveToLoading(val) {
    if (val) {
        saveButton.innerHTML =
            '<i class="fas fa-spinner animate-rotation-clockwise"></i>';
        saveButton.style.background = getComputedStyle(
            document.body
        ).getPropertyValue("--info-color");
        saveButton.onclick = null;
    } else {
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.style.background = null;
        saveButton.onclick = updateNote;
    }
}

function copyContentToClipboard() {
    if (document.body.createTextRange) {
        let range = document.body.createTextRange();
        range.moveToElementText(dashBoardWorkspaceTextarea);
        range.select();
        document.execCommand("Copy");
        range = null;
    } else if (window.getSelection) {
        let selection = window.getSelection();
        let range = document.createRange();
        range.selectNodeContents(dashBoardWorkspaceTextarea);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("Copy");
        selection.removeAllRanges();
    }
    notificationHandler([{ msg: "Note content copied to clipboard." }]);
}

function copyTextToClipboard(str) {
    const el = document.createElement("div");
    el.contentEditable = "true";
    el.appendChild(document.createTextNode(str));
    document.body.appendChild(el);
    if (document.body.createTextRange) {
        let range = document.body.createTextRange();
        range.moveToElementText(el);
        range.select();
        document.execCommand("Copy");
        range = null;
    } else if (window.getSelection) {
        let selection = window.getSelection();
        let range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("Copy");
        selection.removeAllRanges();
    }
    document.body.removeChild(el);
}

function isSidebarOpen() {
    if (!getComputedStyle(sidebar).display) return false;
    return getComputedStyle(sidebar).display !== "none";
}

function openSidebar() {
    sidebar.classList.add("sidebar-open");
    sidebar.classList.add("animate-open-sidebar");
    // TODO: de rezolvat inaltimea sidebar-ului pe mobil cu orientarea landscape
    setTimeout(() => {
        sidebar.classList.remove("animate-open-sidebar");
    }, 160);
}

function closeSidebar() {
    if (window.innerWidth <= 900) {
        sidebar.classList.add("animate-close-sidebar");
        setTimeout(() => {
            sidebar.classList.remove("animate-close-sidebar");
            sidebar.classList.remove("sidebar-open");
        }, 160);
    }
}

function displayWorkspaceButtons(val) {
    document
        .querySelectorAll(".dashboard-workspace-buttons > i")
        .forEach((el) => (el.style.display = val ? "inline-block" : "none"));
}
