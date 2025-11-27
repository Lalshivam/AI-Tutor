import { useEffect, useRef } from 'react';
import JXG from 'jsxgraph';
import '../../node_modules/jsxgraph/distrib/jsxgraph.css';

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
  linewidth?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

interface ImplicitCurveConfig {
  expression: string;
  range: [[number, number], [number, number]];
  color?: string;
}

interface PointConfig {
  label: string;
  coords: [number, number];
  color?: string;
  size?: number;
}

interface SegmentConfig {
  from: string; // point label
  to: string;   // point label
  color?: string;
  linewidth?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

interface CircleConfig {
  center: string; // point label
  radius: number;
  color?: string;
  fillColor?: string;
  fill?: boolean;
}

interface AngleConfig {
  points: [string, string, string]; // e.g., ["A","B","C"] angle at middle point
  label?: string;
  color?: string;
}

interface AnnotationConfig {
  position: [number, number];
  text: string;
  color?: string;
  size?: number;
}

interface PolygonConfig {
  vertices: string[];
  fill?: boolean;
  fillColor?: string;
  strokeColor?: string;
  fillOpacity?: number;
}

interface PlotConfig {
  sliders?: SliderConfig[];
  functions?: FunctionConfig[];
  implicitCurves?: ImplicitCurveConfig[];
  points?: PointConfig[];
  segments?: SegmentConfig[];
  circles?: CircleConfig[];
  angles?: AngleConfig[];
  annotations?: AnnotationConfig[];
  polygons?: PolygonConfig[];
}

export default function PlotBoard({ config }: { config: PlotConfig }) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<JXG.Board | null>(null);
  const boxIdRef = useRef(`jxg-${Math.random().toString(36).slice(2)}`);

  const hasData =
    !!config &&
    (
      (Array.isArray(config.functions) && config.functions.length > 0) ||
      (Array.isArray(config.implicitCurves) && config.implicitCurves.length > 0) ||
      (Array.isArray(config.points) && config.points.length > 0) ||
      (Array.isArray(config.segments) && config.segments.length > 0) ||
      (Array.isArray(config.circles) && config.circles.length > 0) ||
      (Array.isArray(config.angles) && config.angles.length > 0) ||
      (Array.isArray(config.polygons) && config.polygons.length > 0) ||
      (Array.isArray(config.annotations) && config.annotations.length > 0)
    );

