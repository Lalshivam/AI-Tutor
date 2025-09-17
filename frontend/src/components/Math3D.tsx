import Plot from "react-plotly.js";
import * as math from "mathjs";

export default function Math3D({ config }: { config: any }) {
  if (!config) return null;
  const data: any[] = [];
  let error: string | null = null;

  (config.surfaces || []).forEach((s: any) => {
    // Check if the expression is explicit in z (should only use x and y)
    if (
      typeof s.expression === "string" &&
      (s.expression.includes("z") || s.expression.includes("="))
    ) {
      error = "Sorry, this type of 3D surface (implicit equation or involving z) can't be plotted directly. Please ask for an explicit surface like z = f(x, y).";
      return;
    }
    const xrange = s.xrange || [-5, 5];
    const yrange = s.yrange || [-5, 5];
    const steps = s.steps || 30;
    const x = Array.from(
      { length: steps },
      (_, i) => xrange[0] + (i * (xrange[1] - xrange[0])) / (steps - 1)
    );
    const y = Array.from(
      { length: steps },
      (_, i) => yrange[0] + (i * (yrange[1] - yrange[0])) / (steps - 1)
    );
    try {
      const expr = math.compile(s.expression);
      const z = y.map((yv) =>
        x.map((xv) => expr.evaluate({ x: xv, y: yv }))
      );
      data.push({
        z,
        x,
        y,
        type: "surface",
        colorscale: s.colorscale || "Viridis",
      });
    } catch (e) {
      error = "Could not evaluate the surface expression. Please check the formula.";
    }
  });

  (config.curves || []).forEach((c: any) => {
    // ...existing code for curves...
  });

  if (error) {
    return (
      <div className="text-red-500 bg-black p-4 rounded-lg text-center">
        {error}
      </div>
    );
  }

  if (data.length === 0) return null;

  return (
    <Plot
      data={data}
      layout={config.layout || { title: "3D Visualization" }}
      style={{ width: "100%", height: "600px" }}
    />
  );
}