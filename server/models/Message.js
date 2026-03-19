const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['student', 'counselor', 'admin'],
    required: true,
  },
  // For counselor/admin messages, store who sent it
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  messageText: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);