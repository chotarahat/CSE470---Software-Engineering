import React, { useEffect, useState } from 'react';

export default function QuizWidget() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch('http://localhost:5000/api/quiz')
      .then(res => res.json())
      .then(data => setQuestions(data));
  }, []);

  const handleChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

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
    <div>
      <h3>Self Assessment Quiz</h3>

      {/* QUESTIONS */}
      {questions.length > 0 && (
        <div>
          <p>{questions[current].question}</p>

          {questions[current].options.map(opt => (
            <label key={opt} style={{ marginRight: '10px' }}>
              <input
                type="radio"
                name={`q${current}`}
                checked={answers[current] === opt}
                onChange={() => handleChange(current, opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {/* NAVIGATION */}
      <div style={{ marginTop: '1rem' }}>
        {current > 0 && (
          <button onClick={() => setCurrent(current - 1)}>
            Back
          </button>
        )}

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent(current + 1)}>
            Next
          </button>
        ) : (
          <button onClick={handleSubmit}>
            Submit
          </button>
        )}
      </div>

      {/* RESULT */}
      {result && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Score: {result.score} / {result.total}</h4>

          <h5>Recommendations:</h5>

          {result?.recommendations?.map(r => (
            <p key={r._id}>{r.title || r.name}</p>
          ))}
        </div>
      )}
    </div>
  );
}