const submitRegister = document.getElementById("submit-register");
const registerForm = document.getElementById("register-form");
const submitLogin = document.getElementById("submit-login");
const loginForm = document.getElementById("login-form");
let displayInfo = false;

const indexRegister = document.getElementsByClassName("index-register")[0];
const indexLogin = document.getElementsByClassName("index-login")[0];

if (window.location.pathname === "/") {
    window.onkeydown = (ev) => {
        if (ev.keyCode === 13) {
            if (openCard() === "register") register();
            else if (openCard() === "login") login();
            ev.preventDefault();
        }
    };
}

function openLogin() {
    clearFields();
    indexRegister.classList.add("animate-flip-out");
    setTimeout(() => {
        indexRegister.style.display = "none";
        indexRegister.classList.remove("animate-flip-out");
        indexLogin.style.display = "grid";
        indexLogin.classList.add("animate-flip");
        setTimeout(() => {
            indexLogin.classList.remove("animate-flip");
        }, 160);
    }, 160);
}

function openRegister() {
    clearFields();
    indexLogin.classList.add("animate-flip-out");
    setTimeout(() => {
        indexLogin.style.display = "none";
        indexLogin.classList.remove("animate-flip-out");
        indexRegister.style.display = "grid";
        indexRegister.classList.add("animate-flip");
        setTimeout(() => {
            indexRegister.classList.remove("animate-flip");
        }, 160);
    }, 160);
}

function register() {
    const form = new FormData(registerForm);
    axios
        .post("/register", form)
        .then((response) => {
            notificationHandler(response.data.notifications);
            setTimeout(() => {
                openLogin();
                if (response.data.notifications[0].user.username)
                    document.getElementById("login-email").value =
                        response.data.notifications[0].user.username;
            }, 1000);
        })
        .catch((err) => {
            clearFields("password");
            if (err.response)
                errorHandler(
                    err.response.data.errors || [{ msg: "Server error." }]
                );
        });
}

function login() {
    const form = new FormData(loginForm);
    axios
        .post("/login", form)
        .then((response) => {
            window.location.pathname = response.data.redirectPath;
        })
        .catch((err) => {
            clearFields("password");
            if (err.response)
                errorHandler(
                    err.response.data.errors || [{ msg: "Server error." }]
                );
        });
}

function errorHandler(errors, time = 4000) {
    if (!displayInfo) {
        displayInfo = true;
        const errorList = document.createElement("div");
        errorList.classList.add("error-list");
        errorList.classList.add("animate-slide-down");
        errors.forEach((err) => {
            let elem = document.createElement("p");
            elem.classList.add("error");
            elem.textContent = err.msg;
            errorList.appendChild(elem);
        });
        document.body.appendChild(errorList);
        if (displayInfo)
            setTimeout(() => {
                errorList.classList.remove("animate-slide-down");
                errorList.classList.add("animate-slide-up");
                setTimeout(() => {
                    document.body.removeChild(errorList);
                    displayInfo = false;
                }, 300);
            }, time);
    }
}

function notificationHandler(notif, time = 4000) {
    if (!displayInfo) {
        displayInfo = true;
        const notifList = document.createElement("div");
        notifList.classList.add("notification-list");
        notifList.classList.add("animate-slide-down");
        notif.forEach((n) => {
            let elem = document.createElement("p");
            elem.classList.add("notification");
            elem.textContent = n.msg;
            notifList.appendChild(elem);
        });
        document.body.appendChild(notifList);
        if (displayInfo)
            setTimeout(() => {
                notifList.classList.remove("animate-slide-down");
                notifList.classList.add("animate-slide-up");
                setTimeout(() => {
                    document.body.removeChild(notifList);
                    displayInfo = false;
                }, 300);
            }, time);
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

function clearFields(fields) {
    if (fields === "password") {
        document.getElementById("password").value = "";
        document.getElementById("login-password").value = "";
        document.getElementById("confirm_password").value = "";
    } else {
        document
            .querySelectorAll("input")
            .forEach((input) => (input.value = ""));
    }
}

function openCard() {
    if (indexLogin) {
        if (!indexLogin.style.display || indexLogin.style.display === "none")
            return "register";
        else return "login";
    }
}