  const sanitizeExpression = (expr: string): string => {
    expr = String(expr || '').replace(/\^/g, '**');
    const funcs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'log10', 'exp', 'sqrt', 'abs', 'pow', 'min', 'max', 'floor', 'ceil', 'round'];
    expr = expr.replace(/\bpi\b/gi, '3.14159265359').replace(/\be\b/g, '2.71828182846');
    for (const fn of funcs) expr = expr.replace(new RegExp(`\\b${fn}\\b`, 'g'), `Math.${fn}`);
    return expr;
  };

  useEffect(() => {
    if (!boxRef.current || !hasData) return;

    if (boardRef.current) {
      try { JXG.JSXGraph.freeBoard(boardRef.current); } catch {}
      boardRef.current = null;
    }

    const brd = JXG.JSXGraph.initBoard(boxIdRef.current, {
      boundingbox: [-10, 10, 10, -10],
      axis: true,
      showNavigation: false,
      showCopyright: false,
    });
    boardRef.current = brd;

    try {
      const sliders: Record<string, JXG.Slider> = {};

      const styleToDash = (style?: string) => (style === 'dashed' ? 2 : style === 'dotted' ? 3 : 0);

      // Customize axis styling
    const axisStyle = {
      strokeColor: '#ffffff',  // Set axis line color to white
      strokeWidth: 2,          // Set axis line width
    };

    const tickStyle = {
      strokeColor: '#ffffff',  // Set tick mark color to white
      label: { 
        strokeColor: '#ffffff',  // Set label color to white
      }
    };

    // After board initialization, customize the axes
    (brd.defaultAxes.x as any).setAttribute(axisStyle);   // Apply to x-axis line
    (brd.defaultAxes.y as any).setAttribute(axisStyle);   // Apply to y-axis line
    ((brd.defaultAxes.x as any).defaultTicks as any).setAttribute(tickStyle);   // Apply to x-axis ticks
    ((brd.defaultAxes.y as any).defaultTicks as any).setAttribute(tickStyle);   // Apply to y-axis ticks


      // Functions
      (Array.isArray(config.functions) ? config.functions : []).forEach((f: any) => {
        if (!f?.expression || !Array.isArray(f.range) || f.range.length !== 2) return;
        const safe = sanitizeExpression(f.expression);
        brd.create('functiongraph', [
          (x: number) => {
            try {
              const argNames = ['x', ...Object.keys(sliders)];
              const argValues = [x, ...Object.values(sliders).map(sl => sl.Value())];
              const fn = new Function(...argNames, `return ${safe};`) as (...n: number[]) => number;
              return fn(...argValues);
            } catch { return NaN; }
          },
          f.range[0],
          f.range[1]
        ], {
          strokeColor: f.color || 'deepskyblue',
          strokeWidth: f.linewidth ?? 2,
          dash: styleToDash(f.style),
        });
      });

      // Implicit Curves
      (Array.isArray(config.implicitCurves) ? config.implicitCurves : []).forEach((curve: any) => {
        if (!curve?.expression) return;
        const rngOK = Array.isArray(curve.range) &&
                      curve.range.length === 2 &&
                      Array.isArray(curve.range[0]) &&
                      Array.isArray(curve.range[1]) &&
                      curve.range[0].length === 2 &&
                      curve.range[1].length === 2;
        const rng = rngOK ? curve.range : [[-10, 10], [-10, 10]];
        let expr = String(curve.expression).replace(/\s+/g, '').replace(/\^/g, '**');
        if (expr.includes('=')) {
          const [L, R] = expr.split('=');
          expr = `${L}-(${R})`;
        } else {
          expr = `${expr}-(0)`;
        }
        const f = (x: number, y: number) => {
          try {
            const ev = expr.replace(/x/g, `(${x})`).replace(/y/g, `(${y})`);
            return eval(ev);
          } catch { return NaN; }
        };
        const [xMin, xMax] = rng[0];
        const [yMin, yMax] = rng[1];
        const pts: [number, number][] = [];
        const step = 0.08;
        for (let x = xMin; x <= xMax; x += step) {
          for (let y = yMin; y <= yMax; y += step) {
            if (Math.abs(f(x, y)) < 0.1) pts.push([x, y]);
          }
        }
        if (pts.length) {
          brd.create('curve', [pts.map(p => p[0]), pts.map(p => p[1])], {
            strokeColor: curve.color || 'tomato',
            strokeWidth: 2,
          });
        }
      });

      // Points
      const pointsMap: Record<string, JXG.Point> = {};
      (Array.isArray(config.points) ? config.points : []).forEach((p: any) => {
        if (!p?.label || !Array.isArray(p.coords) || p.coords.length !== 2) return;
        const [x, y] = p.coords;
        if (typeof x !== 'number' || typeof y !== 'number') return;
        pointsMap[p.label] = brd.create('point', [x, y], {
          name: p.label, size: p.size ?? 3, strokeColor: p.color || '#fff', fillColor: p.color || '#fff'
        });
      });

      // Segments
      (Array.isArray(config.segments) ? config.segments : []).forEach((s: any) => {
        const A = s?.from ? pointsMap[s.from] : undefined;
        const B = s?.to ? pointsMap[s.to] : undefined;
        if (A && B) {
          brd.create('segment', [A, B], {
            strokeColor: s.color || '#60a5fa',
            strokeWidth: s.linewidth ?? 2,
            dash: styleToDash(s.style),
          });
        }
      });

      // Circles
      (Array.isArray(config.circles) ? config.circles : []).forEach((c: any) => {
        const C = c?.center ? pointsMap[c.center] : undefined;
        if (C && typeof c.radius === 'number') {
          const circle = brd.create('circle', [C, c.radius], { strokeColor: c.color || '#34d399' });
          if (c.fill) {
            (circle as any).setAttribute({ fillColor: c.fillColor || 'rgba(52,211,153,0.3)' });
          }
        }
      });

      // Annotations
      (Array.isArray(config.annotations) ? config.annotations : []).forEach((a: any) => {
        const pos = Array.isArray(a.position) && a.position.length >= 2 ? [a.position[0], a.position[1]] : [0, 0];
        brd.create('text', [pos[0], pos[1], a.text], {
          color: a.color || 'white',
          fontSize: a.size || 12,
        });
      });

      // Polygons
            (Array.isArray(config.polygons) ? config.polygons : []).forEach((p: any) => {
              const points = p.vertices.map((label: string) => pointsMap[label]);
              if (points.length >= 3) {
                brd.create('polygon', points, {
                  fillColor: p.fillColor || 'yellow',
                  fillOpacity: p.fillOpacity || 0.2,
                  strokeColor: p.strokeColor || 'white',
                });
              }
            });

    } catch (error) {
      console.error("Error initializing JSXGraph board:", error);
    }

  }, [config]);

  return (
    <div ref={boxRef} id={boxIdRef.current} style={{ width: '100%', height: '500px' }} />
  );
}





