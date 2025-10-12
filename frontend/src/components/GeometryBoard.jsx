import { useEffect, useRef } from "react";
import JXG from "jsxgraph";
import '../../node_modules/jsxgraph/distrib/jsxgraph.css';

export default function GeometryBoard({ config }) {
  const boxRef = useRef(null);   // DOM element
  const boardRef = useRef(null); // JSXGraph board

  useEffect(() => {
    if (!boxRef.current || !config) return;

    JXG.Options.axis.strokeColor = "white";
    JXG.Options.axis.ticks.strokeColor = "white";
    JXG.Options.axis.ticks.label.strokeColor = "white";
    JXG.Options.axis.ticks.label.cssStyle = "color: white;";
    // Clean up old board if it exists
    // if (boardRef.current) {
    //   JXG.JSXGraph.freeBoard(boardRef.current);
    // }
    boxRef.current.setAttribute("id", "jxg-box");
    // Init new board
    const brd = JXG.JSXGraph.initBoard("jxg-box", {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      width:300,
      height:300
    });
    boardRef.current = brd;

    const points = {};
    const circles = {};
    const lines = {};

    config.points?.forEach(p => {
      points[p.label] = brd.create("point", p.coords, { 
        name: p.label, 
        size: 3,
        strokeColor: '#0066cc',
        fillColor: '#0066cc'
      });
    });

    // 2. create segments first and store for future reference
    // 2a. First pass: only segments whose endpoints already exist
config.segments?.forEach(s => {
  const fromPoint = points[s.from];
  const toPoint = points[s.to];

  if (fromPoint && toPoint) {
    const segmentOptions = {
      straightFirst: false,
      straightLast: false,
      strokeWidth: 2,
    };
    if (s.style === "dashed") segmentOptions.dash = 2;
    if (s.color) segmentOptions.strokeColor = s.color;

    const segment = brd.create("segment", [fromPoint, toPoint], segmentOptions);

    if (s.label) lines[s.label] = segment;
    lines[`${s.from}${s.to}`] = segment;
    lines[`${s.to}${s.from}`] = segment;
  }
});

// 3. Derived points
config.derived?.forEach(d => {
  let derivedPoint = null;

  switch (d.op) {
    case "midpoint": {
      const [p1, p2] = d.of.map(label => points[label]);
      if (p1 && p2) {
        derivedPoint = brd.create("midpoint", [p1, p2], {
          name: d.label,
          size: 3,
          strokeColor: '#cc6600',
          fillColor: '#cc6600'
        });
      }
      break;
    }
    case "intersection": {
      const line1 = lines[d.of[0]];
      const line2 = lines[d.of[1]];
      if (line1 && line2) {
        derivedPoint = brd.create("intersection", [line1, line2], {
          name: d.label,
          size: 3,
          strokeColor: '#006600',
          fillColor: '#006600'
        });
      }
      break;
    }i
    case "perpendicular": {
      const pt = points[d.of[0]];
      const ln = lines[d.of[1]];
      if (pt && ln) {
        derivedPoint = brd.create("perpendicularpoint", [ln, pt], {
          name: d.label,
          size: 3,
          strokeColor: '#660066',
          fillColor: '#660066'
        });
      }
      break;
    }
  }

  if (derivedPoint) points[d.label] = derivedPoint;
});

// 2b. Second pass: try again for segments that reference derived points
  config.segments?.forEach(s => {
    if (lines[`${s.from}${s.to}`]) return; // already created

    const fromPoint = points[s.from];
    const toPoint = points[s.to];

    if (fromPoint && toPoint) {
      const segmentOptions = {
        straightFirst: false,
        straightLast: false,
        strokeWidth: 2,
      };
      if (s.style === "dashed") segmentOptions.dash = 2;
      if (s.color) segmentOptions.strokeColor = s.color;

      const segment = brd.create("segment", [fromPoint, toPoint], segmentOptions);

      if (s.label) lines[s.label] = segment;
      lines[`${s.from}${s.to}`] = segment;
      lines[`${s.to}${s.from}`] = segment;
    }
  });
    
    // 4. Create filled polygons
    config.fills?.forEach(f => {
      const polyPoints = f.polygon.map(lbl => points[lbl]).filter(p => p);
      if (polyPoints.length >= 3) {
        brd.create("polygon", polyPoints, { 
          fillColor: f.fillColor || "lightblue", 
          fillOpacity: 0.3,
          borders: { strokeWidth: 1 }
        });
      }
    });
    // 5. Create text annotations
    config.texts?.forEach(t => {
      brd.create("text", [t.coords[0], t.coords[1], t.text], { 
        fontSize: 14,
        fontWeight: 'normal',
        color: '#333333'
      });
    });
    

    // 6. Create circles
    config.circles?.forEach(c => {
      let circle;
      const centerPoint = points[c.center];
      
      if (c.radius && centerPoint) {
        // Circle with fixed radius
        circle = brd.create("circle", [centerPoint, c.radius], {
          strokeColor: c.color || '#0066cc',
          strokeWidth: 2,
          dash: c.style === 'dashed' ? 2 : 0
        });
      } else if (c.through && centerPoint) {
        // Circle through a point
        const throughPoint = points[c.through];
        if (throughPoint) {
          circle = brd.create("circle", [centerPoint, throughPoint], {
            strokeColor: c.color || '#0066cc',
            strokeWidth: 2,
            dash: c.style === 'dashed' ? 2 : 0
          });
        }
      }
      
      if (circle && c.label) {
        circles[c.label] = circle;
      }
    });



    // Auto-zoom to fit all elements
    brd.resizeContainer(500, 500);

  }, [config]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (boardRef.current) {
        JXG.JSXGraph.freeBoard(boardRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={boxRef}
      style={{ width: "300px", height: "300px", 
      backgroundColor:"#242424",  
      border: "2px solid #55e7ef", borderRadius: "16px", flex: "0 0 auto"}}
    />
  );
}