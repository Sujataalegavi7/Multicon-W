const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'User no longer exists.' });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: 'Your account has been deactivated.' });
    }

    // Invalidate session if token version has changed
    if (typeof decoded.version === 'number' && decoded.version !== (user.tokenVersion || 0)) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated due to password reset or security update. Please log in again.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid or expired token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        if (typeof decoded.version !== 'number' || decoded.version === (user.tokenVersion || 0)) {
          req.user = user;
        }
      }
    }
  } catch (err) {
    // optional, ignore errors
  }
  next();
};

module.exports = { protect, optionalAuth };
