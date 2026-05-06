const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const controller = require("../controllers/AuthController");
const { signupValidator } = require("../validators/auth");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives de connexion."},
});

// Configuration de multer pour l'upload de photos
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../public/uploads"),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post("/login", loginLimiter, controller.login);
router.post("/register", upload.single("profile_photo"), controller.register);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout)

module.exports = router;
