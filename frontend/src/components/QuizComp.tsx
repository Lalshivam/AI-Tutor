import { useState } from 'react';
import PlotBoard from './PlotBoard';

type QuizOption = { id: string; text: string };
type Quiz = {
  id: string;
  question: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  plotConfig?: any;
};

export default function QuizComp({ quizzes }: { quizzes: Quiz[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!quizzes || quizzes.length === 0) {
    return <div className="quiz-error">No quiz questions available</div>;
  }

  const quiz = quizzes[currentIndex];
  const isCorrect = selectedId === quiz.correctOptionId;

  function handleSelect(id: string) {
    if (selectedId) return; // already answered
    setSelectedId(id);
    setShowExplanation(true);
  }

  function handleNext() {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedId(null);
      setShowExplanation(false);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedId(null);
      setShowExplanation(false);
    }
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h3>Question {currentIndex + 1} of {quizzes.length}</h3>
      </div>

      <div className="quiz-question" dangerouslySetInnerHTML={{ __html: quiz.question }} />

      {quiz.plotConfig && (
        <div className="quiz-plot">
          <PlotBoard config={quiz.plotConfig} />
        </div>
      )}

      <div className="quiz-options">
        {quiz.options.map(opt => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            disabled={!!selectedId}
            className={`quiz-option ${selectedId === opt.id ? 'selected' : ''} ${
              selectedId && opt.id === quiz.correctOptionId ? 'correct' : ''
            } ${selectedId && opt.id === selectedId && opt.id !== quiz.correctOptionId ? 'incorrect' : ''}`}
          >
            <span className="option-id">{opt.id}.</span>
            <span dangerouslySetInnerHTML={{ __html: opt.text }} />
          </button>
        ))}
      </div>

      {showExplanation && (
        <div className={`quiz-result ${isCorrect ? 'correct' : 'incorrect'}`}>
          <strong>{isCorrect ? '✅ Correct!' : '❌ Incorrect'}</strong>
          <p dangerouslySetInnerHTML={{ __html: quiz.explanation }} />
        </div>
      )}

      <div className="quiz-nav">
        <button onClick={handlePrev} disabled={currentIndex === 0} className="quiz-nav-btn">
          ← Previous
        </button>
        <button onClick={handleNext} disabled={currentIndex === quizzes.length - 1} className="quiz-nav-btn">
          Next →
        </button>
      </div>
    </div>
  );
}