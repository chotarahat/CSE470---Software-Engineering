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
    enum: ['open', 'in-progress', 'resolved', 'closed'],
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
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);