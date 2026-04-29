const db = require("../config/db");
const argon2 = require("argon2");
const pepper = process.env.DB_PEPPER;
const jwt = require("jsonwebtoken");
const fs = require("fs");
const hashConfig = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};
module.exports = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    try {
      //Declaring a variable for the query using ? to avoid sql injections (A05)
      const query = "SELECT * FROM users WHERE email = ?";

      //Request
      db.query(query, [email], async (err, results) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        //Checking if the user entered data is correct
        if (results.length === 0) {
          return res
            .status(401)
            .json({ error: "Email ou mot de passe incorrect" });
        }

        //Declaring the user variable
        const user = results[0];

        //Verifying the password using argon2
        const pepperedPassword = password + pepper;
        const isPasswordValid = await argon2.verify(
          user.password,
          pepperedPassword,
        );

        //Sending the 401 error if the password is incorrect
        if (!isPasswordValid) {
          return res
            .status(401)
            .json({ error: "Email ou mot de passe incorrect" });
        }

        if (argon2.needsRehash(user.password, hashConfig)) {
          const newHashedPassword = await argon2.hash(
            pepperedPassword,
            hashConfig,
          );

          const updateQuery = "UPDATE users SET password = ? WHERE id = ?";
          db.query(updateQuery, [newHashedPassword, user.id], (err) => {
            if (err) console.error('Rehash error:', err);
          });
        }

        //Creating a new token
        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "15m" },
        );

        const refreshToken = jwt.sign(
          { id: user.id },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: "7d" },
        );

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        db.query(
          "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
          [user.id, refreshToken, expiresAt],
        );

        // Send tokens as cookies
        res.cookie("token", token, { httpOnly: true, secure: false });
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
        });

        // Return success JSON
        res.status(200).json({ message: "Connexion réussie" });
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la vérification" });
    }
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  register: async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Photo de profil requise" });
    }

    //Gathering every user sent data
    const { username, email, password, street, zip, city } = req.body;

    // Validate with joi
    const { signupValidator } = require("../validators/auth");
    const { error } = signupValidator({
      username,
      email,
      password,
      street,
      zip,
      city,
    });
    if (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: error.details[0].message });
    }

    //Getting the path of the pfp
    const photoPath = "/uploads/" + req.file.filename;

    //Setting a default role
    const role = "user";

    //Checking if every user data is present
    if (!username || !email || !password || !street || !zip || !city) {
      return res
        .status(400)
        .json({ error: "Tous les champs sont obligatoires" });
    }

    try {
      //Hashing the password using argon2 and the pepper
      const pepperedPassword = password + pepper;
      const hashPassword = await argon2.hash(pepperedPassword);

      //Declaring a variable for the query using ? to avoid sql injections (A05)
      const query = `
        INSERT INTO users (username, email, password, role, photo_path, address) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      //Request
      db.query(
        query,
        [
          username,
          email,
          hashPassword,
          role,
          photoPath,
          `${street}, ${zip} ${city}`,
        ],
        (err, result) => {
          if (err) {
            console.error("DB insert error:", err);

            if (err.code === "ER_DUP_ENTRY") {
              return res
                .status(409)
                .json({ error: "Cette adresse email est déjà utilisée." });
            }
            return res
              .status(500)
              .json({ error: "Erreur lors de la création du compte" });
          }
          // Return success JSON
          res.status(201).json({ message: "Utilisateur créé avec succès" });
        },
      );
    } catch (error) {
      console.error("Hash error:", error);
      res.status(500).json({ error: "Erreur de hachage" });
    }
  },

  refresh: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: "Token manquant" });

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      db.query(
        `SELECT rt.*, u.role FROM refresh_tokens rt 
   JOIN users u ON u.id = rt.user_id 
   WHERE rt.token = ? AND rt.expires_at > NOW()`,
        [refreshToken],
        (err, results) => {
          if (err || results.length === 0) {
            res.clearCookie("refreshToken");
            return res.status(401).json({ error: "Refresh token invalide" });
          }

          const newAccessToken = jwt.sign(
            { id: decoded.id, role: results[0].role },
            process.env.JWT_SECRET,
            { expiresIn: "15m" },
          );

          res.cookie("token", newAccessToken, {
            httpOnly: true,
            secure: false,
          });
          res.status(200).json({ message: "Token rafraîchi" });
        },
      );
    } catch (err) {
      res.clearCookie("refreshToken");
      return res.status(401).json({ error: "Refresh token expiré" });
    }
  },

  logout: (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      db.query("DELETE FROM refresh_tokens WHERE token = ?", [refreshToken]);
    }
    res.clearCookie("token");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Déconnecté" });
  },
};
