// frontend/src/components/Math3D.tsx
import { useEffect, useState } from "react";
import PlotComponent from "./Plot"; // Make sure this renders Plotly correctly
import * as math from "mathjs";

export default function Math3D({ config }: { config: any }) {
  const [plotData, setPlotData] = useState<any>(null);

  useEffect(() => {
    const data: any[] = [];

    // ======== Handle surfaces ========
    if (config?.surfaces?.length > 0) {
      config.surfaces.forEach((surface: any) => {
        const { expression, xrange, yrange, steps, colorscale, opacity = 1, wireframe = false } = surface;
        const x_vals = [];
        const y_vals = [];
        const z_vals = [];

        let expr;
        try {
          expr = math.compile(expression);
        } catch (err) {
          console.error("Invalid surface expression:", err);
          return;
        }

        const [xStart, xEnd] = xrange;
        const [yStart, yEnd] = yrange;

        const xStep = (xEnd - xStart) / steps;
        const yStep = (yEnd - yStart) / steps;

        for (let i = 0; i <= steps; i++) {
          const rowX: number[] = [];
          const rowY: number[] = [];
          const rowZ: number[] = [];

          for (let j = 0; j <= steps; j++) {
            const x = xStart + j * xStep;
            const y = yStart + i * yStep;

            try {
              const z = expr.evaluate({ x, y });
              rowX.push(x);
              rowY.push(y);
              rowZ.push(z);
            } catch {
              rowX.push(x);
              rowY.push(y);
              rowZ.push(NaN);
            }
          }

          x_vals.push(rowX);
          y_vals.push(rowY);
          z_vals.push(rowZ);
        }

        data.push({
          type: "surface",
          x: x_vals,
          y: y_vals,
          z: z_vals,
          colorscale: colorscale || "Viridis",
          opacity: opacity,
          showscale: false,
          contours: wireframe
            ? {
                z: {
                  show: true,
                  usecolormap: true,
                  highlightcolor: "#42f462",
                  project: { z: true },
                },
              }
            : undefined,
        });
      });
    }

    // ======== Handle parametric curves ========
    if (config?.curves?.length > 0) {
      config.curves.forEach((curve: any) => {
        const { parametric, trange, color, linewidth = 3 } = curve;
        const x_vals: number[] = [];
        const y_vals: number[] = [];
        const z_vals: number[] = [];

        const steps = trange[2];
        const tStart = trange[0];
        const tEnd = trange[1];

        let xExpr, yExpr, zExpr;
        try {
          xExpr = math.compile(parametric.x);
          yExpr = math.compile(parametric.y);
          zExpr = math.compile(parametric.z);
        } catch (err) {
          console.error("Invalid curve expressions:", err);
          return;
        }

        for (let i = 0; i <= steps; i++) {
          const t = tStart + (i / steps) * (tEnd - tStart);
          try {
            const x = xExpr.evaluate({ t });
            const y = yExpr.evaluate({ t });
            const z = zExpr.evaluate({ t });
            x_vals.push(x);
            y_vals.push(y);
            z_vals.push(z);
          } catch {
            // skip invalid point
          }
        }

        data.push({
          type: "scatter3d",
          mode: "lines",
          x: x_vals,
          y: y_vals,
          z: z_vals,
          line: {
            color: color || "blue",
            width: linewidth,
          },
        });
      });
    }

    // Set plot data if any valid objects exist
    if (data.length > 0) {
      setPlotData({
        data,
        layout: {
          title: "3D Plot",
          scene: {
            xaxis: { title: "X" },
            yaxis: { title: "Y" },
            zaxis: { title: "Z" },
          },
          margin: { l: 0, r: 0, b: 0, t: 30 },
          autosize: true,
        },
        config: {
          responsive: true,
        },
      });
    }
  }, [config]);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      {plotData ? <PlotComponent spec={plotData} /> : <div style={{ color: "white", textAlign: "center" }}>No 3D data to plot</div>}
    </div>
  );
}


