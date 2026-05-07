const express = require('express');
const router  = express.Router();
const {
  exportTranscriptAuthenticated,
  exportTranscriptAnonymous,
} = require('../controllers/transcriptController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Counselor/admin export — requires JWT
router.get(
  '/:ticketId/export',
  protect,
  authorize('admin', 'counselor'),
  exportTranscriptAuthenticated
);

// Anonymous student export — requires ?token= query param
router.get(
  '/:ticketId/export-anonymous',
  exportTranscriptAnonymous
);

module.exports = router;
