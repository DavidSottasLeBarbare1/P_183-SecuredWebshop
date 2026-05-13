require('dotenv').config({ path: '../.env' });

const express = require("express");
const https = require('https');
const fs = require('fs');
const path = require("path");
const cookieParser = require('cookie-parser');
const authSecurity = require('./middleware/auth');
const adminSecurity = require('./middleware/admin');
const argon2 = require('argon2');
const db = require('./config/db');
const pepper = process.env.DB_PEPPER

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
  createUsers()
  console.log(`Serveur lancé sur https://localhost:${PORT}`);
});

async function createUsers() {
  const users = [
    { email: 'admin@webshop.com', password: 'admin123' },
    { email: 'alice@webshop.com', password: 'password123' },
  ];

  for (const u of users) {
    const hash = await argon2.hash(u.password + pepper);
    await new Promise((res, rej) =>
      db.query('UPDATE users SET password = ? WHERE email = ?', [hash, u.email],
        (err) => err ? rej(err) : res())
    );
  }
}

