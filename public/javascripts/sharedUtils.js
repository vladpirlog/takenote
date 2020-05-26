const sharedCardNoteTitle = document.getElementsByClassName(
    "shared-card-note-title"
)[0];
const sharedCardNoteContent = document.getElementsByClassName(
    "shared-card-note-content"
)[0];
if (window.location.pathname.includes("/share/")) {
    photoModalBackground.onclick = (ev) => {
        if (ev.target == photoModalBackground) closeAttachments();
    };

    document.onkeydown = (ev) => {
        if (ev.keyCode === 27 && photoModalBackground.style.display) {
            ev.preventDefault();
            closeAttachments();
        }
    };
    sharedCardNoteTitle.onclick = sharedCardNoteContent.onclick = (ev) => {
        errorHandler([{ msg: "You can only view the note." }]);
    };
    window.onkeydown = (ev) => {
        if (
            ev.keyCode === 67 &&
            (navigator.platform.match("Mac") ? ev.metaKey : ev.ctrlKey)
        ) {
            ev.preventDefault();
            copySharedToClipboard();
        }
    };
}

function openSharedAttachments(urls) {
    photoModalBackground.style.display = "flex";
    if (urls && urls.length > 0) {
        urls.forEach(addImageToModal);
    } else {
        photoModalContent.innerHTML = "No photos uploaded.";
    }
}

function copySharedToClipboard() {
    copyTextToClipboard(sharedCardNoteContent.innerText);
    notificationHandler([{ msg: "Note content copied to clipboard." }]);
}
