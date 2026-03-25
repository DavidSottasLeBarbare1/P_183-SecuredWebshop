const db = require("../config/db");

module.exports = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;

    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message, query: query });
      }

      if (results.length === 0) {
        return res
          .status(401)
          .json({ error: "Email ou mot de passe incorrect" });
      }
      
      res.redirect('/')
    });
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  register: (req, res) => {
    console.log(req.file)
    if (!req.file) {
      return res.status(400).json({ error: "Photo de profil requise" });
    }

    const { username, email, password, street, zip, city } = req.body;

    const photoPath = "/uploads/" + req.file.filename;
    const role = "user";

    if (!username || !email || !password || !street || !zip || !city) {
      return res
        .status(400)
        .json({ error: "Tous les champs sont obligatoires" });
    }

    const query = `
      INSERT INTO users 
      (username, email, password, role, photo_path, address) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [username, email, password, role, photoPath, `${street}, ${zip} ${city}`],
      (err, result) => {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ error: "Erreur lors de la création du compte" });
        }

        res.status(201).json({
          message: "Utilisateur créé avec succès",
        });
      },
    );
  },
};
