const crypto = require('crypto');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { autoAssignCounselor } = require('../utils/assignmentLogic');
const generatePseudonym = require('../utils/pseudonymGenerator');

// POST /api/tickets  — anonymous submission
const createTicket = async (req, res) => {
  try {
    const { category, priority, description } = req.body;

    // Generate anonymous token for the student to track their ticket
    const anonymousToken = crypto.randomBytes(32).toString('hex');
    const pseudonym = generatePseudonym();

    const counselor = await autoAssignCounselor();

    const ticket = await Ticket.create({
      category,
      priority,
      description,
      pseudonym,
      anonymousToken,
      hashedIP:req.hashedIP,
      assignedCounselor: counselor ? counselor._id : null,
      status: counselor ? 'in-progress' : 'open',
    });

    if (counselor) {
      await User.findByIdAndUpdate(counselor._id, {
        $push: { assignedTickets: ticket._id },
      });
    }

    // Return the anonymous token ONCE — the student must save it
    res.status(201).json({
      ticketId: ticket.ticketId,
      pseudonym,
      status: ticket.status,
      anonymousToken,
      message: 'Ticket submitted. Save your anonymous token to track this ticket.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/tickets/track/:ticketId?token=...  — student tracks own ticket
const trackTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { token } = req.query;

    const ticket = await Ticket.findOne({ ticketId })
      .populate('category', 'name')
      .populate('assignedCounselor', 'name');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.anonymousToken !== token)
      return res.status(403).json({ message: 'Invalid token' });

    res.json({
      _id: ticket._id,
      ticketId: ticket.ticketId,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      description: ticket.description,
      assignedCounselor: ticket.assignedCounselor ? ticket.assignedCounselor.name : 'Unassigned',
      createdAt: ticket.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/tickets  — counselor sees own tickets, admin sees all
const getTickets = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'counselor') {
      query.assignedCounselor = req.user._id;
    }

    const tickets = await Ticket.find(query)
      .populate('category', 'name')
      .populate('assignedCounselor', 'name email')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/tickets/:id  — counselor/admin view full ticket
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('category', 'name')
      .populate('assignedCounselor', 'name email');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Counselors can only see their own tickets
    if (req.user.role === 'counselor' &&
      ticket.assignedCounselor?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/tickets/:id/status  — counselor/admin updates status
const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = status;
    await ticket.save();
    res.json({ message: 'Status updated', status: ticket.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/tickets/:id/assign  — admin reassigns counselor
const reassignTicket = async (req, res) => {
  try {
    const { counselorId } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Remove from old counselor
    if (ticket.assignedCounselor) {
      await User.findByIdAndUpdate(ticket.assignedCounselor, {
        $pull: { assignedTickets: ticket._id },
      });
    }

    // Assign to new counselor
    ticket.assignedCounselor = counselorId;
    ticket.status = 'in-progress';
    await ticket.save();

    await User.findByIdAndUpdate(counselorId, {
      $push: { assignedTickets: ticket._id },
    });

    res.json({ message: 'Ticket reassigned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/tickets/analytics  — admin only
const getAnalytics = async (req, res) => {
  try {
    const total = await Ticket.countDocuments();
    const open = await Ticket.countDocuments({ status: 'open' });
    const inProgress = await Ticket.countDocuments({ status: 'in-progress' });
    const resolved = await Ticket.countDocuments({ status: 'resolved' });
    const closed = await Ticket.countDocuments({ status: 'closed' });

    const byPriority = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const byCategory = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$categoryInfo.name', count: 1, _id: 0 } },
    ]);

    res.json({ total, open, inProgress, resolved, closed, byPriority, byCategory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  trackTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  reassignTicket,
  getAnalytics,
};