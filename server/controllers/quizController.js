const quizQuestions = [
  {
    question: "Do you often feel stressed about academic work?",
    options: ["Yes", "No"],
    correctAnswer: "Yes",
    category: "Academic Stress"
  },
  {
    question: "Do you feel anxious in social situations?",
    options: ["Yes", "No"],
    correctAnswer: "Yes",
    category: "Anxiety & Depression"
  },
  {
    question: "Do you struggle to manage your daily routine?",
    options: ["Yes", "No"],
    correctAnswer: "Yes",
    category: "General Well-being"
  }
];

// GET quiz
const getQuiz = (req, res) => {
  res.json(quizQuestions);
};

// POST quiz submission
const submitQuiz = async (req, res) => {
  const { answers } = req.body;

  let score = 0;

  quizQuestions.forEach((q, index) => {
    if (answers?.[index] === q.correctAnswer) {
      score++;
    }
  });

  const Resource = require("../models/Resource");

  let recommendations = [];

  try {
    
    recommendations = await Resource.find({})
      .limit(2)
      .lean();
  } catch (err) {
    console.log("Resource fetch error:", err);
  }

  res.json({
    score,
    total: quizQuestions.length,
    recommendations
  });
};

module.exports = { getQuiz, submitQuiz };