// import { useEffect, useState } from "react";
// import PlotComponent from "./Plot"; // Import the Plot component to render 3D plot

// // 3D plotting component
// export default function Math3D({ config }: { config: any }) {
//   const [plotData, setPlotData] = useState<any>(null);

//   useEffect(() => {
//     if (config && config.curves && config.curves.length > 0) {
//       const curvesData = config.curves.map((curve: any) => {
//         const { parametric, trange, color } = curve;
//         const x_values: number[] = [];
//         const y_values: number[] = [];
//         const z_values: number[] = [];

//         const steps = trange[2]; // Number of steps for rendering

//         // Generate parametric values for u and v
//         for (let i = 0; i <= steps; i++) {
//           const u = (i / steps) * Math.PI; // u ranges from 0 to pi
//           for (let j = 0; j <= steps; j++) {
//             const v = (j / steps) * 2 * Math.PI; // v ranges from 0 to 2pi

//             // Parametric equations for the sphere
//             const x_val = 5 * Math.sin(u) * Math.cos(v);
//             const y_val = 5 * Math.sin(u) * Math.sin(v);
//             const z_val = 5 * Math.cos(u);

//             // Store the calculated values
//             x_values.push(x_val);
//             y_values.push(y_val);
//             z_values.push(z_val);
//           }
//         }

//         return {
//           type: "scatter3d",
//           mode: "markers",
//           x: x_values,
//           y: y_values,
//           z: z_values,
//           marker: { color: color || "blue", size: 3 },
//         };
//       });

//       setPlotData({
//         data: curvesData,
//         layout: {
//           scene: {
//             xaxis: { title: "X" },
//             yaxis: { title: "Y" },
//             zaxis: { title: "Z" },
//           },
//           title: "3D Sphere Plot",
//         },
//       });
//     }
//   }, [config]); // Re-run the effect when `config` changes

//   // Render the Plot component when data is ready
//   return <div style={{ width: "100%", height: "600px" }}>{plotData && <PlotComponent spec={plotData} />}</div>;
// }






// import Plot from "react-plotly.js";
// import * as math from "mathjs";

// export default function Math3D({ config }: { config: any }) {
//   if (!config) return null;
//   const data: any[] = [];
//   let error: string | null = null;

//   (config.surfaces || []).forEach((s: any) => {
//     // Check if the expression is explicit in z (should only use x and y)
//     if (
//       typeof s.expression === "string" &&
//       (s.expression.includes("z") || s.expression.includes("="))
//     ) {
//       error = "Sorry, this type of 3D surface (implicit equation or involving z) can't be plotted directly. Please ask for an explicit surface like z = f(x, y).";
//       return;
//     }
//     const xrange = s.xrange || [-5, 5];
//     const yrange = s.yrange || [-5, 5];
//     const steps = s.steps || 30;
//     const x = Array.from(
//       { length: steps },
//       (_, i) => xrange[0] + (i * (xrange[1] - xrange[0])) / (steps - 1)
//     );
//     const y = Array.from(
//       { length: steps },
//       (_, i) => yrange[0] + (i * (yrange[1] - yrange[0])) / (steps - 1)
//     );
//     try {
//       const expr = math.compile(s.expression);
//       const z = y.map((yv) =>
//         x.map((xv) => expr.evaluate({ x: xv, y: yv }))
//       );
//       data.push({
//         z,
//         x,
//         y,
//         type: "surface",
//         colorscale: s.colorscale || "Viridis",
//       });
//     } catch (e) {
//       error = "Could not evaluate the surface expression. Please check the formula.";
//     }
//   });

//   (config.curves || []).forEach((c: any) => {
//     // ...existing code for curves...
//   });

//   if (error) {
//     return (
//       <div className="text-red-500 bg-black p-4 rounded-lg text-center">
//         {error}
//       </div>
//     );
//   }

//   if (data.length === 0) return null;

//   return (
//     <Plot
//       data={data}
//       layout={config.layout || { title: "3D Visualization" }}
//       style={{ width: "100%", height: "600px" }}
//     />
//   );
// }