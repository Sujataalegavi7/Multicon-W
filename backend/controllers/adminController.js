const User = require('../models/User');
const Paper = require('../models/Paper');
const Log = require('../models/Log');
const bcrypt = require('bcryptjs');
const { createLog } = require('../middleware/logger');
const { escapeRegex } = require('../utils/security');

/**
 * GET /api/admin/stats
 * Dashboard summary counts
 */
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalPapers,
      pendingPapers,
      approvedPapers,
      rejectedPapers,
      totalContributors,
      recentUploads,
    ] = await Promise.all([
      Paper.countDocuments(),
      Paper.countDocuments({ status: 'pending' }),
      Paper.countDocuments({ status: 'approved' }),
      Paper.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: 'contributor' }),
      Paper.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('uploadedBy', 'name'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPapers,
        pendingPapers,
        approvedPapers,
        rejectedPapers,
        totalContributors,
        recentUploads,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/contributors
 * List all contributors with their stats
 */
exports.getContributors = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: 'contributor' };
    if (typeof search === 'string' && search.trim()) {
      const escaped = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [contributors, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    // Attach paper counts
    const contributorsWithStats = await Promise.all(
      contributors.map(async (u) => {
        const [total, approved, pending, rejected] = await Promise.all([
          Paper.countDocuments({ uploadedBy: u._id }),
          Paper.countDocuments({ uploadedBy: u._id, status: 'approved' }),
          Paper.countDocuments({ uploadedBy: u._id, status: 'pending' }),
          Paper.countDocuments({ uploadedBy: u._id, status: 'rejected' }),
        ]);
        return { ...u.toObject(), stats: { total, approved, pending, rejected } };
      })
    );

    res.status(200).json({
      success: true,
      data: contributorsWithStats,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/contributors
 * Admin creates a contributor account
 */
exports.createContributor = async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      department,
      role: 'contributor',
    });

    await createLog(req, `Admin created contributor: ${user.name}`, null);

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/contributors/:id
 * Admin: toggle active status OR reset password
 */
exports.updateContributor = async (req, res, next) => {
  try {
    const { isActive, newPassword } = req.body;
    const user = await User.findOne({ _id: req.params.id, role: 'contributor' });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Contributor not found.' });
    }

    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await createLog(
        req,
        `Admin ${isActive ? 'activated' : 'deactivated'} contributor: ${user.name}`
      );
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long.',
        });
      }
      user.password = newPassword; // pre-save hook hashes it
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await createLog(req, `Admin reset password for: ${user.name}`);
    }

    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/logs
 * Activity logs with pagination
 */
exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      Log.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email role'),
      Log.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};
