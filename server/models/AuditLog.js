const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional, so we can track anonymous students triggering crisis flags
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN_FAILED', 
      '2FA_FAILED', 
      '2FA_ENABLED', 
      'COUNSELOR_CREATED', 
      'SHIFT_TOGGLED', 
      'PRIORITY_UPDATED', 
      'CRISIS_FLAGGED'
    ]
  },
  status: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILURE', 'WARNING']
  },
  details: {
    type: Object, // Flexible object to store ticket IDs, emails, etc.
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);