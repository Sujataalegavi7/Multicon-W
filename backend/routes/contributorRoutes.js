const express = require('express');
const router = express.Router();
const { getMyPapers, getMyStats } = require('../controllers/contributorController');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(protect, requireRole('contributor', 'admin'));

router.get('/papers', getMyPapers);
router.get('/stats', getMyStats);

module.exports = router;
