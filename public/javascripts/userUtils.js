const submitRegister = document.getElementById('submit-register');
const submitLogin = document.getElementById('submit-login');
let registerErrors = document.getElementById('register-errors');
let loginErrors = document.getElementById('login-errors');
let displayErrors = false;

if (submitRegister) submitRegister.onclick = register;
const registerModal = document.getElementById('register-modal');
if (registerModal) registerModal.onkeydown = function (ev) {
    if (ev.code === 'Enter') register();
};

function register() {
    const xhr = new XMLHttpRequest();
    const form = new FormData(document.getElementById('register-form'));
    xhr.open('POST', window.location.origin + '/register');
    xhr.onload = function () {
        responseHandler(registerErrors, xhr);
    };
    xhr.send(form);
}


if (submitLogin) submitLogin.onclick = login;
const loginModal = document.getElementById('login-form');
if (loginModal) loginModal.onkeydown = function (ev) {
    if (ev.code === 'Enter') login();
};

function login() {
    const xhr = new XMLHttpRequest();
    const form = new FormData(document.getElementById('login-form'));
    xhr.open('POST', window.location.origin + '/login');
    xhr.onload = function () {
        responseHandler(loginErrors, xhr);
    };
    xhr.send(form);
}

function responseHandler(errors, xhr) {
    if (xhr.status < 300) {
        window.location.pathname = JSON.parse(xhr.response)[0].redirectPath;
    } else if (xhr.status >= 400) {
        if (!displayErrors) {
            displayErrors = true;
            for (let err of JSON.parse(xhr.response)) {
                let elem = document.createElement('p');
                elem.classList.add('error');
                elem.textContent = err.msg;
                errors.appendChild(elem);
            }
            if (displayErrors) setTimeout(function () {
                errors.innerHTML = '';
                displayErrors = false;
            }, 3000);
        }
    }
}

let logoutButton = document.getElementById('logout-button');
if (logoutButton) logoutButton.onclick = function () {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', window.location.origin + '/logout');
    xhr.onload = function () {
        const res = JSON.parse(xhr.response)[0];
        if (xhr.status < 300) {
            window.location.pathname = res.redirectPath;
        } else if (xhr.status >= 400) {
            alert(res.msg);
        }
    };
    xhr.send();
};
