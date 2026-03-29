const express = require('express');
const router = express.Router();
const {
  createTicket,
  trackTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  reassignTicket,
  getAnalytics,
  acknowledgeCrisis,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public — no auth required
router.post('/', createTicket);
router.get('/track/:ticketId', trackTicket);

// Protected routes
router.get('/analytics', protect, authorize('admin'), getAnalytics);
router.get('/', protect, authorize('admin', 'counselor'), getTickets);
router.get('/:id', protect, authorize('admin', 'counselor'), getTicketById);
router.patch('/:id/status',            protect, authorize('admin', 'counselor'), updateTicketStatus);
router.patch('/:id/assign',            protect, authorize('admin'), reassignTicket);
router.patch('/:id/acknowledge-crisis', protect, authorize('admin', 'counselor'), acknowledgeCrisis);

module.exports = router;