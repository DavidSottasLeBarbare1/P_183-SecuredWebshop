// =============================================================
// Middleware d'authentification
// =============================================================

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).redirect('/login');

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.clearCookie('token');
      return res.status(401).redirect('/login');
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const newAccessToken = jwt.sign(
        { id: decoded.id, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      res.cookie('token', newAccessToken, { httpOnly: true, secure: false });
      req.user = decoded;
      next();
    } catch {
      res.clearCookie('token');
      res.clearCookie('refreshToken');
      return res.status(401).redirect('/login');
    }
  }
};