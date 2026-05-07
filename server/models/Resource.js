const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },

  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },

  url: {
    type: String,
    trim: true,
  },

  // category (kept as string for quiz compatibility)
  category: {
    type: String,
    required: true,
    trim: true,
  },

  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  tags: [
    {
      type: String,
      trim: true,
    },
  ],

  // (FR-15: Rating system)
  rating: {
    type: Number,
    default: 0,
  },

  ratingCount: {
    type: Number,
    default: 0,
  },

}, { timestamps: true });

// Text index for search
resourceSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

module.exports = mongoose.model('Resource', resourceSchema);