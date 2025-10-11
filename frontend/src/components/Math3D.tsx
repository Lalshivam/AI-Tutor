// frontend/src/components/Math3D.tsx
import { useEffect, useState } from "react";
import PlotComponent from "./Plot"; // Import the Plot component to render 3D plot

// 3D plotting component
export default function Math3D({ config }: { config: any }) {
  const [plotData, setPlotData] = useState<any>(null);

  useEffect(() => {
    if (config && config.curves && config.curves.length > 0) {
      const curvesData = config.curves.map((curve: any) => {
        const { parametric, trange, color } = curve;
        const x_values: number[] = [];
        const y_values: number[] = [];
        const z_values: number[] = [];

        const steps = trange[2]; // Number of steps for rendering

        // Generate parametric values for u and v
        for (let i = 0; i <= steps; i++) {
          const u = (i / steps) * Math.PI; // u ranges from 0 to pi
          for (let j = 0; j <= steps; j++) {
            const v = (j / steps) * 2 * Math.PI; // v ranges from 0 to 2pi

            // Parametric equations for the sphere
            const x_val = 5 * Math.sin(u) * Math.cos(v);
            const y_val = 5 * Math.sin(u) * Math.sin(v);
            const z_val = 5 * Math.cos(u);

            // Store the calculated values
            x_values.push(x_val);
            y_values.push(y_val);
            z_values.push(z_val);
          }
        }

        return {
          type: "scatter3d",
          mode: "markers",
          x: x_values,
          y: y_values,
          z: z_values,
          marker: { color: color || "blue", size: 3 },
        };
      });

      setPlotData({
        data: curvesData,
        layout: {
          scene: {
            xaxis: { title: "X" },
            yaxis: { title: "Y" },
            zaxis: { title: "Z" },
          },
          title: "3D Sphere Plot",
        },
      });
    }
  }, [config]); // Re-run the effect when `config` changes

  // Render the Plot component when data is ready
  return <div style={{ width: "100%", height: "600px" }}>{plotData && <PlotComponent spec={plotData} />}</div>;
}






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