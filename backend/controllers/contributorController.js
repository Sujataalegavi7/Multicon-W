const Paper = require('../models/Paper');

/**
 * GET /api/contributor/papers
 * Returns the authenticated contributor's own papers
 */
exports.getMyPapers = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { uploadedBy: req.user._id };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [papers, total] = await Promise.all([
      Paper.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Paper.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: papers,
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
 * GET /api/contributor/stats
 * Dashboard counts for the contributor
 */
exports.getMyStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [total, approved, pending, rejected, changes] = await Promise.all([
      Paper.countDocuments({ uploadedBy: userId }),
      Paper.countDocuments({ uploadedBy: userId, status: 'approved' }),
      Paper.countDocuments({ uploadedBy: userId, status: 'pending' }),
      Paper.countDocuments({ uploadedBy: userId, status: 'rejected' }),
      Paper.countDocuments({
        uploadedBy: userId,
        status: 'changes_requested',
      }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, approved, pending, rejected, changesRequested: changes },
    });
  } catch (err) {
    next(err);
  }
};
