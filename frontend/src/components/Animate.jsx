import { useEffect, useRef } from "react";
import JXG from "jsxgraph";
import '../../node_modules/jsxgraph/distrib/jsxgraph.css';

export default function Animate({ config }) {
  const boxRef = useRef(null);
  const boardRef = useRef(null);
  const animationTimersRef = useRef([]); // Store timers for cleanup

  useEffect(() => {
    if (!boxRef.current || !config) return;

    // Cleanup previous board and timers
    // if (boardRef.current) {
    //   JXG.JSXGraph.freeBoard(boardRef.current);
    // }
    animationTimersRef.current.forEach(timer => clearInterval(timer));
    animationTimersRef.current = [];

    // Set JSXGraph styling
    JXG.Options.axis.strokeColor = "white";
    JXG.Options.axis.ticks.strokeColor = "white";
    JXG.Options.axis.ticks.label.strokeColor = "white";
    JXG.Options.axis.ticks.label.cssStyle = "color: white;";

    // Initialize board with dynamic settings
    const boardConfig = {
      boundingbox: config.boundingbox || [-3, 3, 3, -3],
      axis: config.showAxis !== false,
      showCopyright: false,
      ...config.boardOptions
    };
    
    const brd = JXG.JSXGraph.initBoard(boxRef.current, boardConfig);
    boardRef.current = brd;

    // Store objects for reference
    const shapes = {};
    const points = {};
    const lines = {};

    // 1. Create shapes first
    config.shapes?.forEach((shape, i) => {
      let obj;
      const opts = { ...shape.options };
      
      try {
        switch (shape.type) {
          case "circle":
            obj = brd.create("circle", [shape.center, shape.radius], opts);
            break;
            
          case "line":
            obj = brd.create("line", shape.points, opts);
            break;
            
          case "segment":
            obj = brd.create("segment", shape.points, opts);
            break;
            
          case "curve":
          case "functiongraph":
            // Use Function constructor instead of eval for safety
            const fn = new Function('x', `return ${shape.expression}`);
            obj = brd.create("functiongraph", [
              fn,
              shape.range?.[0] || -5,
              shape.range?.[1] || 5
            ], opts);
            break;
            
          case "parametric":
            const xFn = new Function('t', `return ${shape.xExpression}`);
            const yFn = new Function('t', `return ${shape.yExpression}`);
            obj = brd.create("curve", [
              xFn,
              yFn,
              shape.tMin || 0,
              shape.tMax || 2 * Math.PI
            ], opts);
            break;
            
          case "polygon":
            // Points should be created first, referenced by name
            const polyPoints = shape.points.map(name => points[name]);
            if (polyPoints.every(p => p)) {
              obj = brd.create("polygon", polyPoints, opts);
            }
            break;
            
          default:
            console.warn(`Unknown shape type: ${shape.type}`);
        }
        
        if (obj) {
          const key = shape.name || `${shape.type}${i}`;
          shapes[key] = obj;
          if (shape.type === "line" || shape.type === "segment") {
            lines[key] = obj;
          }
        }
      } catch (error) {
        console.error(`Error creating shape ${shape.type}:`, error);
      }
    });

    // 2. Create points
    config.points?.forEach((pt, i) => {
      let obj;
      const opts = { name: pt.name, ...pt.options };
      
      try {
        if (pt.type === "glider") {
          const parent = shapes[pt.on] || lines[pt.on];
          if (parent) {
            obj = brd.create("glider", [...pt.initial, parent], opts);
          }
        } else {
          obj = brd.create("point", pt.initial, opts);
        }
        
        if (obj) {
          const name = pt.name || `P${i}`;
          points[name] = obj;

          // Handle animation with safer evaluation
          if (pt.animation) {
            const anim = pt.animation;
            
            // Parse expressions safely
            const xFn = new Function('t', 'Math', `return ${anim.x}`);
            const yFn = new Function('t', 'Math', `return ${anim.y}`);
            
            let t = anim.startTime || 0;
            const step = anim.step || 0.1;
            const speed = anim.speed || 50;
            const duration = anim.duration; // Optional: stop after duration
            
            const timer = setInterval(() => {
              try {
                const x = xFn(t, Math);
                const y = yFn(t, Math);
                
                if (isFinite(x) && isFinite(y)) {
                  obj.moveTo([x, y], 100);
                }
                
                t += step;
                
                // Stop animation if duration is specified
                if (duration && t >= duration) {
                  clearInterval(timer);
                  const index = animationTimersRef.current.indexOf(timer);
                  if (index > -1) {
                    animationTimersRef.current.splice(index, 1);
                  }
                }
              } catch (error) {
                console.error('Animation error:', error);
                clearInterval(timer);
              }
            }, speed);
            
            animationTimersRef.current.push(timer);
          }
        }
      } catch (error) {
        console.error(`Error creating point ${pt.name}:`, error);
      }
    });

    // 3. Create traces (trails behind moving points)
    config.traces?.forEach((trace) => {
      const pt = points[trace.point];
      if (pt) {
        pt.setAttribute({ trace: true, ...trace.options });
      }
    });

    // 4. Create text labels
    config.texts?.forEach((txt) => {
      try {
        brd.create("text", [txt.coords[0], txt.coords[1], txt.text], {
          fontSize: 14,
          color: '#ffffff',
          ...txt.options
        });
      } catch (error) {
        console.error('Error creating text:', error);
      }
    });

    // Cleanup function
    return () => {
      animationTimersRef.current.forEach(timer => clearInterval(timer));
      animationTimersRef.current = [];
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
      }
    };
  }, [config]);

  return (
    <div
      ref={boxRef}
      style={{
        width: config?.width || "300px",
        height: config?.height || "300px",
        backgroundColor: "#242424",
        border: "2px solid #55e7ef",
        borderRadius: "16px",
        ...config?.style
      }}
    />
  );
}