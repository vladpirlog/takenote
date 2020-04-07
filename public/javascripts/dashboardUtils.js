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

// GET note content
function getNote(ev) {
    const noteTitle = ev.target.textContent;
    const collectionTitle = ev.target.parentElement
        .querySelector(".sidebar-container-heading")
        .textContent.trim();
    axios
        .get(`/api/note/${collectionTitle}/${noteTitle}`)
        .then(function (response) {
            closeSidebar();
            modifyActiveNote(ev.target);
            sessionStorage.setItem(
                "currentNote",
                JSON.stringify(response.data.note)
            );
            displayNote(response.data.note);
        })
        .catch(function (err) {
            alert(err.response.data.msg || "There was a problem.");
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
    for (let elem of container.querySelectorAll(".sidebar-container-element")) {
        if (elem.textContent.trim().match(/^New Note\([0-9]*\)$/)) {
            let x = parseInt(
                elem.textContent
                    .trim()
                    .slice(
                        1 + elem.textContent.trim().indexOf("("),
                        elem.textContent.trim().indexOf(")")
                    ),
                10
            );
            if (newNoteIndex < x) {
                newNoteIndex = x;
            }
        }
    }
    form.append("noteTitle", `New Note(${newNoteIndex + 1})`);
    axios
        .post("/api/note/add", form)
        .then(function (response) {
            const containerElement = addNoteToContainer(
                response.data.note,
                container
            );
            modifyActiveNote(containerElement);
            sessionStorage.setItem(
                "currentNote",
                JSON.stringify(response.data.note)
            );
            displayNote(response.data.note);
        })
        .catch(function (err) {
            alert(err.response.data.msg || "There was a problem.");
        });
}

// UPDATE a note when the save button is clicked
function updateNote() {
    if (noteTitleField.textContent === "") {
        alert("Note title cannot be empty.");
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
            .then(function (response) {
                sessionStorage.setItem(
                    "currentNote",
                    JSON.stringify(response.data.note)
                );
                document.querySelector(".active-note").textContent =
                    response.data.note.title;
            })
            .catch(function (err) {
                alert(err.response.data.msg || "There was a problem.");
            })
            .finally(function () {
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
                .then(function (response) {
                    const containerElement = addNoteToContainer(
                        response.data.note,
                        temp[0].parentElement
                    );
                    modifyActiveNote(containerElement);
                    sessionStorage.setItem(
                        "currentNote",
                        JSON.stringify(response.data.note)
                    );
                    displayNote(response.data.note);
                })
                .catch(function (err) {
                    alert(err.response.data.msg || "There was a problem.");
                })
                .finally(function () {
                    saveToLoading(false);
                });
        } else {
            alert("No collection to add note to.");
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
            .then(function (response) {
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
            })
            .catch(function (err) {
                alert(err.response.data.msg || "There was a problem.");
            });
    } else {
        alert("There was a problem.");
    }
}

// ADD an empty collection
function addCollection() {
    // Set the title of the new note to be "New Note(<number>)"
    let newColIndex = 0;
    for (let elem of document.querySelectorAll(".sidebar-container-heading")) {
        if (elem.textContent.trim().match(/^New Col\([0-9]*\)$/)) {
            let x = parseInt(
                elem.textContent
                    .trim()
                    .slice(
                        1 + elem.textContent.trim().indexOf("("),
                        elem.textContent.trim().indexOf(")")
                    ),
                10
            );
            if (newColIndex < x) {
                newColIndex = x;
            }
        }
    }
    const form = new FormData();
    form.append("collectionTitle", `New Col(${newColIndex + 1})`);
    axios
        .post("/api/collection/add", form)
        .then(function (response) {
            addContainer(response.data.collection);
        })
        .catch(function (err) {
            alert(err.response.data.msg || "There was a problem.");
        });
}

// DELETE an entire collection, including the notes inside
function deleteCollection(ev) {
    const collectionTitle = ev.parentElement.parentElement.textContent.trim();
    const form = new FormData();
    form.append("collectionTitle", collectionTitle);
    axios
        .post("/api/collection/delete", form)
        .then(function (response) {
            deleteContainer(response.data.collection);
            if (
                JSON.parse(sessionStorage.getItem("currentNote"))
                    .collectionTitle === collectionTitle
            ) {
                sessionStorage.removeItem("currentNote");
            }
        })
        .catch(function (err) {
            alert(err.response.data.msg || "There was a problem.");
        });
}

function shareNote() {
    const note = JSON.parse(sessionStorage.getItem("currentNote"));
    const form = new FormData();
    form.append("noteTitle", note.title);
    form.append("collectionTitle", note.collectionTitle);
    axios
        .post("/api/note/share", form)
        .then(function (response) {
            alert(
                `The share link is ${window.location.origin}${response.data.link}`
            );
        })
        .catch(function (err) {
            alert(err.response.data.msg || "There was a problem.");
        });
}

// Initialize dashboard
window.onload = () => {
    sessionStorage.clear();
};
axios
    .get("/api/user/collections?includeCollaborations=true")
    .then(initializeDashboard)
    .catch(function (err) {
        alert(err.response.data.msg || "There was a problem.");
    });

// TODO: de facut ca butoanele delete, share etc sa apara doar cand este o nota deschisa
// window.onstorage = (ev) => {
//     alert("lala");
//     if (ev.storageArea === sessionStorage && ev.key == "currentNote") {
//         document
//             .querySelectorAll(".dashboard-workspace-buttons > i")
//             .forEach((elem) => (elem.style.display = "inline-block"));
//     }
// };
// ========================= FUNCTIONS FOR MODIFYING DISPLAYED DATA ======================

// DISPLAY note content
function displayNote(note) {
    dashBoardWorkspaceTextarea.textContent = note.content;
    noteTitleField.textContent = note.title;
}

function initializeDashboard(response) {
    for (let col of response.data.collections) {
        addContainer(col);
    }
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
        '<i class="fas fa-plus" onclick="addNote(this)"></i>' +
        '<i class="fas fa-trash" onclick="deleteCollection(this)"></i>';
    containerHeading.appendChild(containerTools);
    container.appendChild(containerHeading);
    if (collection.notes) {
        for (let note of collection.notes) {
            addNoteToContainer(note, container);
        }
    }
    sidebar.appendChild(container);
    sidebar.scrollTop = sidebar.scrollHeight;
    return container;
}

function deleteContainer(collection) {
    const containerHeadings = document.querySelectorAll(
        ".sidebar-container-heading"
    );
    let toDelete;
    for (let h of containerHeadings) {
        if (h.textContent.trim() === collection.title) {
            toDelete = h.parentElement;
            break;
        }
    }

    if (toDelete) {
        toDelete.classList.add("animate-out");
        setTimeout(() => {
            toDelete.parentElement.removeChild(toDelete);
        }, 300);
    }
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
    const elements = container.querySelectorAll(".sidebar-container-element");
    let toDelete;
    for (let el of elements) {
        if (el.textContent.trim() === note.title) {
            toDelete = el;
            break;
        }
    }
    if (toDelete) {
        toDelete.classList.add("animate-out");
        setTimeout(() => {
            toDelete.parentElement.removeChild(toDelete);
        }, 300);
    }
}

function modifyActiveNote(containerElement) {
    const actives = document.querySelectorAll(".active-note");
    if (actives.length > 0)
        actives.forEach((elem) => {
            elem.classList.remove("active-note");
            elem.onclick = getNote;
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
        saveButton.style.backgroundColor = "var(--info-color)";
        saveButton.onclick = null;
    } else {
        saveButton.innerHTML = '<i class="fas fa-save"></i>';
        saveButton.style.backgroundColor = "var(--success-color)";
        saveButton.onclick = updateNote;
    }
}

function copyToClipboard() {
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

// window.onorientationchange = window.onresize = () => {
    // if (window.innerWidth >= 900) {
    //     sidebar.style.height =
    //         window.innerHeight > window.innerWidth
    //             ? window.innerHeight
    //             : window.innerWidth -
    //               document.getElementsByClassName("navbar")[0].clientHeight -
    //               document.getElementsByClassName("separator")[0].clientHeight;
    // }
// };
