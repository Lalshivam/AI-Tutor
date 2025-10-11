// frontend/src/components/Plot.tsx
// A simple wrapper around react-plotly.js to render Plotly charts
import Plot from 'react-plotly.js';

export default function PlotComponent({ spec }: { spec: any }) {
  return <Plot data={spec.data} layout={spec.layout} />; // Render the plot with the given data and layout
}
