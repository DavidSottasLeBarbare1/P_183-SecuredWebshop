require('dotenv').config({ path: '../.env' });

const express = require("express");
const https = require('https');
const fs = require('fs');
const path = require("path");
const cookieParser = require('cookie-parser');
const authSecurity = require('./middleware/auth');
const adminSecurity = require('./middleware/admin');

const app = express();

//Cookies 
app.use(cookieParser());

// Middleware pour parser le corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (CSS, images, uploads...)
app.use(express.static(path.join(__dirname, "public")));

// ---------------------------------------------------------------
// Routes API (retournent du JSON)
// ---------------------------------------------------------------
const authRoute    = require("./routes/Auth");
const profileRoute = require("./routes/Profile");
const adminRoute   = require("./routes/Admin");

app.use("/api/auth",    authRoute);
app.use("/api/profile", profileRoute);
app.use("/api/admin",   adminRoute);

// ---------------------------------------------------------------
// Routes pages (retournent du HTML)
// ---------------------------------------------------------------
const homeRoute = require("./routes/Home");
const userRoute = require("./routes/User");

app.use("/", homeRoute);
app.use("/user", userRoute);

app.get("/login",    (_req, res) => res.sendFile(path.join(__dirname, "views", "login.html")));
app.get("/register", (_req, res) => res.sendFile(path.join(__dirname, "views", "register.html")));
app.get("/profile", authSecurity, (_req, res) => res.sendFile(path.join(__dirname, "views", "profile.html")));
app.get("/admin", adminSecurity,    (_req, res) => res.sendFile(path.join(__dirname, "views", "admin.html")));

const options = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

const PORT = 443;

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Erreur serveur' });
});

https.createServer(options, app).listen(PORT, () => {
  console.log(`Serveur lancé sur https://localhost:${PORT}`);
});