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
    const brd = JXG.JSXGraph.initBoard(boxRef.current, {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      showCopyright: false,
      defaultAxes: {
        x: { strokeColor: "white" },
        y: { strokeColor: "white" },
      },
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

        // 7. Create ellipses
    config.ellipses?.forEach(e => {
      const centerPoint = points[e.center];
      const focus1 = points[e.focus1];
      const focus2 = points[e.focus2];
      
      if (e.a && e.b && centerPoint) {
        // Ellipse with semi-major and semi-minor axes
        const center = [centerPoint.X(), centerPoint.Y()];
        const aPt = [centerPoint.X() + e.a, centerPoint.Y()];
        const bPt = [centerPoint.X(), centerPoint.Y() + e.b]; 
        const mirrorAPt = [centerPoint.X() - e.a, centerPoint.Y()];
        const mirrorBPt = [centerPoint.X(), centerPoint.Y() - e.b];

        brd.create("ellipse", [aPt, mirrorAPt, bPt], {
          strokeColor: e.color || '#cc0066',
          strokeWidth: 2,
          dash: e.style === 'dashed' ? 2 : 0
        });
      } else if (focus1 && focus2 && e.thirdPoint) {
        // Ellipse defined by two foci and a third point
        const thirdPt = points[e.thirdPoint];
        if (thirdPt) {
          brd.create("ellipse", [focus1, focus2, thirdPt], {
            strokeColor: e.color || '#cc0066',
            strokeWidth: 2,
            dash: e.style === 'dashed' ? 2 : 0
          });
        }
      }
    });

    // 8. Create parabolas
    config.parabolas?.forEach(p => {
      const focus = points[p.focus];
      const directrixLine = lines[p.directrix];
      
      if (focus && directrixLine) {
        brd.create("parabola", [focus, directrixLine], {
          strokeColor: p.color || '#9900cc',
          strokeWidth: 2,
          dash: p.style === 'dashed' ? 2 : 0
        });
      }
    });

    // 9. Create hyperbolas
    config.hyperbolas?.forEach(h => {
      const focus1 = points[h.focus1];
      const focus2 = points[h.focus2];
      const thirdPt = points[h.thirdPoint];
      
      if (focus1 && focus2 && thirdPt) {
        brd.create("hyperbola", [focus1, focus2, thirdPt], {
          strokeColor: h.color || '#cc6600',
          strokeWidth: 2,
          dash: h.style === 'dashed' ? 2 : 0
        });
      }
    });

    // 10. Create angles
    config.angles?.forEach(a => {
      const pt1 = points[a.points[0]];
      const vertex = points[a.points[1]];
      const pt2 = points[a.points[2]];
      
      if (pt1 && vertex && pt2) {
        brd.create("angle", [pt1, vertex, pt2], {
          radius: a.radius || 0.5,
          strokeColor: a.color || '#00cc66',
          fillColor: a.fillColor || '#00cc66',
          fillOpacity: 0.3,
          name: a.label || ''
        });
      }
    });

    // 11. Create arcs
    config.arcs?.forEach(a => {
      const center = points[a.center];
      const start = points[a.start];
      const end = points[a.end];
      
      if (center && start && end) {
        brd.create("arc", [center, start, end], {
          strokeColor: a.color || '#0066cc',
          strokeWidth: 2,
          dash: a.style === 'dashed' ? 2 : 0
        });
      }
    });

    // 12. Create function plots
    config.functions?.forEach(f => {
      brd.create("functiongraph", [f.expression, f.xMin || -5, f.xMax || 5], {
        strokeColor: f.color || '#cc0099',
        strokeWidth: 2,
        dash: f.style === 'dashed' ? 2 : 0
      });
    });

    // 13. Create vectors (arrows)
    config.vectors?.forEach(v => {
      const start = points[v.from];
      const end = points[v.to];
      
      if (start && end) {
        brd.create("arrow", [start, end], {
          strokeColor: v.color || '#cc3300',
          strokeWidth: 2,
          lastArrow: { type: 2, size: 6 }
        });
      }
    });

    // 14. Create parametric curves
    config.parametricCurves?.forEach(c => {
      brd.create("curve", [c.xExpression, c.yExpression, c.tMin || 0, c.tMax || 2 * Math.PI], {
        strokeColor: c.color || '#00cccc',
        strokeWidth: 2,
        dash: c.style === 'dashed' ? 2 : 0
      });
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