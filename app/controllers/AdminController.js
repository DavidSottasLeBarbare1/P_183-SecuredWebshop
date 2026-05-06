const db = require("../config/db");

module.exports = {
  // ----------------------------------------------------------
  // GET /api/admin/users
  // ----------------------------------------------------------
  getUsers: (_req, res) => {
    db.query(
      "SELECT id, username, email, role, address FROM users",
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: "Erreur serveur" });
        }
        res.json(results);
      },
    );
  },

  unlockUser: (req, res) => {
    const { id } = req.params;
    db.query(
      "UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?",
      [id],
      (err) => {
        if (err) return res.status(500).json({ error: "Erreur serveur" });
        res.json({ message: "Compte débloqué" });
      },
    );
  },
};
