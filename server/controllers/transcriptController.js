const Ticket  = require('../models/Ticket');
const Message = require('../models/Message');
const { encryptTranscript } = require('../utils/transcriptEncryptor');

/**
 * Builds the plain-text transcript string from a ticket + its messages.
 * Format is human-readable so it makes sense after decryption.
 */
const buildTranscriptText = (ticket, messages) => {
  const lines = [];

  lines.push('═══════════════════════════════════════════════════════');
  lines.push('         VENTIFY — ENCRYPTED CHAT TRANSCRIPT           ');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Ticket ID  : ${ticket.ticketId}`);
  lines.push(`Category   : ${ticket.category?.name || 'Unknown'}`);
  lines.push(`Priority   : ${ticket.priority.toUpperCase()}`);
  lines.push(`Status     : ${ticket.status}`);
  lines.push(`Crisis Flag: ${ticket.isCrisis ? '⚠ YES — Crisis ticket' : 'No'}`);
  lines.push(`Submitted  : ${new Date(ticket.createdAt).toLocaleString()}`);
  lines.push(`Exported   : ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push('ORIGINAL CONCERN:');
  lines.push('─────────────────────────────────────────────────────');
  lines.push(ticket.description);
  lines.push('');
  lines.push('CONVERSATION TRANSCRIPT:');
  lines.push('─────────────────────────────────────────────────────');

  if (messages.length === 0) {
    lines.push('(No messages exchanged yet)');
  } else {
    for (const msg of messages) {
      const timestamp = new Date(msg.createdAt).toLocaleString();
      const sender =
        msg.senderRole === 'student'
          ? '[ANONYMOUS STUDENT]'
          : msg.senderRole === 'counselor'
          ? `[COUNSELOR — ${msg.sender?.name || 'Unknown'}]`
          : `[ADMIN — ${msg.sender?.name || 'Unknown'}]`;

      lines.push('');
      lines.push(`${sender}  •  ${timestamp}`);
      lines.push(msg.messageText);
      lines.push('─────────────────────────────────────────────────────');
    }
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('  This transcript is encrypted with AES-256-CBC.       ');
  lines.push('  Keep your decryption key safe — it is shown once.    ');
  lines.push('═══════════════════════════════════════════════════════');

  return lines.join('\n');
};

// ─────────────────────────────────────────────────────────────
// GET /api/transcripts/:ticketId/export
// Auth: counselor (own ticket) or admin (any ticket)
// Returns: encrypted .txt file download + key in response header
// ─────────────────────────────────────────────────────────────
const exportTranscriptAuthenticated = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('category', 'name')
      .populate('assignedCounselor', 'name');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Counselors can only export their own assigned tickets
    if (req.user.role === 'counselor' &&
        ticket.assignedCounselor?._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Access denied' });

    const messages = await Message.find({ ticket: ticket._id })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    const plaintext = buildTranscriptText(ticket, messages);
    const { encryptedData, key } = encryptTranscript(plaintext);

    const filename = `ventify-transcript-${ticket.ticketId}-${Date.now()}.enc.txt`;

    // Send the encryption key in a custom response header so the
    // frontend can display it to the user — separate from the file
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Encryption-Key', key);
    res.setHeader('X-Ticket-Id', ticket.ticketId);
    // Allow the frontend to read these custom headers (CORS)
    res.setHeader('Access-Control-Expose-Headers', 'X-Encryption-Key, X-Ticket-Id, Content-Disposition');

    res.send(encryptedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/transcripts/:ticketId/export-anonymous?token=...
// Auth: anonymous student with valid token
// Returns: encrypted .txt file + key in header
// ─────────────────────────────────────────────────────────────
const exportTranscriptAnonymous = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Anonymous token required' });

    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('category', 'name')
      .populate('assignedCounselor', 'name');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (ticket.anonymousToken !== token)
      return res.status(403).json({ message: 'Invalid token' });

    const messages = await Message.find({ ticket: ticket._id })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    const plaintext = buildTranscriptText(ticket, messages);
    const { encryptedData, key } = encryptTranscript(plaintext);

    const filename = `ventify-transcript-${ticket.ticketId}-${Date.now()}.enc.txt`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Encryption-Key', key);
    res.setHeader('X-Ticket-Id', ticket.ticketId);
    res.setHeader('Access-Control-Expose-Headers', 'X-Encryption-Key, X-Ticket-Id, Content-Disposition');

    res.send(encryptedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { exportTranscriptAuthenticated, exportTranscriptAnonymous };