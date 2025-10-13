// for 2D function plots with sliders, using JSXGraph 
// // frontend/src/components/FunctionPlot.tsx

import { useEffect, useRef } from "react";
import JXG from "jsxgraph";
import "../../node_modules/jsxgraph/distrib/jsxgraph.css";

interface SliderConfig {
  label: string;
  min: number;
  max: number;
  initial: number;
  position?: [[number, number], [number, number], [number, number]];
}

interface FunctionConfig {
  expression: string;
  range: [number, number];
  color?: string;
}


interface FunctionPlotsProps {
  config: FunctionPlotsConfig;
}

interface ImplicitCurveConfig {
  expression: string; // e.g., "x^2 + y^2 = 1"
  range: [[number, number], [number, number]]; // [[xmin, xmax], [ymin, ymax]]
  color?: string;
}

interface FunctionPlotsConfig {
  sliders?: SliderConfig[];
  functions?: FunctionConfig[];
  implicitCurves?: ImplicitCurveConfig[]; // ✅ Add this
}


// 2D function plotting component
export default function FunctionPlots({ config }: FunctionPlotsProps) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<JXG.Board | null>(null);

  function sanitizeExpression(expr: string): string {
    const mathFunctions = [
      "sin", "cos", "tan", "asin", "acos", "atan",
      "log", "log10", "exp", "sqrt", "abs", "pow", "min", "max", "floor", "ceil", "round"
    ];

    // Add constants like pi and e
    expr = expr.replace(/\bpi\b/gi, "Math.PI");
    expr = expr.replace(/\be\b/g, "Math.E");

    for (const fn of mathFunctions) {
      const pattern = new RegExp(`\\b${fn}\\b`, "g");
      expr = expr.replace(pattern, `Math.${fn}`);
    }

    return expr;
  }

  useEffect(() => {
    if (!boxRef.current || !config) return;
    if (boardRef.current) JXG.JSXGraph.freeBoard(boardRef.current); // Clean up previous board

    const brd = JXG.JSXGraph.initBoard(boxRef.current, {
      boundingbox: [-6, 25, 6, -6],
      axis: true,
    });

    boardRef.current = brd;

    const sliders: { [key: string]: JXG.Slider } = {};

    if (config.sliders) {
      config.sliders.forEach((s) => {
        sliders[s.label] = brd.create(
          "slider",
          s.position || [[-5, 5], [-3, 5], [s.min, s.initial, s.max]],
          { name: s.label }
        );
      });
    }

    if (config.functions) {
      config.functions.forEach((f) => {
        const safeExpression = sanitizeExpression(f.expression);

        brd.create(
          "functiongraph",
          [
            (x: number): number => {
              const argNames: string[] = ["x", ...Object.keys(sliders)];
              const argValues: number[] = [x, ...Object.values(sliders).map((slider) => slider.Value())];

              const fn: (...args: number[]) => number = new Function(
                ...argNames,
                `return ${safeExpression};`
              ) as (...args: number[]) => number;

              return fn(...argValues);
            },
            f.range[0],
            f.range[1],
          ],
          { strokeColor: f.color || "blue", strokeWidth: 2 }
        );
      });
    }


    if (config.implicitCurves) {
      config.implicitCurves.forEach((curve) => {
        const expr = curve.expression.replace(/\^/g, "**"); // x^2 => x**2
        const jsExpr = expr.replace(/=/, "-(") + ")"; // "x**2 + y**2 = 1" → "x**2 + y**2 - (1)"

        const f = (x: number, y: number): number => {
          try {
            const evalExpr = jsExpr.replace(/x/g, `(${x})`).replace(/y/g, `(${y})`);
            return eval(evalExpr);
          } catch {
            return NaN;
          }
        };

        const points: [number, number][] = [];

        const [xMin, xMax] = curve.range[0];
        const [yMin, yMax] = curve.range[1];

        for (let x = xMin; x <= xMax; x += 0.05) {
          for (let y = yMin; y <= yMax; y += 0.05) {
            if (Math.abs(f(x, y)) < 0.05) {
              points.push([x, y]);
            }
          }
        }

        if (points.length > 0) {
          brd.create("curve", [points.map(p => p[0]), points.map(p => p[1])], {
            strokeColor: curve.color || "red",
            strokeWidth: 2,
          });
        }
      });
    }
  }, [config]);

  return <div ref={boxRef} style={{ width: "500px", height: "500px" }} />;
}


// import { useEffect, useRef } from "react";
// import JXG from "jsxgraph";
// import "../../node_modules/jsxgraph/distrib/jsxgraph.css";

// interface SliderConfig {
//   label: string;
//   min: number;
//   max: number;
//   initial: number;
//   position?: [[number, number], [number, number], [number, number]];
// }

// interface FunctionConfig {
//   expression: string;
//   range: [number, number];
//   color?: string;
// }

// interface FunctionPlotsConfig {
//   sliders?: SliderConfig[];
//   functions?: FunctionConfig[];
// }

// interface FunctionPlotsProps {
//   config: FunctionPlotsConfig;
// }

// export default function FunctionPlots({ config }: FunctionPlotsProps) {
//   const boxRef = useRef<HTMLDivElement | null>(null);
//   const boardRef = useRef<JXG.Board | null>(null);

//   useEffect(() => {
//     if (!boxRef.current || !config) return;
//     if (boardRef.current) JXG.JSXGraph.freeBoard(boardRef.current);
//     const brd = JXG.JSXGraph.initBoard(boxRef.current, {
//       boundingbox: [-6, 25, 6, -6],
//       axis: true,
//     });
//     boardRef.current = brd;
//     const sliders: { [key: string]: JXG.Slider } = {};
//     if (config.sliders) {
//       config.sliders.forEach((s) => {
//         sliders[s.label] = brd.create(
//           "slider",
//           s.position || [[-5, 5], [-3, 5], [s.min, s.initial, s.max]],
//           { name: s.label }
//         );
//       });
//     }
//     if (config.functions) {
//       config.functions.forEach((f) => {
//         brd.create(
//           "functiongraph",
//           [
//             (x: number): number => {
//               const argNames: string[] = ["x", ...Object.keys(sliders)];
//               const argValues: number[] = [x, ...Object.keys(sliders).map((k: string) => sliders[k].Value() as number)];
//               const fn: (...args: number[]) => number = new Function(...argNames, `return ${f.expression};`) as (...args: number[]) => number;
//               return fn(...argValues);
//             },
//             f.range[0] as number,
//             f.range[1] as number,
//           ],
//           { strokeColor: f.color || "blue", strokeWidth: 2 }
//         );
//       });
//     }
//   }, [config]);

//   return <div ref={boxRef} style={{ width: "500px", height: "500px" }} />;
// }