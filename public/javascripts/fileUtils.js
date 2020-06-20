const photoModalBackground = document.getElementsByClassName(
    "photo-modal-background"
)[0];
const photoModalContent = document.getElementsByClassName(
    "photo-modal-content"
)[0];
const addAttachment = document.getElementsByClassName(
    "photo-modal-button-add"
)[0];
let currentNote;

if (window.location.pathname === "/dashboard") {
    photoModalBackground.onclick = (ev) => {
        if (ev.target == photoModalBackground) closeAttachments();
    };

    document.onkeydown = (ev) => {
        if (ev.keyCode === 27 && photoModalBackground.style.display) {
            ev.preventDefault();
            closeAttachments();
        }
    };

    addAttachment.onchange = (ev) => {
        const photo = ev.target.files[0];
        const form = new FormData();
        currentNote = JSON.parse(sessionStorage.getItem("currentNote"));
        form.append("noteTitle", currentNote.title);
        form.append("collectionTitle", currentNote.collectionTitle);
        form.append("photo", photo);

        axios
            .post("/api/note/attachment/add", form)
            .then((response) => {
                notificationHandler([{ msg: "Attachment added." }], 2000);
                sessionStorage.setItem(
                    "currentNote",
                    JSON.stringify(response.data.note)
                );
                addImageToModal(response.data.photoURL);
            })
            .catch((err) => {
                alert(err.response.data.msg || "There was a problem.");
            });
    };
}

function deleteAttachment(elem, photoURL) {
    const form = new FormData();
    currentNote = JSON.parse(sessionStorage.getItem("currentNote"));
    form.append("noteTitle", currentNote.title);
    form.append("collectionTitle", currentNote.collectionTitle);
    form.append("photoURL", photoURL);

    axios
        .post("/api/note/attachment/delete", form)
        .then((response) => {
            notificationHandler([{ msg: "Attachment deleted." }], 2000);
            sessionStorage.setItem(
                "currentNote",
                JSON.stringify(response.data.note)
            );
            removeImageFromModal(elem.parentElement);
        })
        .catch((err) => {
            alert(err.response.data.msg || "There was a problem.");
        });
}

function openAttachments() {
    currentNote = JSON.parse(sessionStorage.getItem("currentNote"));
    if (currentNote) {
        photoModalBackground.style.display = "flex";
        if (currentNote.attachments.length > 0) {
            currentNote.attachments.forEach(addImageToModal);
        } else {
            photoModalContent.innerHTML = "No photos uploaded.";
        }
    }
}

function closeAttachments() {
    photoModalBackground.style.display = null;
    photoModalContent.innerHTML = null;
}

function addImageToModal(url) {
    const imageHTML = `<div style="position:relative;">
    <a href=${url} target="_blank">
    <img class="photo-modal-img" src=${url} alt="User uploaded image"></img></a>
    <i class="fas fa-times-circle photo-modal-img-delete" onclick="deleteAttachment(this, '${url}');"></i></div>`;
    if (photoModalContent.innerHTML === "No photos uploaded.") {
        photoModalContent.innerHTML = imageHTML;
    } else {
        photoModalContent.innerHTML += imageHTML;
    }
}

function removeImageFromModal(elem) {
    elem.remove();
    if (!photoModalContent.innerHTML) {
        photoModalContent.innerHTML = "No photos uploaded.";
    }
}