// import { useEffect, useRef } from 'react';
// import JXG from 'jsxgraph';
// import '../../node_modules/jsxgraph/distrib/jsxgraph.css';

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

// interface ImplicitCurveConfig {
//   expression: string; // e.g. "x^2 + y^2 = 25" or "x - 2"
//   range: [[number, number], [number, number]];
//   color?: string;
// }

// interface PointConfig {
//   label: string;
//   coords: [number, number];
//   color?: string;
// }

// interface SegmentConfig {
//   from: string; // point label
//   to: string;   // point label
//   color?: string;
// }

// interface CircleConfig {
//   center: string; // point label
//   radius: number;
//   color?: string;
// }

// interface AngleConfig {
//   points: [string, string, string]; // e.g., ["A","B","C"] angle at middle point
//   label?: string;
//   color?: string;
// }

// interface AnnotationConfig {
//   position: [number, number];
//   text: string;
//   color?: string;
//   size?: number;
// }

// interface PolygonConfig {
//   vertices: string[]; // labels
//   fill?: boolean;
//   fillColor?: string;
//   fillOpacity?: number;
//   strokeColor?: string;
// }

// interface PlotConfig {
//   // 2D
//   sliders?: SliderConfig[];
//   functions?: FunctionConfig[];
//   implicitCurves?: ImplicitCurveConfig[];
//   // Geometry
//   points?: PointConfig[];
//   segments?: SegmentConfig[];
//   circles?: CircleConfig[];
//   angles?: AngleConfig[];
//   annotations?: AnnotationConfig[];
//   polygons?: PolygonConfig[];
// }

// export default function PlotBoard({ config }: { config: PlotConfig }) {
//   const boxRef = useRef<HTMLDivElement | null>(null);
//   const boardRef = useRef<JXG.Board | null>(null);
//   const boxIdRef = useRef(`jxg-${Math.random().toString(36).slice(2)}`);

//   function sanitizeExpression(expr: string): string {
//     // caret -> JS exponent
//     expr = expr.replace(/\^/g, '**');
//     // simple Math. wrapping for common funcs/constants
//     const funcs = [
//       'sin','cos','tan','asin','acos','atan',
//       'log','log10','exp','sqrt','abs','pow','min','max','floor','ceil','round'
//     ];
//     expr = expr.replace(/\bpi\b/gi, 'Math.PI').replace(/\be\b/g, 'Math.E');
//     for (const fn of funcs) {
//       const re = new RegExp(`\\b${fn}\\b`, 'g');
//       expr = expr.replace(re, `Math.${fn}`);
//     }
//     return expr;
//   }

//   useEffect(() => {
//     if (!boxRef.current) return;

//     // free prior board
//     if (boardRef.current) {
//       try { JXG.JSXGraph.freeBoard(boardRef.current); } catch {}
//       boardRef.current = null;
//     }

//     const brd = JXG.JSXGraph.initBoard(boxIdRef.current, {
//       boundingbox: [-10, 10, 10, -10],
//       axis: true,
//       showNavigation: false,
//       showCopyright: false,
//     });
//     boardRef.current = brd;

//     // White tick labels
//     const tickStyle = { strokeColor: '#ffffff', label: { strokeColor: '#ffffff' } };
//     (brd.defaultAxes.x as any).defaultTicks.setAttribute(tickStyle);
//     (brd.defaultAxes.y as any).defaultTicks.setAttribute(tickStyle);
//     brd.defaultAxes.x.setAttribute({ strokeColor: '#cbd5e1' });
//     brd.defaultAxes.y.setAttribute({ strokeColor: '#cbd5e1' });

//     const sliders: Record<string, JXG.Slider> = {};

//     // Sliders
//     if (config?.sliders?.length) {
//       config.sliders.forEach((s) => {
//         sliders[s.label] = brd.create(
//           'slider',
//           s.position || [[-5, 5], [-3, 5], [s.min, s.initial, s.max]],
//           { name: s.label }
//         );
//       });
//     }

//     // Functions y = f(x)
//     if (config?.functions?.length) {
//       config.functions.forEach((f) => {
//         const safe = sanitizeExpression(f.expression);
//         brd.create(
//           'functiongraph',
//           [
//             (x: number) => {
//               const argNames = ['x', ...Object.keys(sliders)];
//               const argValues = [x, ...Object.values(sliders).map((sl) => sl.Value())];
//               const fn = new Function(...argNames, `return ${safe};`) as (...args: number[]) => number;
//               return fn(...argValues);
//             },
//             f.range[0],
//             f.range[1],
//           ],
//           { strokeColor: f.color || 'deepskyblue', strokeWidth: 2 }
//         );
//       });
//     }

