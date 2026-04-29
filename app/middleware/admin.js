// =============================================================
// Admin page middleware
// =============================================================
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).redirect('/login');
    }

    try {
        // Token verification
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).redirect('/');
        }

    } catch (error) {
        console.error('Admin middleware error:', error.message);
        res.clearCookie('token');
        return res.status(401).redirect('/login');
    }
};