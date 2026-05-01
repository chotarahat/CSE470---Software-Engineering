const Ticket   = require('../models/Ticket');
const User     = require('../models/User');
const { buildReport } = require('../utils/reportGenerator');

// ─────────────────────────────────────────────────────────────
// GET /api/reports/generate
// Admin only — fetches all analytics data and returns a
// formatted plain-text report as a downloadable .txt file
// ─────────────────────────────────────────────────────────────
const generateReport = async (req, res) => {
  try {
    // ── Fetch all analytics data (mirrors ticketController.getAnalytics) ──
    const total        = await Ticket.countDocuments();
    const open         = await Ticket.countDocuments({ status: 'open' });
    const assigned     = await Ticket.countDocuments({ status: 'assigned' });
    const inProgress   = await Ticket.countDocuments({ status: 'in-progress' });
    const responded    = await Ticket.countDocuments({ status: 'responded' });
    const resolved     = await Ticket.countDocuments({ status: 'resolved' });
    const closed       = await Ticket.countDocuments({ status: 'closed' });

    const totalCrisis          = await Ticket.countDocuments({ isCrisis: true });
    const unacknowledgedCrisis = await Ticket.countDocuments({ isCrisis: true, crisisAcknowledged: false });

    const resolutionRate = total > 0
      ? Math.round(((resolved + closed) / total) * 100)
      : 0;

    // Avg first response time
    const respondedTickets = await Ticket.find({
      firstResponseAt: { $ne: null },
      assignedAt:      { $ne: null },
    }).select('assignedAt firstResponseAt');

    let avgResponseTimeHours = null;
    if (respondedTickets.length > 0) {
      const totalMs = respondedTickets.reduce(
        (sum, t) => sum + (new Date(t.firstResponseAt) - new Date(t.assignedAt)), 0
      );
      avgResponseTimeHours = +(totalMs / respondedTickets.length / 3600000).toFixed(1);
    }

    // Avg resolution time
    const closedTickets = await Ticket.find({ resolvedAt: { $ne: null } })
      .select('createdAt resolvedAt');

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

    // By category
    const byCategory = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$cat.name', 'Uncategorized'] }, count: 1, _id: 0 } },
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
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $dateFromParts: { year: '$_id.y', month: '$_id.m', day: '$_id.d' } },
            },
          },
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

    // ── Build the report ──
    const analytics = {
      total, open, assigned, inProgress, responded, resolved, closed,
      totalCrisis, unacknowledgedCrisis,
      resolutionRate, avgResponseTimeHours, avgResolutionTimeHours,
      byPriority, byCategory, dailyTrend, counselorWorkload,
    };

    const reportText = buildReport(analytics, req.user.name);

    // ── Send as downloadable .txt file ──
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename  = `ventify-report-${timestamp}.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(reportText);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateReport };