const Paper = require('../models/Paper');
const { createLog } = require('../middleware/logger');
const { escapeRegex } = require('../utils/security');
const fs = require('fs');
const path = require('path');

// ─── Public Endpoints ────────────────────────────────────────────────────────

/**
 * GET /api/papers
 * Public search + filter + paginate (approved papers only)
 */
exports.getPublicPapers = async (req, res, next) => {
  try {
    const {
      q,
      year,
      conference,
      author,
      keyword,
      featured,
      sort = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    const filter = { status: 'approved' };

    // Featured filter
    if (featured === 'true' || featured === true) {
      filter.isFeatured = true;
    }

    // Full-text search
    if (typeof q === 'string' && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    // Year filter (ReDoS protected)
    if (typeof year === 'string' && year.trim()) {
      filter.conferenceDate = { $regex: escapeRegex(year.trim()), $options: 'i' };
    }

    // Conference filter (ReDoS protected)
    if (typeof conference === 'string' && conference.trim()) {
      filter.conferenceName = { $regex: escapeRegex(conference.trim()), $options: 'i' };
    }

    // Author filter (ReDoS protected)
    if (typeof author === 'string' && author.trim()) {
      filter.authors = { $elemMatch: { $regex: escapeRegex(author.trim()), $options: 'i' } };
    }

    // Keyword filter (ReDoS protected)
    if (typeof keyword === 'string' && keyword.trim()) {
      filter.keywords = {
        $elemMatch: { $regex: escapeRegex(keyword.trim()), $options: 'i' },
      };
    }

    // Sort
    let sortObj = { createdAt: -1 }; // newest
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    if (sort === 'az') sortObj = { title: 1 };
    if (q && sort === 'relevant') sortObj = { score: { $meta: 'textScore' } };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const projectFields = q
      ? { score: { $meta: 'textScore' } }
      : {};

    const [papers, total] = await Promise.all([
      Paper.find(filter, projectFields)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('uploadedBy', 'name'),
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
 * GET /api/papers/:id
 * Public - full paper details
 */
exports.getPaperById = async (req, res, next) => {
  try {
    const paper = await Paper.findById(req.params.id).populate(
      'uploadedBy',
      'name email department'
    );

    if (!paper) {
      return res
        .status(404)
        .json({ success: false, message: 'Paper not found.' });
    }

    const isOwner =
      req.user && paper.uploadedBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (paper.status !== 'approved' && !isOwner && !isAdmin) {
      return res
        .status(404)
        .json({ success: false, message: 'Paper not found or pending approval.' });
    }

    res.status(200).json({ success: true, data: paper });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/papers/:id/related
 * Public - recommend papers by keywords, conference, not self
 */
exports.getRelatedPapers = async (req, res, next) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) {
      return res
        .status(404)
        .json({ success: false, message: 'Paper not found.' });
    }

    const related = await Paper.find({
      _id: { $ne: paper._id },
      status: 'approved',
      $or: [
        { keywords: { $in: paper.keywords } },
        { conferenceName: paper.conferenceName },
      ],
    })
      .limit(5)
      .select('title authors conferenceName createdAt keywords');

    res.status(200).json({ success: true, data: related });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/papers/:id/download
 * Stream PDF file for download
 */
exports.downloadPaper = async (req, res, next) => {
  try {
    const paper = await Paper.findById(req.params.id);

    if (!paper) {
      return res
        .status(404)
        .json({ success: false, message: 'Paper not found.' });
    }

    const isOwner =
      req.user && paper.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (paper.status !== 'approved' && !isOwner && !isAdmin) {
      return res
        .status(404)
        .json({ success: false, message: 'Paper not found or pending approval.' });
    }

    const filePath = path.join(__dirname, '..', paper.pdfPath);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ success: false, message: 'PDF file not found on server.' });
    }

    res.download(filePath, `${paper.title}.pdf`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/papers/filters/meta
 * Public - return unique conferences and years for filter dropdowns
 */
exports.getFilterMeta = async (req, res, next) => {
  try {
    const [conferences, years] = await Promise.all([
      Paper.distinct('conferenceName', { status: 'approved' }),
      Paper.distinct('conferenceDate', { status: 'approved' }),
    ]);
    res.status(200).json({ success: true, conferences, years });
  } catch (err) {
    next(err);
  }
};

// ─── Contributor Endpoints ───────────────────────────────────────────────────

/**
 * POST /api/papers
 * Contributor uploads a paper (multipart/form-data)
 */
exports.uploadPaper = async (req, res, next) => {
  try {
    if (!req.files || !req.files.pdf) {
      return res
        .status(400)
        .json({ success: false, message: 'PDF file is required.' });
    }

    const {
      title,
      authors,
      abstract,
      conferenceName,
      conferenceDate,
      conferenceLocation,
      doi,
      electronicISBN,
      printISBN,
      keywords,
    } = req.body;

    // authors and keywords come as comma-separated strings or JSON arrays
    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    };

    const pdfPath = path
      .join('uploads', 'pdfs', req.files.pdf[0].filename)
      .replace(/\\/g, '/');
    const thumbnailPath = req.files.thumbnail
      ? path
          .join('uploads', 'thumbnails', req.files.thumbnail[0].filename)
          .replace(/\\/g, '/')
      : null;

    const paper = await Paper.create({
      title,
      authors: parseArray(authors),
      abstract,
      conferenceName,
      conferenceDate,
      conferenceLocation,
      doi,
      electronicISBN,
      printISBN,
      keywords: parseArray(keywords),
      pdfPath,
      thumbnailPath,
      uploadedBy: req.user._id,
      status: 'pending',
    });

    await createLog(req, `Uploaded paper: "${paper.title}"`, paper);

    res.status(201).json({ success: true, data: paper });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/papers/:id
 * Contributor edits their own pending/rejected paper
 */
exports.updatePaper = async (req, res, next) => {
  try {
    let paper = await Paper.findById(req.params.id);
    if (!paper) {
      return res
        .status(404)
        .json({ success: false, message: 'Paper not found.' });
    }

    if (paper.uploadedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to edit this paper.' });
    }

    if (paper.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit an approved paper. Please resubmit.',
      });
    }

    const parseArray = (val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val;
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    };

    const updates = { ...req.body };
    if (updates.authors) updates.authors = parseArray(updates.authors);
    if (updates.keywords) updates.keywords = parseArray(updates.keywords);

    // Handle new PDF upload
    if (req.files && req.files.pdf) {
      // Delete old PDF
      const oldPath = path.join(__dirname, '..', paper.pdfPath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      updates.pdfPath = path
        .join('uploads', 'pdfs', req.files.pdf[0].filename)
        .replace(/\\/g, '/');
    }

    // Handle new thumbnail
    if (req.files && req.files.thumbnail) {
      if (paper.thumbnailPath) {
        const oldThumb = path.join(__dirname, '..', paper.thumbnailPath);
        if (fs.existsSync(oldThumb)) fs.unlinkSync(oldThumb);
      }
      updates.thumbnailPath = path
        .join('uploads', 'thumbnails', req.files.thumbnail[0].filename)
        .replace(/\\/g, '/');
    }

    // Reset status to pending on resubmit
    updates.status = 'pending';
    updates.adminRemarks = '';

    paper = await Paper.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    await createLog(req, `Edited paper: "${paper.title}"`, paper);

    res.status(200).json({ success: true, data: paper });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/papers/:id
 * Contributor deletes their own paper
 */
exports.deletePaper = async (req, res, next) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) {
      return res
        .status(404)
        .json({ success: false, message: 'Paper not found.' });
    }

    const isOwner = paper.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to delete this paper.' });
    }

    // Delete files from upload folder
    if (paper.pdfPath) {
      const pdfFull = path.join(__dirname, '..', paper.pdfPath);
      if (fs.existsSync(pdfFull)) {
        try {
          fs.unlinkSync(pdfFull);
        } catch (fileErr) {
          console.error('Failed to unlink PDF file:', fileErr.message);
        }
      }
    }

    if (paper.thumbnailPath) {
      const thumbFull = path.join(__dirname, '..', paper.thumbnailPath);
      if (fs.existsSync(thumbFull)) {
        try {
          fs.unlinkSync(thumbFull);
        } catch (fileErr) {
          console.error('Failed to unlink thumbnail file:', fileErr.message);
        }
      }
    }

    await paper.deleteOne();
    await createLog(req, `Deleted paper: "${paper.title}"`);

    res.status(200).json({ success: true, message: 'Paper deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

/**
 * PATCH /api/papers/:id/status
 * Admin approves / rejects / requests changes
 */
exports.updatePaperStatus = async (req, res, next) => {
  try {
    const { status, adminRemarks } = req.body;
    const allowed = ['approved', 'rejected', 'changes_requested'];

    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid status.' });
    }

    const paper = await Paper.findByIdAndUpdate(
      req.params.id,
      { status, adminRemarks: adminRemarks || '' },
      { new: true }
    ).populate('uploadedBy', 'name');

    if (!paper) {
      return res
        .status(404)
        .json({ success: false, message: 'Paper not found.' });
    }

    const actionMap = {
      approved: 'Approved',
      rejected: 'Rejected',
      changes_requested: 'Requested changes on',
    };

    await createLog(
      req,
      `${actionMap[status]} paper: "${paper.title}"`,
      paper
    );

    res.status(200).json({ success: true, data: paper });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/papers
 * Admin - all papers with optional filters
 */
exports.getAllPapersAdmin = async (req, res, next) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [papers, total] = await Promise.all([
      Paper.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('uploadedBy', 'name email'),
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
 * PATCH /api/papers/:id/featured
 * Admin toggles isFeatured status on a paper
 */
exports.toggleFeatured = async (req, res, next) => {
  try {
    const { isFeatured } = req.body;
    const paper = await Paper.findByIdAndUpdate(
      req.params.id,
      { isFeatured: typeof isFeatured === 'boolean' ? isFeatured : true },
      { new: true }
    ).populate('uploadedBy', 'name email');

    if (!paper) {
      return res.status(404).json({ success: false, message: 'Paper not found.' });
    }

    await createLog(
      req,
      `Admin ${paper.isFeatured ? 'marked as featured' : 'unmarked from featured'}: "${paper.title}"`,
      paper
    );

    res.status(200).json({ success: true, data: paper });
  } catch (err) {
    next(err);
  }
};
