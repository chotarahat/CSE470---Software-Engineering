const express = require('express');
const router = express.Router();
const { logMood, getMoodHistory } = require('../controllers/moodController');

// POST /api/mood - Submit a new mood log
router.post('/', logMood);

// GET /api/mood/:deviceId - Fetch 14-day history for a specific device
router.get('/:deviceId', getMoodHistory);

module.exports = router;