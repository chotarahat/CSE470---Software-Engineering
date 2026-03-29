const mongoose = require('mongoose');
const crypto = require('crypto');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    default: () => 'TKT-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
  },
  // No student reference — anonymous by design
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: 10,
  },
  status: {
    type: String,
    // Full SRS lifecycle: open → assigned → responded → closed
    // 'in-progress' kept for backwards compatibility / counselor working state
    enum: ['open', 'assigned', 'in-progress', 'responded', 'resolved', 'closed'],
    default: 'open',
  },
  assignedCounselor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Anonymous session token so the student can track their own ticket
  anonymousToken: {
    type: String,
    required: true,
  },
  // ── Lifecycle timestamps (SRS analytics requirement) ──
  assignedAt:      { type: Date, default: null },
  firstResponseAt: { type: Date, default: null },
  resolvedAt:      { type: Date, default: null },

  // ── Automated Crisis Trigger fields ──
  isCrisis:           { type: Boolean, default: false },     // flagged by crisisDetector
  crisisKeywords:     [{ type: String }],                    // which keywords triggered it
  severityScore:      { type: Number, default: 0 },          // total keyword weight score
  crisisAcknowledged: { type: Boolean, default: false },     // counselor has seen the alert
  crisisAcknowledgedAt: { type: Date, default: null },       // when they acknowledged it
}, { timestamps: true });

// ── Valid status transitions ──
// Enforced in the controller, documented here for clarity
// open → assigned → in-progress → responded → resolved → closed
// Admin can force any transition; counselor follows the chain
ticketSchema.statics.VALID_TRANSITIONS = {
  open:         ['assigned', 'in-progress', 'closed'],
  assigned:     ['in-progress', 'responded', 'closed'],
  'in-progress':['responded', 'resolved', 'closed'],
  responded:    ['in-progress', 'resolved', 'closed'],
  resolved:     ['closed', 'in-progress'],
  closed:       [],   // terminal — admin can force reopen via direct status set
};


module.exports = mongoose.model('Ticket', ticketSchema);