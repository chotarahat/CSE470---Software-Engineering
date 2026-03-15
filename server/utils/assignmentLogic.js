const User = require('../models/User');

/**
 * Auto-assign a ticket to the counselor with the fewest active tickets.
 * Returns the counselor document or null if none available.
 */
const autoAssignCounselor = async () => {
  // Find all available counselors
  const counselors = await User.find({ role: 'counselor', availability: true });

  if (!counselors || counselors.length === 0) return null;

  // Pick the counselor with the fewest assigned tickets
  let selected = counselors[0];
  for (const counselor of counselors) {
    if ((counselor.assignedTickets?.length || 0) < (selected.assignedTickets?.length || 0)) {
      selected = counselor;
    }
  }

  return selected;
};

module.exports = { autoAssignCounselor };