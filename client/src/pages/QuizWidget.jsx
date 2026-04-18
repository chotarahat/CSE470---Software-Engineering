import React, { useEffect, useState } from 'react';

export default function QuizWidget() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  // load questions
  useEffect(() => {
    fetch('http://localhost:5000/api/quiz')
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.log("Quiz load error:", err));
  }, []);

  // update answer
  const handleChange = (qIndex, value) => {
    const updated = [...answers];
    updated[qIndex] = value;
    setAnswers(updated);
  };

  // submit quiz
  const handleSubmit = async () => {
    if (answers.length !== questions.length) {
      alert("Please answer all questions");
      return;
    }

    const res = await fetch('http://localhost:5000/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Self-Assessment Quiz</h2>

      {/* QUESTIONS */}
      {questions.map((q, i) => (
        <div key={i}>
          <p>{q.question}</p>

          {q.options.map(opt => (
            <label key={opt} style={{ marginRight: '10px' }}>
              <input
                type="radio"
                name={`q${i}`}
                checked={answers[i] === opt}
                onChange={() => handleChange(i, opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <button onClick={handleSubmit}>
        Submit
      </button>

      {/* RESULT */}
      {result && (
        <div>
          <h3>Score: {result.score} / {result.total}</h3>

          <h4>Recommended Resources:</h4>

          {result?.recommendations?.length > 0 ? (
            result.recommendations.map(r => (
              <p key={r._id}>
                {r.title || r.name}
              </p>
            ))
          ) : (
            <p>No recommendations available</p>
          )}

          <p><strong>Category:</strong> {result.recommendedCategory}</p>
        </div>
      )}
    </div>
  );
}