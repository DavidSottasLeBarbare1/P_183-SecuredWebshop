const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const controller = require('../controllers/AuthController');

// Configuration de multer pour l'upload de photos
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../public/uploads"),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post('/login',    controller.login);
router.post('/register', upload.single('profile_photo'), controller.register);

module.exports = router;
