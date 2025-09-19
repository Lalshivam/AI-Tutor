import { useEffect, useRef } from "react";
import JXG from "jsxgraph";
import "../../node_modules/jsxgraph/distrib/jsxgraph.css";

export default function FunctionPlots({ config }) {
  const boxRef = useRef(null);
  const boardRef = useRef(null);

  useEffect(() => {
    if (!boxRef.current || !config) return;

    // Cleanup existing board
    if (boardRef.current) {
      JXG.JSXGraph.freeBoard(boardRef.current);
    }

    // Init new board
    const brd = JXG.JSXGraph.initBoard(boxRef.current, {
      boundingbox: [-6, 25, 6, -6],
      axis: true,
    });
    boardRef.current = brd;

    const sliders = {};

    // 1. Create sliders dynamically
    if (config.sliders) {
      config.sliders.forEach((s) => {
        const pos =
          s.position && s.position.length === 2
            ? s.position
            : [
                [-5, 5], // fallback position
                [-3, 5],
              ];

        sliders[s.label] = brd.create(
          "slider",
          [pos[0], pos[1], [s.min, s.initial, s.max]],
          { name: s.label }
        );
      });
    }

    // 2. Create functions dynamically
    if (config.functions) {
      config.functions.forEach((f) => {
        brd.create(
          "functiongraph",
          [
            (x) => {
              // Build argument list from slider labels
              const argNames = ["x", ...Object.keys(sliders)];
              const argValues = [x, ...Object.keys(sliders).map((k) => sliders[k].Value())];

              // Build a Function with all slider labels
              const fn = new Function(...argNames, `return ${f.expression};`);
              return fn(...argValues);
            },
            f.range[0],
            f.range[1],
          ],
          { strokeColor: f.color || "blue", strokeWidth: 2 }
        );
      });
    }

    // 3. Add optional texts
    if (config.texts) {
    config.texts.forEach((t) => {
        const coords = t.coords || t.position;   // handle both formats
        const text = t.text || t.content;        // handle both formats

        if (coords?.length === 2 && text) {
        brd.create("text", [coords[0], coords[1], text], {
            fontSize: 14,
            fontWeight: "normal",
            color: t.color || "#333333",
        });
        }
    });
    }
  }, [config]);

  return <div ref={boxRef} style={{ width: "500px", height: "500px" }} />;
}
