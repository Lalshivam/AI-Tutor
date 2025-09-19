import { useEffect, useRef } from "react";
import JXG from "jsxgraph";
import '../../node_modules/jsxgraph/distrib/jsxgraph.css';

export default function Animate({ config }) {
  const boxRef = useRef(null);
  const boardRef = useRef(null);

  useEffect(() => {
    if (!boxRef.current) return;

    if (boardRef.current) {
      JXG.JSXGraph.freeBoard(boardRef.current);
    }

    const brd = JXG.JSXGraph.initBoard(boxRef.current, {
      boundingbox: [-3, 3, 3, -3],
      axis: true,
    });
    boardRef.current = brd;

    // Store objects for future use
    const shapes = {};
    const points = {};

    config.shapes?.forEach((shape, i) => {
      let obj;
      if (shape.type === "circle") {
        obj = brd.create("circle", [shape.center, shape.radius], shape.options || {});
      } else if (shape.type === "line") {
        obj = brd.create("line", shape.points, shape.options || {});
      } else if (shape.type === "curve") {
        obj = brd.create("functiongraph", [
          (x) => eval(shape.expression),
          shape.range[0],
          shape.range[1]
        ], shape.options || {});
      }
      if (obj) shapes[`${shape.type}${i}`] = obj;
    });

    // Create points
    config.points?.forEach((pt, i) => {
      let obj;
      if (pt.type === "glider") {
        obj = brd.create("glider", [...pt.initial, shapes[pt.on]], pt.options || {});
      } else {
        obj = brd.create("point", pt.initial, pt.options || {});
      }
      points[pt.name || `P${i}`] = obj;

      // Handle animation
      if (pt.animation) {
        let t = 0;
        setInterval(() => {
          t += pt.animation.step;
          const x = eval(pt.animation.x);
          const y = eval(pt.animation.y);
          obj.moveTo([x, y], 100);
        }, pt.animation.speed);
      }
    });

  }, [config]);

  return (
    <div
      ref={boxRef}
      style={{ width: "364px", height: "364px" }}
    />
  );
}