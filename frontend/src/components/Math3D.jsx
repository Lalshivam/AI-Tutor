import Plot from "react-plotly.js";
import * as math from "mathjs";

export default function Math3D({ config }) {
  const data = [];

  if(!config) return;

  // --- Surfaces ---
  (config.surfaces || []).forEach((s) => {
    const x = Array.from(
      { length: s.steps },
      (_, i) => s.xrange[0] + (i * (s.xrange[1] - s.xrange[0])) / (s.steps - 1)
    );
    const y = Array.from(
      { length: s.steps },
      (_, i) => s.yrange[0] + (i * (s.yrange[1] - s.yrange[0])) / (s.steps - 1)
    );

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
  });

  // --- Parametric Curves ---
  (config.curves || []).forEach((c) => {
    const [tmin, tmax, steps] = c.trange;
    const tvals = Array.from(
      { length: steps },
      (_, i) => tmin + (i * (tmax - tmin)) / (steps - 1)
    );

    const exprX = math.compile(c.parametric.x);
    const exprY = math.compile(c.parametric.y);
    const exprZ = math.compile(c.parametric.z);

    const x = tvals.map((t) => exprX.evaluate({ t }));
    const y = tvals.map((t) => exprY.evaluate({ t }));
    const z = tvals.map((t) => exprZ.evaluate({ t }));

    data.push({
      x,
      y,
      z,
      mode: c.mode || "lines",
      type: "scatter3d",
      line: { color: c.color || "blue" },
    });
  });

  return (
    <Plot
      data={data}
      layout={config.layout || { title: "3D Visualization" }}
      style={{ width: "100%", height: "600px" }}
    />
  );
}
