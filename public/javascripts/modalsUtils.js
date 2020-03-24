const temp = {
    open: document.getElementById('open-login'),
    modal: document.getElementById('login-modal'),
    close: document.getElementById('close-login-modal')
};

if (temp.open) temp.open.onclick = function () {
    openModal(temp.modal);
    window.onclick = function (event) {
        if (event.target === temp.modal) {
            closeModal(temp.modal);
        }
    };
};

if (temp.close) temp.close.onclick = function () {
    closeModal(temp.modal);
};

function closeModal(modal) {
    modal.style.display = 'none';
    for (let elem of modal.querySelectorAll('input')) {
        elem.value = '';
    }
}

function openModal(modal) {
    modal.style.display = 'block';
}
