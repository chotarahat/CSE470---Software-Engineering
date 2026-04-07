const crypto = require('crypto');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Message = require('../models/Message');
const { autoAssignCounselor } = require('../utils/assignmentLogic');
const { worker } = require('cluster');

// POST /api/tickets  — anonymous submission
const createTicket = async (req, res) => {
  try {
    const { category, priority, description } = req.body;
    // const counselor = await autoAssignCounselor(category);
    if (!description || description.trim().length < 10)
      return res.status(400).json({ message: 'Description must be at least 10 characters.' });

    const crisisKeywords=['harm','suicide','kill','end it','hurt myself', 'emergency'];
    const isCrisis=crisisKeywords.some(word => description.toLowerCase().includes(word));

    const anonymousToken = crypto.randomBytes(32).toString('hex');
    const counselor = await autoAssignCounselor(category);

    const ticket = await Ticket.create({
      category,
      priority: priority || 'medium',
      description,
      anonymousToken,
      assignedCounselor: counselor ? counselor._id : null,
      status: counselor ? 'assigned' : 'open',
      assignedAt: counselor ? new Date() : null,
      crisisFlag:isCrisis,
    });

    if (counselor) {
      await User.findByIdAndUpdate(counselor._id, { $push: { assignedTickets: ticket._id } });
    }

    res.status(201).json({
      _id: ticket._id,
      ticketId: ticket.ticketId,
      status: ticket.status,
      anonymousToken,
      crisisFlag:isCrisis,
      message: isCrisis
      ?'Ticket submitted. IMMEDIATE HELP: If you are in danger, please contact local emergency services or the hotlines shown on screen.'
      :'Ticket submitted. Save your anonymous token — it cannot be recovered.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/tickets/track/:ticketId?token=...
const trackTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { token } = req.query;
    const ticket = await Ticket.findOne({ ticketId })
      .populate('category', 'name')
      .populate('assignedCounselor', 'name');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!token || ticket.anonymousToken !== token)
      return res.status(403).json({ message: 'Invalid token' });

    res.json({
      _id: ticket._id,
      ticketId: ticket.ticketId,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      description: ticket.description,
      assignedCounselor: ticket.assignedCounselor ? ticket.assignedCounselor.name : 'Pending assignment',
      assignedAt: ticket.assignedAt,
      firstResponseAt: ticket.firstResponseAt,
      resolvedAt: ticket.resolvedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/tickets  — supports ?status= ?priority= ?category=
const getTickets = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = {};
    if (req.user.role === 'counselor') query.assignedCounselor = req.user._id;
    if (status)   query.status   = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const tickets = await Ticket.find(query)
      .populate('category', 'name')
      .populate('assignedCounselor', 'name email')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/tickets/:id
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('category', 'name')
      .populate('assignedCounselor', 'name email');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (req.user.role === 'counselor' &&
        ticket.assignedCounselor?._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/tickets/:id/status
// Feature 1: full lifecycle with transition validation
// Lifecycle: open → assigned → in-progress → responded → resolved → closed
const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const validStatuses = ['open', 'assigned', 'in-progress', 'responded', 'resolved', 'closed'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });

    // Counselors must follow valid transitions; admins can force any change
    if (req.user.role === 'counselor') {
      const allowed = Ticket.VALID_TRANSITIONS[ticket.status] || [];
      if (!allowed.includes(status))
        return res.status(400).json({
          message: `Invalid transition: ${ticket.status} → ${status}. Allowed: ${allowed.join(', ') || 'none (terminal)'}`,
        });
    }

    const oldStatus = ticket.status;
    ticket.status = status;

    // Auto-set lifecycle timestamps
    if (status === 'assigned' && !ticket.assignedAt) ticket.assignedAt = new Date();
    if ((status === 'resolved' || status === 'closed') && !ticket.resolvedAt) ticket.resolvedAt = new Date();

    await ticket.save();
    res.json({ message: `Status updated: ${oldStatus} → ${status}`, status: ticket.status, resolvedAt: ticket.resolvedAt });
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

    const newCounselor = await User.findById(counselorId);
    if (!newCounselor || newCounselor.role !== 'counselor')
      return res.status(400).json({ message: 'Invalid counselor ID' });

    if (ticket.assignedCounselor)
      await User.findByIdAndUpdate(ticket.assignedCounselor, { $pull: { assignedTickets: ticket._id } });

    ticket.assignedCounselor = counselorId;
    ticket.status = 'assigned';
    ticket.assignedAt = new Date();
    await ticket.save();
    await User.findByIdAndUpdate(counselorId, { $addToSet: { assignedTickets: ticket._id } });

    res.json({ message: 'Ticket reassigned successfully', assignedTo: newCounselor.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/tickets/analytics  — admin only
// Feature 5: total, category distribution, avg response time, resolution rate, trend
const getAnalytics = async (req, res) => {
  try {
    const total      = await Ticket.countDocuments();
    const open       = await Ticket.countDocuments({ status: 'open' });
    const assigned   = await Ticket.countDocuments({ status: 'assigned' });
    const inProgress = await Ticket.countDocuments({ status: 'in-progress' });
    const responded  = await Ticket.countDocuments({ status: 'responded' });
    const resolved   = await Ticket.countDocuments({ status: 'resolved' });
    const closed     = await Ticket.countDocuments({ status: 'closed' });

    // Resolution rate
    const resolutionRate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0;

    // Avg first-response time (hours): from assignedAt → firstResponseAt
    const respondedTickets = await Ticket.find({
      firstResponseAt: { $ne: null }, assignedAt: { $ne: null },
    }).select('assignedAt firstResponseAt');

    let avgResponseTimeHours = null;
    if (respondedTickets.length > 0) {
      const totalMs = respondedTickets.reduce(
        (sum, t) => sum + (new Date(t.firstResponseAt) - new Date(t.assignedAt)), 0
      );
      avgResponseTimeHours = +(totalMs / respondedTickets.length / 3600000).toFixed(1);
    }

    // Avg resolution time (hours): from createdAt → resolvedAt
    const closedTickets = await Ticket.find({ resolvedAt: { $ne: null } }).select('createdAt resolvedAt');
    let avgResolutionTimeHours = null;
    if (closedTickets.length > 0) {
      const totalMs = closedTickets.reduce(
        (sum, t) => sum + (new Date(t.resolvedAt) - new Date(t.createdAt)), 0
      );
      avgResolutionTimeHours = +(totalMs / closedTickets.length / 3600000).toFixed(1);
    }

    // By priority
    const byPriority = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // By category — Feature 5 distribution
    const byCategory = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] }, count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    // Daily trend — last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const dailyTrend = await Ticket.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
      {
        $project: {
          _id: 0,
          date: { $dateToString: { format: '%Y-%m-%d', date: { $dateFromParts: { year: '$_id.y', month: '$_id.m', day: '$_id.d' } } } },
          count: 1,
        },
      },
    ]);

    // Counselor workload
    const counselorWorkload = await User.aggregate([
      { $match: { role: 'counselor' } },
      {
        $lookup: {
          from: 'tickets',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$assignedCounselor', '$$uid'] }, status: { $nin: ['resolved', 'closed'] } } },
          ],
          as: 'activeTickets',
        },
      },
      { $project: { name: 1, availability: 1, activeCount: { $size: '$activeTickets' } } },
      { $sort: { activeCount: -1 } },
    ]);

    res.json({
      total, open, assigned, inProgress, responded, resolved, closed,
      resolutionRate,
      avgResponseTimeHours,
      avgResolutionTimeHours,
      byPriority,
      byCategory,
      dailyTrend,
      counselorWorkload,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTicket, trackTicket, getTickets, getTicketById, updateTicketStatus, reassignTicket, getAnalytics };