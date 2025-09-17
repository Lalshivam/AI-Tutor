// A geometry board component using JSXGraph
import { useEffect, useRef } from "react";
import JXG from "jsxgraph";
import "../../node_modules/jsxgraph/distrib/jsxgraph.css";

export default function GeometryBoard({ config }: { config: any }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<any>(null);

  useEffect(() => {
    if (!boxRef.current || !config) return;
    if (boardRef.current) JXG.JSXGraph.freeBoard(boardRef.current);
    const brd = JXG.JSXGraph.initBoard(boxRef.current, {
      boundingbox: [-2, 10, 10, -2],
      axis: true,
    });
    boardRef.current = brd;

    const points: Record<string, any> = {};
    config.points?.forEach((p: any) => {
      points[p.label] = brd.create("point", p.coords, {
        name: p.label,
        size: 3,
        strokeColor: "#0066cc",
        fillColor: "#0066cc",
      });
    });

    config.segments?.forEach((s: any) => {
      const from = points[s.from];
      const to = points[s.to];
      if (from && to) {
        brd.create("segment", [from, to], {
          strokeColor: s.color || "#333",
          dash: s.style === "dashed" ? 2 : 0,
        });
      }
    });

    config.circles?.forEach((c: any) => {
      const center = points[c.center];
      if (center && c.radius) {
        brd.create("circle", [center, c.radius], {
          strokeColor: c.color || "#0066cc",
          dash: c.style === "dashed" ? 2 : 0,
        });
      }
    });

    // Add more as needed (derived points, fills, etc.)
  }, [config]);

  return <div ref={boxRef} style={{ width: "500px", height: "500px" }} />;
}