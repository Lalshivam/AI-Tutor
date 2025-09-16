import { useEffect } from "react";

export default function GeoGebra() {
  useEffect(() => {
    const app = new window.GGBApplet(
      {
        appName: "graphing",   // Other options: geometry, 3d, scientific
        width: 600,
        height: 400,
        showToolBar: false,
        showAlgebraInput: true,
        showMenuBar: false,
      },
      true // use existing HTML element
    );
    app.inject("ggb-element"); // inject into this div
  }, []);

  return <div id="ggb-element"></div>;
}



