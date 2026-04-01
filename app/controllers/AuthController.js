const db = require("../config/db");
const argon2 = require("argon2");
const pepper = process.env.DB_PEPPER;
const jwt = require('jsonwebtoken');
const fs = require('fs');

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
        if (err) return res.status(500).json({ error: err.message });

        //Checking if the user entered data is correct
        if (results.length === 0) {
          return res
            .status(401)
            .json({ error: "Email ou mot de passe incorrect" });
        }

        //Declaring the user variable
        const user = results[0];
        console.log('User found:', user.email);

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

        //Creating a new token
        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "2h" },
        );

        //Sending the token in a cookie
        res.cookie('token', token, { httpOnly: true, secure: false });

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
    console.log('Register called');
    console.log('req.file:', req.file);
    if (!req.file) {
      console.log('No file provided');
      return res.status(400).json({ error: "Photo de profil requise" });
    }

    //Gathering every user sent data
    const { username, email, password, street, zip, city } = req.body;
    console.log('Received data:', { username, email, password: '***', street, zip, city });

    // Validate with joi
    const { signupValidator } = require("../validators/auth");
    const { error } = signupValidator({ username, email, password, street, zip, city });
    if (error) {
      console.log('Validation error:', error.details[0].message);
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
      console.log('Missing fields');
      return res
        .status(400)
        .json({ error: "Tous les champs sont obligatoires" });
    }

    try {
      //Hashing the password using argon2 and the pepper
      const pepperedPassword = password + pepper;
      const hashPassword = await argon2.hash(pepperedPassword);
      console.log('Password hashed');

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
            console.error('DB insert error:', err);
            return res
              .status(500)
              .json({ error: "Erreur lors de la création du compte" });
          }
          console.log('User inserted, ID:', result.insertId);
          // Return success JSON
          res.status(201).json({ message: "Utilisateur créé avec succès" });
        },
      );
    } catch (error) {
      console.error('Hash error:', error);
      res.status(500).json({ error: "Erreur de hachage" });
    }
  },
};
