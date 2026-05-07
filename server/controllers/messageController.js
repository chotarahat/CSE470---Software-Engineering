const Message = require('../models/Message');
const Ticket = require('../models/Ticket');

// POST /api/messages  — counselor/admin sends a message
// POST /api/messages  — counselor/admin sends a message
const sendMessage = async (req, res) => {
  try {
    // 👇 1. Extract audioData from req.body
    const { ticketId, messageText, audioData } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.user.role === 'counselor' &&
      ticket.assignedCounselor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = await Message.create({
      ticket: ticketId,
      senderRole: req.user.role,
      sender: req.user._id,
      messageText,
      audioData: audioData || null // 👇 2. Save it to the database
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages/anonymous  — student replies anonymously
const sendAnonymousMessage = async (req, res) => {
  try {
    // 👇 3. Extract audioData from req.body
    const { ticketId, messageText, anonymousToken, audioData } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.anonymousToken !== anonymousToken)
      return res.status(403).json({ message: 'Invalid token' });

    const message = await Message.create({
      ticket: ticketId,
      senderRole: 'student',
      sender: null,
      messageText,
      audioData: audioData || null // 👇 4. Save it to the database
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/messages/:ticketId  — get all messages for a ticket
const getMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { token } = req.query;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // If not authenticated, validate anonymous token
    if (!req.user) {
      if (!token || ticket.anonymousToken !== token)
        return res.status(403).json({ message: 'Invalid token' });
    } else if (req.user.role === 'counselor' &&
      ticket.assignedCounselor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ ticket: ticketId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, sendAnonymousMessage, getMessages };