//     // Implicit curves f(x,y)=0, or a=b -> a-(b)=0
//     if (config?.implicitCurves?.length) {
//       config.implicitCurves.forEach((curve) => {
//         let expr = curve.expression.replace(/\s+/g, '').replace(/\^/g, '**');
//         if (expr.includes('=')) {
//           const [left, right] = expr.split('=');
//           expr = `${left}-(${right})`;
//         } else {
//           expr = `${expr}- (0)`;
//         }
//         const f = (x: number, y: number): number => {
//           try {
//             const ev = expr.replace(/x/g, `(${x})`).replace(/y/g, `(${y})`);
//             // eslint-disable-next-line no-eval
//             return eval(ev);
//           } catch {
//             return NaN;
//           }
//         };

//         const pts: [number, number][] = [];
//         const [xMin, xMax] = curve.range[0];
//         const [yMin, yMax] = curve.range[1];
//         const step = 0.07;

//         for (let x = xMin; x <= xMax; x += step) {
//           for (let y = yMin; y <= yMax; y += step) {
//             if (Math.abs(f(x, y)) < 0.08) pts.push([x, y]);
//           }
//         }

//         if (pts.length) {
//           brd.create('curve', [pts.map(p => p[0]), pts.map(p => p[1])], {
//             strokeColor: curve.color || 'tomato',
//             strokeWidth: 2,
//           });
//         } else {
//           console.warn('No points for implicit curve:', curve.expression);
//         }
//       });
//     }

//     // Geometry primitives
//     const pointsMap: Record<string, JXG.Point> = {};

//     if (config?.points?.length) {
//       config.points.forEach((p) => {
//         const pt = brd.create('point', p.coords, {
//           name: p.label,
//           size: 3,
//           strokeColor: p.color || '#ffffff',
//           fillColor: p.color || '#ffffff',
//         });
//         pointsMap[p.label] = pt;
//       });
//     }

//     if (config?.segments?.length) {
//       config.segments.forEach((s) => {
//         const A = pointsMap[s.from];
//         const B = pointsMap[s.to];
//         if (A && B) {
//           brd.create('segment', [A, B], { strokeColor: s.color || '#60a5fa' });
//         }
//       });
//     }

//     if (config?.circles?.length) {
//       config.circles.forEach((c) => {
//         const C = pointsMap[c.center];
//         if (C) brd.create('circle', [C, c.radius], { strokeColor: c.color || '#34d399' });
//       });
//     }

//     if (config?.angles?.length) {
//       config.angles.forEach((a) => {
//         const [p1, p2, p3] = a.points.map((lbl) => pointsMap[lbl]);
//         if (p1 && p2 && p3) {
//           const ang = brd.create('angle', [p1, p2, p3], { strokeColor: a.color || '#fbbf24' });
//           if (a.label) {
//             // place label near vertex
//             const v = p2.coords.usr;
//             brd.create('text', [v[0] + 0.2, v[1] + 0.2, a.label], {
//               color: a.color || '#ffffff',
//               fontSize: 14,
//             });
//           }
//         }
//       });
//     }

//     if (config?.polygons?.length) {
//       config.polygons.forEach((poly) => {
//         const verts = (poly.vertices || []).map((v) => pointsMap[v]).filter(Boolean);
//         if (verts.length >= 3) {
//           brd.create('polygon', verts, {
//             borders: { strokeColor: poly.strokeColor || '#ffffff' },
//             fillColor: poly.fillColor || 'lightblue',
//             fillOpacity: poly.fill === false ? 0 : (poly.fillOpacity ?? 0.3),
//           });
//         }
//       });
//     }

//     if (config?.annotations?.length) {
//       config.annotations.forEach((an) => {
//         brd.create('text', [an.position[0], an.position[1], an.text], {
//           color: an.color || '#ffffff',
//           fontSize: an.size || 14,
//           anchorX: 'left',
//           anchorY: 'top',
//         });
//       });
//     }

//     // Resize with parent if needed
//     const el = document.getElementById(boxIdRef.current)!;
//     const ro = new ResizeObserver(() => {
//       try { brd.resizeContainer(el.clientWidth, el.clientHeight); } catch {}
//     });
//     ro.observe(el);

//     return () => {
//       ro.disconnect();
//       if (boardRef.current) {
//         try { JXG.JSXGraph.freeBoard(boardRef.current); } catch {}
//         boardRef.current = null;
//       }
//     };
//   }, [config]);

//   // Fill container; use CSS .ai-plot to control size/aspect
//   return <div id={boxIdRef.current} ref={boxRef} style={{ width: '100%', height: '320px' }} />;
// }