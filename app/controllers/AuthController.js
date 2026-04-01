const db = require("../config/db");
const argon2 = require("argon2");
const pepper = process.env.DB_PEPPER;
const jwt = require('jsonwebtoken');

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

        //Redirecting to home
        res.redirect("/");
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
            console.error(err);
            return res
              .status(500)
              .json({ error: "Erreur lors de la création du compte" });
          }
          //Redirecting to login
          res.redirect("/login");
        },
      );
    } catch (error) {
      res.status(500).json({ error: "Erreur de hachage" });
    }
  },
};
