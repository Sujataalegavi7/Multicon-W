const express = require('express');
const router = express.Router();
const {
  getStats,
  getContributors,
  createContributor,
  updateContributor,
  getLogs,
} = require('../controllers/adminController');
const { getAllPapersAdmin } = require('../controllers/paperController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(protect, requireRole('admin'));

router.get('/stats', getStats);
router.get('/papers', getAllPapersAdmin);
router.get('/contributors', getContributors);
router.post('/contributors', createContributor);
router.patch('/contributors/:id', updateContributor);
router.get('/logs', getLogs);

module.exports = router;
