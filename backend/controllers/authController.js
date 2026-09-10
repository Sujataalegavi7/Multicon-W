const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createLog } = require('../middleware/logger');

// Helper: sign JWT
const signToken = (user) =>
  jwt.sign(
    { id: user._id, version: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user);
  const userObj = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    loginId: user.loginId,
  };
  res.status(statusCode).json({ success: true, token, user: userObj });
};

/**
 * POST /api/auth/login
 * Handles both:
 *   - Admin login: loginId + password (code)
 *   - Contributor login: email + password
 */
exports.login = async (req, res, next) => {
  try {
    const { loginId, email, password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: 'Password is required.' });
    }

    let user;

    if (loginId) {
      // Admin login path
      user = await User.findOne({
        loginId: loginId.trim().toLowerCase(),
      }).select('+password');
      if (!user || user.role !== 'admin') {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid admin credentials.' });
      }
    } else if (email) {
      // Contributor login path
      user = await User.findOne({ email: email.toLowerCase() }).select(
        '+password'
      );
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid email or password.' });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: 'Provide loginId or email.' });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: 'Account is deactivated.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials.' });
    }

    await createLog(
      { headers: req.headers, socket: req.socket, user },
      `${user.role === 'admin' ? 'Admin' : 'Contributor'} logged in: ${user.name}`
    );

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/register
 * Public contributor self-registration
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain both letters and numbers.',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      department,
      role: 'contributor',
      tokenVersion: 0,
    });

    await createLog(
      { headers: req.headers, socket: req.socket, user },
      `New contributor registered: ${user.name}`
    );

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
