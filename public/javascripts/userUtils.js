const submitRegister = document.getElementById("submit-register");
const submitLogin = document.getElementById("submit-login");
let registerErrors = document.getElementById("register-errors");
let loginErrors = document.getElementById("login-errors");
let displayErrors = false;

if (submitRegister) submitRegister.onclick = register;
const registerModal = document.getElementById("register-modal");
if (registerModal)
    registerModal.onkeydown = (ev) => {
        if (ev.code === "Enter") register();
    };

function register() {
    const form = new FormData(document.getElementById("register-form"));
    axios
        .post("/register", form)
        .then((response) => {
            responseHandler(registerErrors, response);
        })
        .catch((err) => {
            responseHandler(registerErrors, err.response);
        });
}

if (submitLogin) submitLogin.onclick = login;
const loginModal = document.getElementById("login-form");
if (loginModal)
    loginModal.onkeydown = (ev) => {
        if (ev.code === "Enter") login();
    };

function login() {
    const form = new FormData(document.getElementById("login-form"));
    axios
        .post("/login", form)
        .then((response) => {
            responseHandler(loginErrors, response);
        })
        .catch((err) => {
            if (err.response) responseHandler(loginErrors, err.response);
        });
}

function responseHandler(errors, response) {
    if (response.status < 300) {
        window.location.pathname = response.data.redirectPath;
    } else if (response.status >= 400) {
        if (!displayErrors) {
            displayErrors = true;
            for (let err of response.data.errors) {
                let elem = document.createElement("p");
                elem.classList.add("error");
                elem.textContent = err.msg;
                errors.appendChild(elem);
            }
            if (displayErrors)
                setTimeout(() => {
                    errors.innerHTML = "";
                    displayErrors = false;
                }, 3000);
        }
    }
}

let logoutButton = document.getElementById("logout-button");
if (logoutButton)
    logoutButton.onclick = function () {
        axios
            .post("/logout")
            .then((response) => {
                window.location.pathname = response.data.redirectPath;
            })
            .catch((err) => {
                if (err.response.status >= 400) {
                    let str = "";
                    for (let e of err.response.data.errors) {
                        str += e.msg + " ";
                    }
                    alert(str);
                }
            });
    };
