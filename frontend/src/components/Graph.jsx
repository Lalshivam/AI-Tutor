import { useEffect, useRef } from "react";

export default function Graph({ equation }) {
  const calculatorRef = useRef(null);

  useEffect(() => {
    if (!window.Desmos) return; // safety check
    const elt = calculatorRef.current;
    const calculator = window.Desmos.GraphingCalculator(elt, {
      expressions: false, // hide side panel
      settingsMenu: false,
    });

    calculator.setExpression({ id: "graph1", latex: equation });

    return () => calculator.destroy(); // clean up on unmount
  }, [equation]);

  return <div ref={calculatorRef} style={{ width: "300px", height: "250px" }} />;
}



