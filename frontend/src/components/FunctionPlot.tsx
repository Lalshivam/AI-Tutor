// for 2D function plots with sliders, using JSXGraph
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

interface FunctionPlotsConfig {
  sliders?: SliderConfig[];
  functions?: FunctionConfig[];
}

interface FunctionPlotsProps {
  config: FunctionPlotsConfig;
}

export default function FunctionPlots({ config }: FunctionPlotsProps) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<JXG.Board | null>(null);

  useEffect(() => {
    if (!boxRef.current || !config) return;
    if (boardRef.current) JXG.JSXGraph.freeBoard(boardRef.current);
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
        brd.create(
          "functiongraph",
          [
            (x: number): number => {
              const argNames: string[] = ["x", ...Object.keys(sliders)];
              const argValues: number[] = [x, ...Object.keys(sliders).map((k: string) => sliders[k].Value() as number)];
              const fn: (...args: number[]) => number = new Function(...argNames, `return ${f.expression};`) as (...args: number[]) => number;
              return fn(...argValues);
            },
            f.range[0] as number,
            f.range[1] as number,
          ],
          { strokeColor: f.color || "blue", strokeWidth: 2 }
        );
      });
    }
  }, [config]);

  return <div ref={boxRef} style={{ width: "500px", height: "500px" }} />;
}