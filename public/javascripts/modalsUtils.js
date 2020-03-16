const temp = [
    {
        open: document.getElementById('open-login'),
        modal: document.getElementById('login-modal'),
        close: document.getElementById('close-login-modal')
    }, {
        open: document.getElementById('open-register'),
        modal: document.getElementById('register-modal'),
        close: document.getElementById('close-register-modal')
    }
];

for (let x of temp) {
    if (x.open) x.open.onclick = function () {
        openModal(x.modal);
        window.onclick = function (event) {
            if (event.target === x.modal) {
                closeModal(x.modal);
            }
        };
    };

    if (x.close) x.close.onclick = function () {
        closeModal(x.modal);
    };
}

function closeModal(modal) {
    modal.style.display = 'none';
    for (let elem of modal.querySelectorAll('input')) {
        elem.value = '';
    }
}

function openModal(modal) {
    modal.style.display = 'block';
}
