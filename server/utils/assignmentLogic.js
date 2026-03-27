// module.exports = { autoAssignCounselor };

 const User = require('../models/User');
 const Ticket = require('../models/Ticket');

/**
 * Feature 2 — Auto-assign a ticket to the counselor with the lowest
 * LIVE active ticket count (excludes resolved/closed).
 * Falls back to null if no available counselor exists.
 */
const autoAssignCounselor = async (ticketCategoryId) => {
  // Only consider counselors who are marked available
 
  
  let candidates=await User.find({
    role:"counselor",
    availability:true,
    specialties:ticketCategoryId
  });

  // const counselors = await User.find({ role: 'counselor', availability: true }).select('_id name');
  if (!candidates || candidates.length === 0) {
    candidates=await User.find({role:'counselor',availability:true});
  }
  if (candidates.length===0) return null;


  // Count active (non-terminal) tickets per counselor via real DB query
  // This avoids stale array counts from User.assignedTickets
  const workloads = await Promise.all(
    candidates.map(async (c) => {
      const count = await Ticket.countDocuments({
        assignedCounselor: c._id,
        status: { $nin: ['resolved', 'closed'] },
      });
      return { counselor: c, count };
    })
  );

  // Sort by active count ascending, pick the lowest
  workloads.sort((a, b) => a.count - b.count);

  return workloads[0].counselor;
};

/**
 * When a counselor toggles availability to false, reassign their open tickets.
 * Call this after saving the counselor's availability = false.
 */
const redistributeTickets = async (unavailableCounselorId) => {
  const Ticket = require('../models/Ticket');

  // Find all active tickets from this counselor
  const orphanedTickets = await Ticket.find({
    assignedCounselor: unavailableCounselorId,
    status: { $nin: ['resolved', 'closed'] },
  });

  for (const ticket of orphanedTickets) {
    // Temporarily set counselor unavailable so autoAssign skips them
    const newCounselor = await User.findOne({
      role: 'counselor',
      availability: true,
      _id: { $ne: unavailableCounselorId },
    });

    if (newCounselor) {
      // Remove from old counselor
      await User.findByIdAndUpdate(unavailableCounselorId, { $pull: { assignedTickets: ticket._id } });

      ticket.assignedCounselor = newCounselor._id;
      ticket.status = 'assigned';
      ticket.assignedAt = new Date();
      await ticket.save();

      await User.findByIdAndUpdate(newCounselor._id, { $addToSet: { assignedTickets: ticket._id } });
    } else {
      // No counselors available — set ticket back to open
      ticket.assignedCounselor = null;
      ticket.status = 'open';
      ticket.assignedAt = null;
      await ticket.save();
      await User.findByIdAndUpdate(unavailableCounselorId, { $pull: { assignedTickets: ticket._id } });
    }
  }

  return orphanedTickets.length;
};

module.exports = { autoAssignCounselor, redistributeTickets };
