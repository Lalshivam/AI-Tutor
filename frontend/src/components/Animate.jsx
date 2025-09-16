import { useEffect, useRef } from "react";
import JXG from "jsxgraph";
import '../../node_modules/jsxgraph/distrib/jsxgraph.css';

export default function Animate() {
  const boxRef = useRef(null);
  const boardRef = useRef(null);

  useEffect(() => {
    if (!boxRef.current) return;

    // Clean up old board
    if (boardRef.current) {
      JXG.JSXGraph.freeBoard(boardRef.current);
    }

    // Init new board
    const brd = JXG.JSXGraph.initBoard(boxRef.current, {
      boundingbox: [-2, 2, 2, -2],
      axis: true,
    });
    boardRef.current = brd;

    // Draw unit circle centered at (0,0)
    const circle = brd.create("circle", [[0, 0], 1], { strokeColor: "blue" });

    // Create a glider point that moves along the circle
    const P = brd.create("glider", [1, 0, circle], { name: "P", size: 4, color: "red" });

    // Projection lines for sine/cosine
    const xLine = brd.create("line", [[0, 0], [1, 0]], { visible: false });
    const yLine = brd.create("line", [[0, 0], [0, 1]], { visible: false });
    brd.create("perpendicular", [xLine, P], { dash: 2 });
    brd.create("perpendicular", [yLine, P], { dash: 2 });

    // Animate P around the circle
    let angle = 0;
    setInterval(() => {
      angle += 0.02; // step
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      P.moveTo([x, y], 100); // animate to new coords
    }, 50);

  }, []);

  return (
    <div
      ref={boxRef}
      style={{ width: "500px", height: "500px" }}
    />
  );
}
