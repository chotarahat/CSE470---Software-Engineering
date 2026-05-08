const express = require('express');
const router = express.Router();
const {
  createTicket,
  trackTicket,
  updateTrackedTicketPriority,
  getTickets,
  getTicketById,
  updateTicketStatus,
  reassignTicket,
  getAnalytics,
  getTicketHeatmap,
  consentToConsultation,
  requestConsultation,
  updateTicketPriority
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public — no auth required
router.post('/', createTicket);
router.get('/track/:ticketId', trackTicket);
router.patch('/track/:ticketId/priority', updateTrackedTicketPriority);
router.patch('/track/:ticketId/consent', consentToConsultation);
router.put('/:ticketId/priority', updateTicketPriority);

// Protected routes
router.get('/analytics', protect, authorize('admin'), getAnalytics);
router.get('/heatmap', protect, authorize('admin'), getTicketHeatmap);
router.get('/', protect, authorize('admin', 'counselor'), getTickets);
router.get('/:id', protect, authorize('admin', 'counselor'), getTicketById);
router.patch('/:id/status', protect, authorize('admin', 'counselor'), updateTicketStatus);
router.patch('/:id/assign', protect, authorize('admin'), reassignTicket);
router.post('/:ticketId/request-call', protect, authorize('counselor', 'admin'), requestConsultation);

module.exports = router;