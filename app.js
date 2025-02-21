const express = require("express");
require("express-async-errors");
const cookieParser = require("cookie-parser");
const hostCsrf = require("host-csrf");

const app = express();
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

require("dotenv").config();
const session = require("express-session");
const flash = require("connect-flash");

const MongoDBStore = require("connect-mongodb-session")(session);
const passport = require("passport");
const passportInit = require("./passport/passportInit");
const auth = require("./middleware/auth");
const posts = require('./routes/posts.route.js');


const url = process.env.MONGO_URI;
const store = new MongoDBStore({
  uri: url,
  collection: "mySessions",
});
store.on("error", console.error);

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionParms.cookie.secure = true;
}

app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session(sessionParms));
app.use(flash());
app.use(helmet());
app.use(xss());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));
app.set('trust proxy', 1);

passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.use(
  hostCsrf({
    cookie: true,
    sessionKey: "_csrf",
  })
);

app.use((req, res, next) => {
  const csrfToken = req.signedCookies?.csrfToken;
  if (csrfToken) {
    res.locals.csrfToken = csrfToken;
  }
  res.locals.info = req.flash("info");
  res.locals.errors = req.flash("error");
  res.locals.user = req.user || null;
  next();
});

app.use(require("./middleware/storeLocals"));

app.set("view engine", "ejs");

app.get("/", (req, res) => res.render("index", { csrfToken: res.locals._csrf}));
app.use("/sessions", require("./routes/sessionRoutes.js"));
app.use("/secretWord", auth, require("./routes/secretWord"));
app.use("/posts", auth, posts);

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    res.status(403).render("error", { message: "Invalid CSRF token. Please try again." });
  } else {
    console.error(err);
    res.status(500).send(err.message);
  }
});

const port = process.env.PORT || 3000;
const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () => console.log(`Server is listening on port ${port}...`));
  } catch (error) {
    console.error(error);
  }
};

start();
