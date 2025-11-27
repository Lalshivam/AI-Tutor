// A geometry board component using JSXGraph

// frontend/src/components/GeometryBoard.tsx
// import { useEffect, useRef } from "react";
// import JXG from "jsxgraph";
// import "../../node_modules/jsxgraph/distrib/jsxgraph.css";

// export default function GeometryBoard({ config }: { config: any }) {
//   const boxRef = useRef<HTMLDivElement>(null);
//   const boardRef = useRef<any>(null);

//   useEffect(() => {
//     if (!boxRef.current) return;

//     // Destroy previous board if exists
//     if (boardRef.current) JXG.JSXGraph.freeBoard(boardRef.current);

//     const brd = JXG.JSXGraph.initBoard(boxRef.current, {
//       boundingbox: [-5, 5, 5, -5],
//       axis: true,
 
//     });
//     boardRef.current = brd;

//     const pointsMap: Record<string, any> = {};

//     //  Create points and store references
//     if (config.points) {
//       config.points.forEach((point: any) => {
//         const p = brd.create("point", point.coords, { name: point.label });
//         pointsMap[point.label] = p;
//       });
//     }

//     //  Create segments using point references
//     if (config.segments) {
//       config.segments.forEach((segment: any) => {
//         const from = pointsMap[segment.from];
//         const to = pointsMap[segment.to];

//         if (from && to) {
//           brd.create("segment", [from, to], {
//             strokeColor: segment.color || "black",
//             dash: segment.style === "dashed" ? 2 : 0,
//           });
//         } else {
//           console.warn(`Missing point(s): ${segment.from}, ${segment.to}`);
//         }
//       });
//     }

//     //  Create circles
//     if (config.circles) {
//       config.circles.forEach((circle: any) => {
//         const center = pointsMap[circle.center];
//         if (center) {
//           brd.create("circle", [center, circle.radius], {
//             strokeColor: circle.color || "black",
//           });
//         } else {
//           console.warn(`Missing center point: ${circle.center}`);
//         }
//       });
//     }

//     //  Create angles
//     if (config.angles) {
//       config.angles.forEach((a: any) => {
//         // Preferred: angle using three labeled points [A, B, C] for ∠ABC
//         if (Array.isArray(a.points)) {
//           const [p1, p2, p3] = a.points;
//           const A = pointsMap[p1];
//           const B = pointsMap[p2]; // vertex
//           const C = pointsMap[p3];
//           if (A && B && C) {
//             brd.create("angle", [A, B, C], {
//               radius: a.radius ?? 1,
//               strokeColor: a.color || "#00cc66",
//               fillColor: a.fillColor || "#00cc66",
//               fillOpacity: a.fillOpacity ?? 0.3,
//               name: a.label || "",
//             });
//           } else {
//             console.warn("Missing points for angle:", a.points);
//           }
//           return;
//         }

//         // Optional fallback: degree-based angle at a vertex (or origin) like your snippet
//         if (typeof a.degree === "number") {
//           const center =
//             (a.vertex && pointsMap[a.vertex]) || brd.create("point", [0, 0], { visible: false });
//           const r = a.radius || 1;
//           const start = brd.create("point", [center.X() + r, center.Y()], { visible: false });
//           const angleRad = (a.degree * Math.PI) / 180;
//           const end = brd.create(
//             "point",
//             [center.X() + r * Math.cos(angleRad), center.Y() + r * Math.sin(angleRad)],
//             { visible: false }
//           );
//           brd.create("angle", [start, center, end], {
//             radius: r,
//             strokeColor: a.color || "#00cc66",
//             fillColor: a.fillColor || "#00cc66",
//             fillOpacity: a.fillOpacity ?? 0.3,
//             name: a.label || "",
//           });
//           return;
//         }

//         console.warn("Angle config not recognized:", a);
//       });
//     }



//   }, [config]);




//   return <div ref={boxRef} style={{ width: "100%", height: "100%" }} />;
// }

