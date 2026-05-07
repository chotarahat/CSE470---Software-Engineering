const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  // An anonymous ID stored in the user's browser
  deviceId: {
    type: String,
    required: true,
    index: true, // Indexed for fast querying by the student/counselor
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  emotionTag: {
    type: String,
    enum: ['anxious', 'sad', 'neutral', 'content', 'happy', 'overwhelmed'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200, // Keep it brief, it's just a tracker
  }
}, { timestamps: true });

module.exports = mongoose.model('MoodLog', moodLogSchema);