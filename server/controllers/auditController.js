const AuditLog = require('../models/AuditLog');

const getLogs = async (req, res) => {
  try {
    // Fetch latest 100 logs, populate the user info, newest first
    const logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLogs };