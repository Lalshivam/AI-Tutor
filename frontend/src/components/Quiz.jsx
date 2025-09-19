import { useState } from "react";

export default function Quiz( {quiz} ) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [currInd, setCurrInd] = useState(0);

  const back = () => {
    setSelected(null);
    setResult(null);
    if(currInd>0){
      setCurrInd(currInd-1);}
  };

  const next=()=>{
    setSelected(null);
    setResult(null);
    if(currInd<quiz.length-1){
      setCurrInd(currInd+1);
    }
  };

//   console.log(quiz); 
//   console.log(quiz.question);
  const checkAnswer = (i) => {
    setSelected(i);
    setResult(i === quiz[currInd].correctIndex);
  };

  return (
    <div className="quiz-container">
    <div className="quiz-box">
      <h3>{quiz[currInd].question}</h3>
      {quiz[currInd].options.map((opt, i) => (
        <button
          key={i}
          className={`option ${selected === i ? "selected" : ""}`}
          onClick={() => checkAnswer(i)}
        >
          {opt}
        </button>
      ))}
      {selected !== null && (
        <div className={`feedback ${result ? "correct" : "wrong"}`}>
          {result ? "✅ Correct!" : "❌ Wrong."}
          <p>{quiz[currInd].explanation}</p>
        </div>
      )}
    </div>
    <div className="quiz-nav">
        <button onClick={back} disabled={currInd === 0}>
          ◀
        </button>
        <span>
          {currInd + 1} / {quiz.length}
        </span>
        <button onClick={next} disabled={currInd === quiz.length - 1}>
           ▶
        </button>
      </div>
    </div>
  );
}