import { useState } from "react";
import Quiz from "./Quiz";

export default function QuizContainer({ questions }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="quiz-container">
      <Quiz quiz={questions[currentIndex]} />

      <div className="quiz-nav">
        <button onClick={goBack} disabled={currentIndex === 0}>
          ◀ Back
        </button>
        <span>
          {currentIndex + 1} / {questions.length}
        </span>
        <button onClick={goNext} disabled={currentIndex === questions.length - 1}>
          Next ▶
        </button>
      </div>
    </div>
  );
}