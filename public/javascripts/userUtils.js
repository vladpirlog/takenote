const submitRegister = document.getElementById("submit-register");
const registerForm = document.getElementById("register-form");
const submitLogin = document.getElementById("submit-login");
const loginForm = document.getElementById("login-form");
let displayErrors = false;

const indexRegister = document.getElementsByClassName("index-register")[0];
const indexLogin = document.getElementsByClassName("index-login")[0];
if (indexLogin) indexLogin.style.display = "none";

function openLogin() {
    indexRegister.style.display = "none";
    indexLogin.style.display = "grid";
}

function openRegister() {
    indexLogin.style.display = "none";
    indexRegister.style.display = "grid";
}

function register() {
    const form = new FormData();
    axios
        .post("/register", form)
        .then((response) => {
            // responseHandler(registerErrors, response);
        })
        .catch((err) => {
            if (err.response)
                errorHandler(
                    err.response.data.errors || [{ msg: "Server error." }]
                );
        });
}

function login() {
    const form = new FormData(document.getElementById("login-form"));
    axios
        .post("/login", form)
        .then((response) => {
            window.location.pathname = response.data.redirectPath;
        })
        .catch((err) => {
            if (err.response)
                errorHandler(
                    err.response.data.errors || [{ msg: "Server error." }]
                );
        });
}

function errorHandler(errors) {
    if (!displayErrors) {
        displayErrors = true;
        const errorList = document.createElement("div");
        errorList.classList.add("error-list");
        errors.forEach((err) => {
            let elem = document.createElement("p");
            elem.classList.add("error");
            elem.textContent = err.msg;
            errorList.appendChild(elem);
        });
        // TODO: de facut animatie pt slide up
        document.body.appendChild(errorList);
        if (displayErrors)
            setTimeout(() => {
                document.body.removeChild(errorList);
                displayErrors = false;
            }, 4000);
    }
}

function logout() {
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
}
