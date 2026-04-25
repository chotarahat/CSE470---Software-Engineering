const express = require('express');
const router  = express.Router();
const { generateReport } = require('../controllers/reportController');
const { protect }    = require('../middleware/authMiddleware');
const { authorize }  = require('../middleware/roleMiddleware');

// Admin only — generate and download the system report
router.get('/generate', protect, authorize('admin'), generateReport);

module.exports = router;