import React, { useMemo } from "react";
import Plot from "react-plotly.js";
import { create, all } from "mathjs";

const math = create(all);

const preprocessExpression = (expr) => expr.replace(/\*\*/g, "^");

export default function Math3D({ config }) {
  if (!config) return null;

  const data = useMemo(() => {
    const out = [];

    // --- Surfaces ---
    (config.surfaces || []).forEach((s, idx) => {
      const steps = Math.max(2, Math.min(120, s.steps ?? 30)); // clamp steps
      const xrange = s.xrange && s.xrange.length === 2 ? s.xrange : [-5, 5];
      const yrange = s.yrange && s.yrange.length === 2 ? s.yrange : [-5, 5];

      const x = Array.from({ length: steps }, (_, i) =>
        xrange[0] + (i * (xrange[1] - xrange[0])) / (steps - 1)
      );
      const y = Array.from({ length: steps }, (_, i) =>
        yrange[0] + (i * (yrange[1] - yrange[0])) / (steps - 1)
      );

      let compiled;
      try {
        const expr = preprocessExpression(String(s.expression).trim());
        compiled = math.compile(expr);
      } catch (err) {
        console.error(`Surface compile error (index ${idx}):`, s.expression, err.message);
        return;
      }

      const z = y.map((yv) =>
        x.map((xv) => {
          try {
            const v = compiled.evaluate({ x: xv, y: yv });
            return typeof v === "number" && Number.isFinite(v) ? v : NaN;
          } catch (err) {
            return NaN;
          }
        })
      );

      out.push({
        z,
        x,
        y,
        type: "surface",
        colorscale: s.colorscale || "Viridis",
        showscale: s.showScale ?? false,
      });
    });

    // --- Parametric Curves ---
    (config.curves || []).forEach((c, idx) => {
      const trange = Array.isArray(c.trange) && c.trange.length >= 3 ? c.trange : [0, 1, 200];
      const [tmin, tmax, tsteps] = trange;
      const steps = Math.max(2, Math.min(2000, tsteps || 200));
      const tvals = Array.from({ length: steps }, (_, i) => tmin + (i * (tmax - tmin)) / (steps - 1));

      let exprX, exprY, exprZ;
      try {
        exprX = math.compile(preprocessExpression(String(c.parametric.x).trim()));
        exprY = math.compile(preprocessExpression(String(c.parametric.y).trim()));
        exprZ = math.compile(preprocessExpression(String(c.parametric.z).trim()));
      } catch (err) {
        console.error(`Curve compile error (index ${idx}):`, c.parametric, err.message);
        return;
      }

      const x = tvals.map((t) => { try { const v = exprX.evaluate({ t }); return Number.isFinite(v) ? v : NaN; } catch { return NaN; } });
      const y = tvals.map((t) => { try { const v = exprY.evaluate({ t }); return Number.isFinite(v) ? v : NaN; } catch { return NaN; } });
      const z = tvals.map((t) => { try { const v = exprZ.evaluate({ t }); return Number.isFinite(v) ? v : NaN; } catch { return NaN; } });

      out.push({
        x,
        y,
        z,
        mode: c.mode || "lines",
        type: "scatter3d",
        line: { color: c.color || "blue" },
      });
    });

    // --- Mesh3D ---
    (config.meshes || []).forEach((m, idx) => {
      if (!m.x || !m.y || !m.z || !m.i || !m.j || !m.k) {
        console.warn(`Mesh3D missing required fields (index ${idx})`);
        return;
      } 
      out.push({
        type: "mesh3d",
        x: m.x,
        y: m.y,
        z: m.z,
        i: m.i,
        j: m.j,
        k: m.k,
        color: m.color || "lightgray",
        opacity: m.opacity ?? 1,
      });
    });

        // --- Isosurfaces ---
    (config.isosurfaces || []).forEach((iso, idx) => {
      const steps = Math.max(5, Math.min(80, iso.steps ?? 30));
      const xrange = iso.xrange && iso.xrange.length === 2 ? iso.xrange : [-5, 5];
      const yrange = iso.yrange && iso.yrange.length === 2 ? iso.yrange : [-5, 5];
      const zrange = iso.zrange && iso.zrange.length === 2 ? iso.zrange : [-5, 5];
      const isovalue = iso.isovalue ?? 0;
      const colorscale = iso.colorscale || "Viridis";
      const opacity = iso.opacity ?? 0.7;

      // Create coordinate grids
      const xs = Array.from({ length: steps }, (_, i) => xrange[0] + (i * (xrange[1] - xrange[0])) / (steps - 1));
      const ys = Array.from({ length: steps }, (_, i) => yrange[0] + (i * (yrange[1] - yrange[0])) / (steps - 1));
      const zs = Array.from({ length: steps }, (_, i) => zrange[0] + (i * (zrange[1] - zrange[0])) / (steps - 1));

      let compiled;
      try {
        const expr = preprocessExpression(String(iso.expression).trim());
        compiled = math.compile(expr);
      } catch (err) {
        console.error(`Isosurface compile error (index ${idx}):`, iso.expression, err.message);
        return;
      }

      // Evaluate f(x, y, z)
      const X = [], Y = [], Z = [], values = [];
      xs.forEach((x) => {
        ys.forEach((y) => {
          zs.forEach((z) => {
            X.push(x);
            Y.push(y);
            Z.push(z);
            try {
              const v = compiled.evaluate({ x, y, z });
              values.push(typeof v === "number" && Number.isFinite(v) ? v : NaN);
            } catch {
              values.push(NaN);
            }
          });
        });
      });

      out.push({
        type: "isosurface",
        x: X,
        y: Y,
        z: Z,
        value: values,
        isomin: isovalue,
        isomax: isovalue,
        surface: { show: true, count: 1 },
        colorscale,
        opacity,
      });
    });

    const defaultLayout = {
    autosize: true,
    margin: { l: 0, r: 0, b: 0, t: 30, pad: 0 },
    scene: {
      aspectmode: "manual",
      aspectratio: { x: 1, y: 1, z: 1 },
      xaxis: { title: "x", range: [-6, 6], autorange: false },
      yaxis: { title: "y", range: [-6, 6], autorange: false },
      zaxis: { title: "z", range: [-6, 6], autorange: false },
      },
    };

  // merge logic unchanged
  const mergedLayout = {
    ...defaultLayout,
    ...(config.layout || {}),
    scene: {
      ...defaultLayout.scene,
      ...(config.layout?.scene || {}),
      xaxis: { ...defaultLayout.scene.xaxis, ...(config.layout?.scene?.xaxis || {}) },
      yaxis: { ...defaultLayout.scene.yaxis, ...(config.layout?.scene?.yaxis || {}) },
      zaxis: { ...defaultLayout.scene.zaxis, ...(config.layout?.scene?.zaxis || {}) },
    },
  };

    return [out, mergedLayout];
  }, [config]);

  return (
    <Plot
    data={data[0]}
    layout={data[1]}
    style={{
      width: "300px",
      height: "300px",
      backgroundColor: "#242424",
      border: "2px solid #55e7ef",
      borderRadius: "16px",
      overflow: "hidden"
    }}
    config={{ responsive: true }}
  />
  );
} 