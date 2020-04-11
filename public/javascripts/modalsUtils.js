const temp = {
    open: document.getElementById("open-login"),
    modal: document.getElementById("login-modal"),
    close: document.getElementById("close-login-modal"),
};

if (temp.open)
    temp.open.onclick = () => {
        openModal(temp.modal);
        window.onclick = (ev) => {
            if (ev.target === temp.modal) {
                closeModal(temp.modal);
            }
        };
    };

if (temp.close)
    temp.close.onclick = () => {
        closeModal(temp.modal);
    };

function closeModal(modal) {
    modal.style.display = "none";
    for (let elem of modal.querySelectorAll("input")) {
        elem.value = "";
    }
}

function openModal(modal) {
    modal.style.display = "block";
}
