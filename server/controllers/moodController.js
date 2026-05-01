const MoodLog = require('../models/MoodLog');

// POST /api/mood
exports.logMood = async (req, res) => {
  try {
    const { deviceId, score, emotionTag, notes } = req.body;
    
    // Optional: Prevent spamming by checking if they already logged today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const existingLog = await MoodLog.findOne({
      deviceId,
      createdAt: { $gte: startOfDay }
    });

    if (existingLog) {
      return res.status(400).json({ message: "You have already logged your mood today." });
    }

    const newLog = await MoodLog.create({ deviceId, score, emotionTag, notes });
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/mood/:deviceId
exports.getMoodHistory = async (req, res) => {
  try {
    // Return the last 14 days of logs, sorted by newest first
    const logs = await MoodLog.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(14); 
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};