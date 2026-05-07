const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Only Admins can view security logs
router.get('/', protect, authorize('admin'), getLogs);

module.exports = router;