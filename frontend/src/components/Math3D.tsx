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
