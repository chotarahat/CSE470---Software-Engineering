const express = require('express');
const router = express.Router();
const {
  sendMessage,
  sendAnonymousMessage,
  getMessages,
} = require('../controllers/messageController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Anonymous student reply
router.post('/anonymous', sendAnonymousMessage);

// Counselor/admin sends a message
router.post('/', protect, authorize('counselor', 'admin'), sendMessage);

// Get messages — works for both authenticated staff and anonymous student (with token)
router.get('/:ticketId', optionalAuth, getMessages);

module.exports = router;