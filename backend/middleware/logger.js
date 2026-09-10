const Log = require('../models/Log');

/**
 * createLog(req, action, paper)
 * Call this after a significant action to persist to the DB.
 */
const createLog = async (req, action, paper = null) => {
  try {
    const logData = {
      action,
      ip:
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        'unknown',
      timestamp: new Date(),
    };

    if (req.user) {
      logData.user = req.user._id;
      logData.userName = req.user.name;
    }

    if (paper) {
      logData.paper = paper._id;
      logData.paperTitle = paper.title;
    }

    await Log.create(logData);
  } catch (err) {
    // Logging failure should not crash the main flow
    console.error('Logging error:', err.message);
  }
};

module.exports = { createLog };
