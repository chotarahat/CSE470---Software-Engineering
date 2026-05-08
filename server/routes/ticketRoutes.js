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
  consentToConsultation,
  requestConsultation,
  acknowledgeCrisis
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { updateTicketPriority } = require('../controllers/ticketController');
// Public — no auth required
router.post('/', createTicket);
router.get('/track/:ticketId', trackTicket);
router.patch('/track/:ticketId/priority', updateTrackedTicketPriority);
router.patch('/track/:ticketId/consent', consentToConsultation);
router.put('/:ticketId/priority', updateTicketPriority);
// Protected routes
router.get('/analytics', protect, authorize('admin'), getAnalytics);
router.get('/', protect, authorize('admin', 'counselor'), getTickets);
router.get('/:id', protect, authorize('admin', 'counselor'), getTicketById);
router.patch('/:id/status', protect, authorize('admin', 'counselor'), updateTicketStatus);
router.patch('/:id/assign', protect, authorize('admin'), reassignTicket);
router.post('/:ticketId/request-call', protect, requestConsultation);
router.patch('/:id/acknowledge', protect, authorize('admin', 'counselor'), acknowledgeCrisis);

// Add to your Public routes (Student)
router.patch('/track/:ticketId/consent', consentToConsultation);

// Add to your Protected routes (Counselor)
router.post('/:id/request-call', protect, authorize('counselor', 'admin'), requestConsultation);

module.exports = router;