// =============================================================
// Middleware d'authentification
// =============================================================

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).redirect('/login');
    }

    try {
        // Token verfication
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
      } catch (error) {
        res.clearCookie('token');
        return res.status(401).redirect('/login');
    }
};