const express = require('express');
const router = express.Router();
const { getQuiz, submitQuiz } = require('../controllers/quizController');

router.get('/', getQuiz);
router.post('/submit', submitQuiz);

module.exports = router;