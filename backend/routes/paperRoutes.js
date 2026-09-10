const express = require('express');
const router = express.Router();
const {
  getPublicPapers,
  getPaperById,
  getRelatedPapers,
  downloadPaper,
  getFilterMeta,
  uploadPaper,
  updatePaper,
  deletePaper,
  updatePaperStatus,
  toggleFeatured,
} = require('../controllers/paperController');
const { protect, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { upload, validateFileSignatures } = require('../middleware/upload');

// Public routes
router.get('/filters/meta', getFilterMeta);
router.get('/', getPublicPapers);
router.get('/:id', optionalAuth, getPaperById);
router.get('/:id/related', getRelatedPapers);
router.get('/:id/download', optionalAuth, downloadPaper);

// Contributor routes
router.post(
  '/',
  protect,
  requireRole('contributor', 'admin'),
  upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  validateFileSignatures,
  uploadPaper
);

router.put(
  '/:id',
  protect,
  requireRole('contributor', 'admin'),
  upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  validateFileSignatures,
  updatePaper
);

router.delete('/:id', protect, requireRole('contributor', 'admin'), deletePaper);

// Admin routes
router.patch(
  '/:id/status',
  protect,
  requireRole('admin'),
  updatePaperStatus
);

router.patch(
  '/:id/featured',
  protect,
  requireRole('admin'),
  toggleFeatured
);

module.exports = router;
