const createError = require("http-errors");
const express = require("express");
require("dotenv").config();
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const favicon = require("serve-favicon");
const jwt = require("jsonwebtoken");
const expressSanitizer = require("express-sanitizer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const compression = require("compression");

const app = express();
app.set("env", process.env.NODE_ENV);

mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    })
    .then(() => console.log("MongoDB connected..."))
    .catch((err) => console.log(err));

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const indexRouter = require("./routes/index");
const loginRouter = require("./routes/login");
const logoutRouter = require("./routes/logout");
const registerRouter = require("./routes/register");
const dashboardRouter = require("./routes/dashboard");
const apiUserRouter = require("./routes/apiUser");
const apiCollectionRouter = require("./routes/apiCollection");
const apiNoteRouter = require("./routes/apiNote");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(compression());
app.disable("etag").disable("x-powered-by");
app.use(logger(app.get("env") === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(expressSanitizer());
app.use(
    fileUpload({
        tempFileDir: "./temp/",
        useTempFiles: true,
    })
);
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// Initialize res.locals.isAuthenticated and res.locals.loggedUser
const getLoggedUser = require("./config/getLoggedUser");
app.use(getLoggedUser);

app.use("/", indexRouter);
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);
app.use("/register", registerRouter);
app.use("/dashboard", dashboardRouter);
const checkAuth = require("./config/checkAuth");
app.use("/api/user", checkAuth, apiUserRouter);
app.use("/api/collection", checkAuth, apiCollectionRouter);
app.use("/api/note", checkAuth, apiNoteRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error", { title: "Error" });
});

module.exports = app;
