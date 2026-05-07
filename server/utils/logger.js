const AuditLog = require('../models/AuditLog');

const logEvent = async ({ user, action, status, details = {} }) => {
  try {
    await AuditLog.create({
      user: user || null,
      action,
      status,
      details
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

module.exports = { logEvent };