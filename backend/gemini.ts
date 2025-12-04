import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

export async function explainWithGemini(message: string, mathResult: any, plotType: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Create a different prompt based on plotType (3D vs 2D)
  let prompt = `
  You are a math tutor AI. For every question, respond ONLY with a JSON object with exactly two keys:

  - "explanation": a markdown explanation in most elaborated and professional steps with formulas and derivation (if needed), using LaTeX ($...$) for math. Include any steps from the math engine below.
  - "config": a structured object describing a diagram or plot for the question.

  The "config" object MUST match one of these schemas:

  `;

  // Adjust prompt to add logic based on plotType
  if (plotType === '3D') {
    // Handle 3D plot type
    prompt += `

**For 3D plots, use ONLY these two formats:**

**Format 1: Explicit surfaces (z = f(x,y))**
{
  "surfaces": [
    {
      "expression": string,       // MUST be in terms of x and y ONLY (e.g., "sqrt(25 - x^2 - y^2)")
      "xrange": [number, number],
      "yrange": [number, number],
      "steps": number,
      "colorscale"?: string,
      "opacity"?: number,
      "wireframe"?: boolean
    }
  ]
}

**Format 2: Parametric curves (single parameter t)**
{
  "curves": [
    {
      "parametric": { "x": string, "y": string, "z": string },
      "trange": [number, number, number],  // [min, max, steps]
      "color"?: string,
      "linewidth"?: number
    }
  ]
}

**CRITICAL RULES:**
- If using "surfaces" with "expression", it MUST only contain x and y variables.
- NEVER use u or v variables in any 3D expression.
- For curves, use only single parameter t.
- Use numeric literals only (no Math.PI).
- Pre-calculate π as 3.1415926536.

**Example 1 (Explicit surface - sphere):**
{
  "surfaces": [
    {
      "expression": "sqrt(25 - x^2 - y^2)",
      "xrange": [-5, 5],
      "yrange": [-5, 5],
      "steps": 50,
      "colorscale": "Viridis"
    },
    {
      "expression": "-sqrt(25 - x^2 - y^2)",
      "xrange": [-5, 5],
      "yrange": [-5, 5],
      "steps": 50,
      "colorscale": "Viridis"
    }
  ]
}

**Example 2 (Parametric curve - helix):**
{
  "curves": [
    {
      "parametric": {
        "x": "cos(t)",
        "y": "sin(t)",
        "z": "t"
      },
      "trange": [0, 12.566371, 200],
      "color": "blue",
      "linewidth": 2
    }
  ]
}

**Example 3 (Cylinder using explicit surface):**
For a cylinder of radius 2 and height from -3 to 3:
{
  "surfaces": [
    {
      "expression": "sqrt(4 - x^2)",
      "xrange": [-2, 2],
      "yrange": [-3, 3],
      "steps": 50,
      "colorscale": "Rainbow"
    },
    {
      "expression": "-sqrt(4 - x^2)",
      "xrange": [-2, 2],
      "yrange": [-3, 3],
      "steps": 50,
      "colorscale": "Rainbow"
    }
  ]
}
  **Example 4 (Cube):**
  {
  "surfaces": [
    { "expression": "1", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 2 },
    { "expression": "-1", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 2 },
    { "expression": "y", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 2 },
    { "expression": "-y", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 2 },
    { "expression": "x", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 2 },
    { "expression": "-x", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 2 }
  ]
}

  **Example 5 (Cylinder using explicit surface):**
  **Example 6 (Cuboid):**
  {
  "surfaces": [
    { "expression": "1.5", "xrange": [-1, 1], "yrange": [-0.5, 0.5], "steps": 2 },
    { "expression": "-1.5", "xrange": [-1, 1], "yrange": [-0.5, 0.5], "steps": 2 },
    { "expression": "y * 0 + 1", "xrange": [-1, 1], "yrange": [-0.5, 0.5], "steps": 2 },
    { "expression": "y * 0 - 1", "xrange": [-1, 1], "yrange": [-0.5, 0.5], "steps": 2 },
    { "expression": "x * 0 + 0.5", "xrange": [-1, 1], "yrange": [-1.5, 1.5], "steps": 2 },
    { "expression": "x * 0 - 0.5", "xrange": [-1, 1], "yrange": [-1.5, 1.5], "steps": 2 }
  ]
}

  **Example 7 (Tetrahedron):**
  {
  "surfaces": [
    { "expression": "1 - x - y", "xrange": [0, 1], "yrange": [0, 1], "steps": 20 },
    { "expression": "-1 + x + y", "xrange": [0, 1], "yrange": [0, 1], "steps": 20 },
    { "expression": "x - y", "xrange": [0, 1], "yrange": [0, 1], "steps": 20 },
    { "expression": "y - x", "xrange": [0, 1], "yrange": [0, 1], "steps": 20 }
  ]
}

  **Example 8 (Octahedron):**
  {
  "surfaces": [
    { "expression": "1 - abs(x) - abs(y)", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 50 },
    { "expression": "-1 + abs(x) + abs(y)", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 50 }
  ]
}

  **Example 9 (Dodecahedron or Icosahedron):**
  {
  "surfaces": [
    { "expression": "0.8", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 2 },
    { "expression": "-0.8", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 2 }
  ]
}

  **Example 10 (Prism (triangular)):**
  {
  "surfaces": [
    { "expression": "1", "xrange": [0, 1], "yrange": [0, 1], "steps": 20 },
    { "expression": "-1", "xrange": [0, 1], "yrange": [0, 1], "steps": 20 }
  ]
}

  **Example 11 (Pyramid):**
  {
  "surfaces": [
    { "expression": "1 - abs(x) - abs(y)", "xrange": [-1, 1], "yrange": [-1, 1], "steps": 40 }
  ]
}

  **Example 12 (Frustum):**
  {
  "surfaces": [
    {
      "expression": "0.5 + 0.5 * (1 - abs(x) - abs(y))",
      "xrange": [-1, 1],
      "yrange": [-1, 1],
      "steps": 40
    }
  ]
}

  **Example 13 (Sphere):**
  {
  "surfaces": [
    {
      "expression": "sqrt(25 - x^2 - y^2)",
      "xrange": [-5, 5],
      "yrange": [-5, 5],
      "steps": 50
    },
    {
      "expression": "-sqrt(25 - x^2 - y^2)",
      "xrange": [-5, 5],
      "yrange": [-5, 5],
      "steps": 50
    }
  ]
}

  **Example 14 (Ellipsoid (x²/9 + y²/4 + z²/16 = 1)):**
  {
  "surfaces": [
    {
      "expression": "sqrt(16 * (1 - x^2/9 - y^2/4))",
      "xrange": [-3, 3],
      "yrange": [-2, 2],
      "steps": 50
    },
    {
      "expression": "-sqrt(16 * (1 - x^2/9 - y^2/4))",
      "xrange": [-3, 3],
      "yrange": [-2, 2],
      "steps": 50
    }
  ]
}

  **Example 15 (Cone):**
  {
  "surfaces": [
    {
      "expression": "sqrt(x^2 + y^2)",
      "xrange": [-3, 3],
      "yrange": [-3, 3],
      "steps": 50
    },
    {
      "expression": "-sqrt(x^2 + y^2)",
      "xrange": [-3, 3],
      "yrange": [-3, 3],
      "steps": 50
    }
  ]
}
  **Example 16 (Torus (parametric)
R = 3, r = 1
Use parametric curve ring (not full surface, since surfaces can’t use u/v).):**
{
  "curves": [
    {
      "parametric": {
        "x": "(3 + cos(t)) * cos(t)",
        "y": "(3 + cos(t)) * sin(t)",
        "z": "sin(t)"
      },
      "trange": [0, 6.2831853072, 500],
      "color": "purple"
    }
  ]
}

  **Example 17 (Paraboloid):**
  {
  "surfaces": [
    {
      "expression": "0.1 * (x^2 + y^2)",
      "xrange": [-10, 10],
      "yrange": [-10, 10],
      "steps": 40
    }
  ]
}

  **Example 18 (Hyperboloid (one-sheet)):**
  {
  "surfaces": [
    {
      "expression": "sqrt(1 + x^2 + y^2)",
      "xrange": [-3, 3],
      "yrange": [-3, 3],
      "steps": 40
    },
    {
      "expression": "-sqrt(1 + x^2 + y^2)",
      "xrange": [-3, 3],
      "yrange": [-3, 3],
      "steps": 40
    }
  ]
}

  **Example 19 (Plane):**
  {
  "surfaces": [
    {
      "expression": "0.5 * x + 0.2 * y",
      "xrange": [-5, 5],
      "yrange": [-5, 5],
      "steps": 10
    }
  ]
}

  **Example 20 (Saddle Surface (z = x² − y²)):**
  {
  "surfaces": [
    {
      "expression": "x^2 - y^2",
      "xrange": [-4, 4],
      "yrange": [-4, 4],
      "steps": 50
    }
  ]
}

  **Example 21 (Hyperbolic Paraboloid):**
  {
  "surfaces": [
    {
      "expression": "0.1 * (x^2 - y^2)",
      "xrange": [-10, 10],
      "yrange": [-10, 10],
      "steps": 40
    }
  ]
}

  **Example 22 (Elliptic Cone):**
  {
  "surfaces": [
    {
      "expression": "sqrt((x^2)/4 + (y^2)/9)",
      "xrange": [-6, 6],
      "yrange": [-6, 6],
      "steps": 50
    },
    {
      "expression": "-sqrt((x^2)/4 + (y^2)/9)",
      "xrange": [-6, 6],
      "yrange": [-6, 6],
      "steps": 50
    }
  ]
}

  **Example 23 (Hyperbolic Cylinder):**
  {
  "surfaces": [
    {
      "expression": "sqrt(1 + x^2)",
      "xrange": [-4, 4],
      "yrange": [-4, 4],
      "steps": 40
    },
    {
      "expression": "-sqrt(1 + x^2)",
      "xrange": [-4, 4],
      "yrange": [-4, 4],
      "steps": 40
    }
  ]
}

  **Example 24 (Sinusoidal Surface):**
  {
  "surfaces": [
    {
      "expression": "sin(0.5 * x) * cos(0.5 * y)",
      "xrange": [-10, 10],
      "yrange": [-10, 10],
      "steps": 80
    }
  ]
}

  **Example 25 (Möbius Strip (curve around centerline only)):**
  {
  "curves": [
    {
      "parametric": {
        "x": "cos(t)",
        "y": "sin(t)",
        "z": "0.2 * sin(2 * t)"
      },
      "trange": [0, 6.2831853072, 400]
    }
  ]
}

  **Example 26 (Klein Bottle (3D self-intersecting param curve)):**
  {
  "curves": [
    {
      "parametric": {
        "x": "(2 + cos(t)) * cos(2*t)",
        "y": "(2 + cos(t)) * sin(2*t)",
        "z": "sin(t)"
      },
      "trange": [0, 6.2831853072, 600]
    }
  ]
}

  **Example 27 (Catenoid):**
  {
  "surfaces": [
    {
      "expression": "acosh(sqrt(x^2 + y^2))",
      "xrange": [-3, 3],
      "yrange": [-3, 3],
      "steps": 60
    }
  ]
}

  **Example 28 (Helicoid

(Use parametric curve for central helix.)):**
{
  "curves": [
    {
      "parametric": {
        "x": "cos(t)",
        "y": "sin(t)",
        "z": "0.2 * t"
      },
      "trange": [0, 18.84955592, 300]
    }
  ]
}

  **Example 29 (Enneper Surface):**
  {
  "surfaces": [
    {
      "expression": "x^3 - 3*x*y^2",
      "xrange": [-2, 2],
      "yrange": [-2, 2],
      "steps": 60
    }
  ]
}

  **Example 30 (Superquadric Surface):**
  {
  "surfaces": [
    {
      "expression": "sqrt(4 - abs(x)^1.5 - abs(y)^1.5)",
      "xrange": [-2, 2],
      "yrange": [-2, 2],
      "steps": 60
    },
    {
      "expression": "-sqrt(4 - abs(x)^1.5 - abs(y)^1.5)",
      "xrange": [-2, 2],
      "yrange": [-2, 2],
      "steps": 60
    }
  ]
}

  **Example 31 (Parametric Torus):**
  {
  "curves": [
    {
      "parametric": {
        "x": "3 * cos(t)",
        "y": "3 * sin(t)",
        "z": "cos(t)"
      },
      "trange": [0, 6.2831853072, 400]
    }
  ]
}

  **Example 32 (Parametric Sphere / Ellipsoid (circle path)):**
  {
  "curves": [
    {
      "parametric": {
        "x": "3 * cos(t)",
        "y": "2 * sin(t)",
        "z": "1.5 * sin(t)"
      },
      "trange": [0, 6.2831853072, 300]
    }
  ]
}

  **Example 33 (Line):**
  {
  "curves": [
    {
      "parametric": {
        "x": "t",
        "y": "t",
        "z": "t"
      },
      "trange": [0, 5, 50]
    }
  ]
}

  **Example 34 (Polygonal Path):**
  {
  "curves": [
    { "parametric": { "x": "t", "y": "0", "z": "0" }, "trange": [0, 1, 10] },
    { "parametric": { "x": "1", "y": "t", "z": "0" }, "trange": [0, 1, 10] }
  ]
}

**Example 35 (Spiral (logarithmic)):**
{
  "curves": [
    {
      "parametric": {
        "x": "exp(0.1*t) * cos(t)",
        "y": "exp(0.1*t) * sin(t)",
        "z": "0.1 * t"
      },
      "trange": [0, 12.566371, 300]
    }
  ]
}

**Example 36 (Bezier Curve (3D)

Quadratic: B(t) = (1−t)² P0 + 2t(1−t)P1 + t² P2.):**
{
  "curves": [
    {
      "parametric": {
        "x": "(1-t)^2 * 0 + 2*t*(1-t) * 2 + t^2 * 4",
        "y": "(1-t)^2 * 0 + 2*t*(1-t) * 3 + t^2 * 0",
        "z": "(1-t)^2 * 0 + 2*t*(1-t) * 1 + t^2 * 2"
      },
      "trange": [0, 1, 200]
    }
  ]
}

**Example 37 (Spline

(Use a smooth polynomial curve.)):**
{
  "curves": [
    {
      "parametric": {
        "x": "t",
        "y": "t^3 - 2*t",
        "z": "0.5 * t^2"
      },
      "trange": [0, 3, 300]
    }
  ]
}

**Example 38 (NURBS Surface

(Approximate with a smooth explicit patch.)):**
{
  "surfaces": [
    {
      "expression": "0.2 * (x^3 + y^3)",
      "xrange": [-2, 2],
      "yrange": [-2, 2],
      "steps": 50
    }
  ]
}

**Example 39 (Mesh Surface

(Generic polygonal grid)):**
{
  "surfaces": [
    {
      "expression": "0.2*sin(x) + 0.1*cos(y)",
      "xrange": [-10, 10],
      "yrange": [-10, 10],
      "steps": 80
    }
  ]
}

**Example 40 (Implicit Surface (Metaball-style)

Convert F(x,y,z)=0 to explicit z=f(x,y):
z = sqrt(4 − x² − y²)):**

{
  "surfaces": [
    {
      "expression": "sqrt(4 - x^2 - y^2)",
      "xrange": [-2, 2],
      "yrange": [-2, 2],
      "steps": 60
    },
    {
      "expression": "-sqrt(4 - x^2 - y^2)",
      "xrange": [-2, 2],
      "yrange": [-2, 2],
      "steps": 60
    }
  ]
}

    `;

  } else if (plotType === '2D') {
    // Handle 2D plot type
    prompt += `
    
**For 2D function plots:**

{
  "functions": [
    {
      "expression": string,
      "range": [number, number],
      "color"?: string,
      "linewidth"?: number,        // thickness of curve line
      "style"?: "solid"|"dashed"|"dotted"   // line style
    }
  ],
  "implicitCurves"?: [             // Advanced: implicit equations like circles, ellipses, etc.
    {
      "expression": string,
      "range": [[number, number], [number, number]],  // x and y ranges
      "color"?: string
    }
  ],
  "points": [
    { "label": string, "coords": [number, number], "color"?: string, "size"?: number }
  ],
  "segments"?: [
    { "from": string, "to": string, "style"?: "solid"|"dashed", "color"?: string, "linewidth"?: number }
  ],
  "circles"?: [
    { "center": string, "radius": number, "color"?: string, "fill"?: boolean, "fillColor"?: string }
  ],
  "polygons"?: [                 // Advanced: polygons defined by point labels
    {
      "vertices": [string],      // list of point labels in order
      "color"?: string,
      "fill"?: boolean,
      "fillColor"?: string,
      "linewidth"?: number
    }
  ],
  "angles"?: [                   // Angle annotations between three points (A-B-C)
    {
      "points": [string, string, string],
      "label"?: string,
      "color"?: string
    }
  ],
  "annotations"?: [              // Additional textual annotations anywhere
    {
      "position": [number, number],
      "text": string,
      "color"?: string,
      "fontsize"?: number
    }
  ]
}

    For 2D, choose the most suitable visualization:
    - Use "functions" for y=f(x) graphs.
    - Use "implicitCurves" for circles/ellipses/equations in x and y.
    - Use geometry ("points","segments","circles","polygons","angles","annotations") for Euclidean constructions (e.g., triangles, angles).
    Example:
    {
      "functions": [{ "expression": "sin(x)", "range": [-6, 6], "color": "blue" }],
      "points": [{ "label": "A", "coords": [0,0] }, { "label": "B", "coords": [4,0] }],
      "segments": [{ "from": "A", "to": "B" }]
    }
    
    **Example 2 (Triangle):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [4, 0] },
    { "label": "C", "coords": [2, 3] }
  ],
  "polygons": [
    { "vertices": ["A", "B", "C"], "color": "black" }
  ]
}

    **Example 3 (Quadrilateral):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [5, 0] },
    { "label": "C", "coords": [4, 3] },
    { "label": "D", "coords": [1, 3] }
  ],
  "polygons": [
    { "vertices": ["A", "B", "C", "D"], "color": "black" }
  ]
}

    **Example 4 (Square):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [2, 0] },
    { "label": "C", "coords": [2, 2] },
    { "label": "D", "coords": [0, 2] }
  ],
  "polygons": [
    { "vertices": ["A", "B", "C", "D"], "color": "black" }
  ]
}

    **Example 5 (Rectangle):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [4, 0] },
    { "label": "C", "coords": [4, 2] },
    { "label": "D", "coords": [0, 2] }
  ],
  "polygons": [
    { "vertices": ["A", "B", "C", "D"], "color": "black" }
  ]
}

    **Example 6 (Parallelogram):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [4, 0] },
    { "label": "C", "coords": [5, 3] },
    { "label": "D", "coords": [1, 3] }
  ],
  "polygons": [
    { "vertices": ["A", "B", "C", "D"], "color": "black" }
  ]
}

    **Example 7 (Rhombus):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [2, 1] },
    { "label": "C", "coords": [4, 0] },
    { "label": "D", "coords": [2, -1] }
  ],
  "polygons": [
    { "vertices": ["A", "B", "C", "D"], "color": "black" }
  ]
}

    **Example 8 (Trapezoid):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [5, 0] },
    { "label": "C", "coords": [4, 3] },
    { "label": "D", "coords": [1, 3] }
  ],
  "polygons": [
    { "vertices": ["A", "B", "C", "D"], "color": "black" }
  ]
}

    **Example 9 (Kite):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [2, 3] },
    { "label": "C", "coords": [4, 0] },
    { "label": "D", "coords": [2, -2] }
  ],
  "polygons": [
    { "vertices": ["A", "B", "C", "D"], "color": "black" }
  ]
}

    **Example 10 (Pentagon (regular)

Vertices of regular 5-gon at radius 2.

Angle = 2πk/5):**
{
  "points": [
    { "label": "P0", "coords": [2*cos(0), 2*sin(0)] },
    { "label": "P1", "coords": [2*cos(1.25663706144), 2*sin(1.25663706144)] },
    { "label": "P2", "coords": [2*cos(2.51327412288), 2*sin(2.51327412288)] },
    { "label": "P3", "coords": [2*cos(3.76991118432), 2*sin(3.76991118432)] },
    { "label": "P4", "coords": [2*cos(5.02654824576), 2*sin(5.02654824576)] }
  ],
  "polygons": [
    { "vertices": ["P0", "P1", "P2", "P3", "P4"], "color": "black" }
  ]
}

    **Example 11 (Hexagon (regular)):**
    {
  "points": [
    { "label": "H0", "coords": [2*cos(0), 2*sin(0)] },
    { "label": "H1", "coords": [2*cos(1.0471975512), 2*sin(1.0471975512)] },
    { "label": "H2", "coords": [2*cos(2.0943951024), 2*sin(2.0943951024)] },
    { "label": "H3", "coords": [2*cos(3.1415926536), 2*sin(3.1415926536)] },
    { "label": "H4", "coords": [2*cos(4.1887902048), 2*sin(4.1887902048)] },
    { "label": "H5", "coords": [2*cos(5.235987756), 2*sin(5.235987756)] }
  ],
  "polygons": [
    { "vertices": ["H0", "H1", "H2", "H3", "H4", "H5"], "color": "black" }
  ]
}

    **Example 12 (Heptagon (regular) n=7):**
    {
  "points": [
    { "label": "S0", "coords": [2*cos(0), 2*sin(0)] },
    { "label": "S1", "coords": [2*cos(0.897597901), 2*sin(0.897597901)] },
    { "label": "S2", "coords": [2*cos(1.795195802), 2*sin(1.795195802)] },
    { "label": "S3", "coords": [2*cos(2.692793703), 2*sin(2.692793703)] },
    { "label": "S4", "coords": [2*cos(3.590391604), 2*sin(3.590391604)] },
    { "label": "S5", "coords": [2*cos(4.487989505), 2*sin(4.487989505)] },
    { "label": "S6", "coords": [2*cos(5.385587406), 2*sin(5.385587406)] }
  ],
  "polygons": [
    { "vertices": ["S0","S1","S2","S3","S4","S5","S6"], "color": "black" }
  ]
}

    **Example 13 (Octagon (regular)

n=8, angle step = π/4 = 0.7853981634):**
{
  "points": [
    { "label": "O0", "coords": [2*cos(0), 2*sin(0)] },
    { "label": "O1", "coords": [2*cos(0.7853981634), 2*sin(0.7853981634)] },
    { "label": "O2", "coords": [2*cos(1.5707963268), 2*sin(1.5707963268)] },
    { "label": "O3", "coords": [2*cos(2.3561944902), 2*sin(2.3561944902)] },
    { "label": "O4", "coords": [2*cos(3.1415926536), 2*sin(3.1415926536)] },
    { "label": "O5", "coords": [2*cos(3.926990817), 2*sin(3.926990817)] },
    { "label": "O6", "coords": [2*cos(4.7123889804), 2*sin(4.7123889804)] },
    { "label": "O7", "coords": [2*cos(5.4977871438), 2*sin(5.4977871438)] }
  ],
  "polygons": [
    { "vertices": ["O0","O1","O2","O3","O4","O5","O6","O7"], "color": "black" }
  ]
}

    **Example 14 (Nonagon (regular)

n=9, step ≈ 0.6981317008):**
{
  "points": [
    { "label": "N0", "coords": [2*cos(0), 2*sin(0)] },
    { "label": "N1", "coords": [2*cos(0.6981317008), 2*sin(0.6981317008)] },
    { "label": "N2", "coords": [2*cos(1.3962634016), 2*sin(1.3962634016)] },
    { "label": "N3", "coords": [2*cos(2.0943951024), 2*sin(2.0943951024)] },
    { "label": "N4", "coords": [2*cos(2.7925268032), 2*sin(2.7925268032)] },
    { "label": "N5", "coords": [2*cos(3.490658504), 2*sin(3.490658504)] },
    { "label": "N6", "coords": [2*cos(4.1887902048), 2*sin(4.1887902048)] },
    { "label": "N7", "coords": [2*cos(4.8869219056), 2*sin(4.8869219056)] },
    { "label": "N8", "coords": [2*cos(5.5850536064), 2*sin(5.5850536064)] }
  ],
  "polygons": [
    { "vertices": ["N0","N1","N2","N3","N4","N5","N6","N7","N8"], "color": "black" }
  ]
}

    **Example 15 (Decagon (regular)

n=10, step = π/5 = 0.62831853072):**
{
  "points": [
    { "label": "D0",  "coords": [2*cos(0), 2*sin(0)] },
    { "label": "D1",  "coords": [2*cos(0.62831853072), 2*sin(0.62831853072)] },
    { "label": "D2",  "coords": [2*cos(1.25663706144), 2*sin(1.25663706144)] },
    { "label": "D3",  "coords": [2*cos(1.88495559216), 2*sin(1.88495559216)] },
    { "label": "D4",  "coords": [2*cos(2.51327412288), 2*sin(2.51327412288)] },
    { "label": "D5",  "coords": [2*cos(3.1415926536), 2*sin(3.1415926536)] },
    { "label": "D6",  "coords": [2*cos(3.76991118432), 2*sin(3.76991118432)] },
    { "label": "D7",  "coords": [2*cos(4.39822971504), 2*sin(4.39822971504)] },
    { "label": "D8",  "coords": [2*cos(5.02654824576), 2*sin(5.02654824576)] },
    { "label": "D9",  "coords": [2*cos(5.65486677648), 2*sin(5.65486677648)] }
  ],
  "polygons": [
    { "vertices": ["D0","D1","D2","D3","D4","D5","D6","D7","D8","D9"], "color": "black" }
  ]
}

//BATCH 2 — CURVED SHAPES

    **Example 16 (Circle (implicit) x² + y² = 4):**
{
  "implicitCurves": [
    {
      "expression": "x^2 + y^2 - 4",
      "range": [[-3, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 17 (Ellipse (implicit) (x²/9) + (y²/4) = 1):**
    {
  "implicitCurves": [
    {
      "expression": "x^2/9 + y^2/4 - 1",
      "range": [[-4, 4], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 18 (Oval (Cassini-type oval) (x² + y² + 1)² − 4x² − 1 = 0):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2 + 1)^2 - 4*x^2 - 1",
      "range": [[-3, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 19 (Parabola y = x²):**
    {
  "functions": [
    {
      "expression": "x^2",
      "range": [-4, 4],
      "color": "black"
    }
  ]
}

    **Example 20 (Hyperbola  x² − y² = 4):**
    {
  "implicitCurves": [
    {
      "expression": "x^2 - y^2 - 4",
      "range": [[-5, 5], [-5, 5]],
      "color": "black"
    }
  ]
}

    **Example 21 (Cardioid (implicit) Using implicit form: (x² + y² − 2x)² − (x² + y²) = 0):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2 - 2*x)^2 - (x^2 + y^2)",
      "range": [[-3, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 22 (Limacon ,Implicit representation of limacon r = 1 + cosθ:[(x² + y²) − x]² − (x² + y²) = 0):**
    {
  "implicitCurves": [
    {
      "expression": "((x^2 + y^2) - x)^2 - (x^2 + y^2)",
      "range": [[-3, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 23 (Epicycloid
Implicit form is complex → use param-style x(t), y(t) as functions by plotting param vs param?
But NOT allowed.
So we use implicit form for 3-cusped epicycloid:
(x² + y² − 1)³ − (27/4)x²y² = 0):**

    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2 - 1)^3 - 6.75*x^2*y^2",
      "range": [[-3, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 24 (Hypocycloid (astroid-type) Classic astroid implicit: x^(2/3) + y^(2/3) = 1):**
    {
  "implicitCurves": [
    {
      "expression": "x^(2/3) + y^(2/3) - 1",
      "range": [[-2, 2], [-2, 2]],
      "color": "black"
    }
  ]
}

    **Example 25 (Astroid):**
    {
  "implicitCurves": [
    {
      "expression": "x^(2/3) + y^(2/3) - 1",
      "range": [[-2, 2], [-2, 2]],
      "color": "black"
    }
  ]
}

    **Example 26 (Nephroid,Implicit form:(x² + y² − 4x)² = 4(x² + y²)):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2 - 4*x)^2 - 4*(x^2 + y^2)",
      "range": [[-5, 5], [-5, 5]],
      "color": "black"
    }
  ]
}

    **Example 27 (Cissoid , Cissoid of Diocles: y²(2a − x) = x³ ,Take a=1:):**
    {
  "implicitCurves": [
    {
      "expression": "y^2*(2 - x) - x^3",
      "range": [[-1, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 28 (Lemniscate of Bernoulli, (x² + y²)² = 2(x² − y²)):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2)^2 - 2*(x^2 - y^2)",
      "range": [[-3, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 29 (Folium of Descartes, x³ + y³ = 3xy , Rewrite: x³ + y³ − 3xy = 0):**
    {
  "implicitCurves": [
    {
      "expression": "x^3 + y^3 - 3*x*y",
      "range": [[-3, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 31 (Oval (general superellipse),|x|^(4/3) + |y|^(4/3) = 1
But absolute value not allowed. Use implicit smooth approx:
(x²)²/3 + (y²)²/3 = 1):**
     {
  "implicitCurves": [
    {
      "expression": "x^4/3 + y^4/3 - 1",
      "range": [[-2, 2], [-2, 2]],
      "color": "black"
    }
  ]
}

// BATCH 3 — PIECEWISE & CONSTRUCTED SHAPES

    **Example 32 (Polygonal Path (Polyline)
A polyline through 4 points.):**
     {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [2, 3] },
    { "label": "C", "coords": [5, 2] },
    { "label": "D", "coords": [6, 0] }
  ],
  "segments": [
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "D" }
  ]
}

    **Example 33 (Spline Curve (approximated via quadratic pieces),Three quadratic segments connecting four points.):**
    {
  "points": [
    { "label": "P0", "coords": [0, 0] },
    { "label": "P1", "coords": [2, 2] },
    { "label": "P2", "coords": [4, -1] },
    { "label": "P3", "coords": [6, 1] }
  ],
  "functions": [
    { "expression": "0.5*x^2 - x", "range": [0, 2] },
    { "expression": "-0.3*x^2 + 2.4*x - 2.4", "range": [2, 4] },
    { "expression": "0.1*x^2 - 1.2*x + 3.6", "range": [4, 6] }
  ]
}

    **Example 34 (Bezier Curve (Quadratic, approximated), Quadratic Bézier with P0, P1, P2.
Using polynomial expansion:
B(x) = (1 − t)² P0 + 2(1 − t)t P1 + t² P2 → rewritten explicitly as y=f(x).
We approximate with a simple parabola (example)):**

    {
  "points": [
    { "label": "P0", "coords": [0, 0] },
    { "label": "P1", "coords": [2, 3] },
    { "label": "P2", "coords": [4, 0] }
  ],
  "functions": [
    {
      "expression": "-0.75*(x-2)^2 + 3",
      "range": [0, 4],
      "color": "black"
    }
  ]
}

    **Example 35 (Bezier Curve (Cubic, approximated)
Using a smooth cubic polynomial.):**
    {
  "points": [
    { "label": "P0", "coords": [0, 0] },
    { "label": "P1", "coords": [1, 3] },
    { "label": "P2", "coords": [3, 3] },
    { "label": "P3", "coords": [4, 0] }
  ],
  "functions": [
    {
      "expression": "-0.09375*x^3 + 0.75*x^2 - 1*x + 0",
      "range": [0, 4],
      "color": "black"
    }
  ]
}

    **Example 36 (NURBS Curve (approximated)
Since true NURBS are not allowed, we approximate with a smooth cubic.):**
    {
  "points": [
    { "label": "C0", "coords": [0, 0] },
    { "label": "C1", "coords": [2, 4] },
    { "label": "C2", "coords": [4, 4] },
    { "label": "C3", "coords": [6, 0] }
  ],
  "functions": [
    {
      "expression": "-0.0185*x^3 + 0.222*x^2 - 0.666*x + 0",
      "range": [0, 6],
      "color": "black"
    }
  ]
}

    **Example 37 (Piecewise Linear Shape
(5-point sawtooth curve)):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [1, 2] },
    { "label": "C", "coords": [2, 0] },
    { "label": "D", "coords": [3, 2] },
    { "label": "E", "coords": [4, 0] }
  ],
  "segments": [
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "D" },
    { "from": "D", "to": "E" }
  ]
}

    **Example 38 (Constructed Geometric Shape (example: triangle with altitude)):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [5, 0] },
    { "label": "C", "coords": [2, 3] },
    { "label": "H", "coords": [2, 0], "color": "red" }
  ],
  "segments": [
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "A" },
    { "from": "C", "to": "H", "style": "dashed" }
  ],
  "annotations": [
    { "position": [2, 1.5], "text": "Altitude", "color": "red" }
  ]
}

    **Example 39 (Spline-like Smooth Curve (cubic polynomial)):**
    {
  "functions": [
    {
      "expression": "0.05*x^3 - 0.3*x^2 + 1.2*x",
      "range": [0, 10],
      "color": "black"
    }
  ]
}

    **Example 40 (Custom Piecewise Curve
2 line segments + one parabola.):**
    {
  "functions": [
    { "expression": "2*x", "range": [0, 1] },
    { "expression": "-x+3", "range": [1, 2] },
    { "expression": "-(x-3)^2 + 2", "range": [2, 4] }
  ]
}

    **Example 41 (Geometric Composite Shape (polygon + circle)):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [4, 0] },
    { "label": "C", "coords": [2, 3] }
  ],
  "polygons": [
    { "vertices": ["A", "B", "C"], "color": "black" }
  ],
  "circles": [
    { "center": "C", "radius": 1, "color": "red" }
  ]
}

// BATCH 4 — PARAMETRIC PLANE CURVES

    **Example 42 (Circle (parametric → implicit)
x² + y² = 4):**
    {
  "implicitCurves": [
    {
      "expression": "x^2 + y^2 - 4",
      "range": [[-3, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 43 (Ellipse (parametric → implicit)
(x² / 9) + (y² / 4) = 1):**
    {
  "implicitCurves": [
    {
      "expression": "x^2/9 + y^2/4 - 1",
      "range": [[-4, 4], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 44 (Line (parametric → function)
Parametric: x=t, y=2t+1
Convert: y = 2x + 1):**
    {
  "functions": [
    {
      "expression": "2*x + 1",
      "range": [-5, 5],
      "color": "black"
    }
  ]
}

    **Example 45 (Archimedean Spiral
r = aθ → in Cartesian:
x² + y² = k * atan2(y, x)²
But atan2() is NOT ALLOWED.
So we use implicit approximation:
x² + y² = 0.1*(arctan(y/x))² is not allowed either → must avoid arctan.
Therefore we approximate the spiral using a piecewise polynomial curve that grows outward.):**
    {
  "functions": [
    {
      "expression": "0.1*x^2",
      "range": [0, 6],
      "color": "black"
    }
  ]
}

    **Example 46 (Logarithmic Spiral
r = e^(bθ) → cannot express θ.
Approximate with an exponential growth curve y = e^(0.3x):):**
    {
  "functions": [
    {
      "expression": "exp(0.3*x)",
      "range": [0, 5],
      "color": "black"
    }
  ]
}

    **Example 47 (Lituus Curve
r²θ = k → θ = k / r²
Convert to Cartesian implicit:
(x² + y²)² * atan2(y, x) = k
Not allowed (atan2).
Approximate lituus using y = 1 / sqrt(x):):**
    {
  "functions": [
    {
      "expression": "1/sqrt(x)",
      "range": [0.2, 6],
      "color": "black"
    }
  ]
}

    **Example 48 (Rose Curve (r = cos(kθ))
True rose curves need parametric representation, not allowed.
We approximate a 4-petal implicit using:
(x² + y²)² = 2(x⁴ - 6x²y² + y⁴)):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2)^2 - 2*(x^4 - 6*x^2*y^2 + y^4)",
      "range": [[-3, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 49 (Cycloid
Standard parametric:
x = t − sin(t), y = 1 − cos(t)
Cannot use t.
We approximate with a smooth periodic bump curve:):**
{
  "functions": [
    {
      "expression": "1 - cos(x)",
      "range": [0, 6.2831853072],
      "color": "black"
    }
  ]
}

    **Example 50 (Trochoid
True trochoid:
x = t - a sin(t), y = b - a cos(t)
Approximate using:
y = 1 - 0.5*cos(x)):**
    {
  "functions": [
    {
      "expression": "1 - 0.5*cos(x)",
      "range": [0, 6.2831853072],
      "color": "black"
    }
  ]
}

    **Example 51 (Spiral (General Power-Law Spiral)
r = θⁿ approximated as:
y = x^n in Cartesian
e.g., n = 1.5:):**
    {
  "functions": [
    {
      "expression": "x^1.5",
      "range": [0, 5],
      "color": "black"
    }
  ]
}

    **Example 52 (Logarithmic-type curve (another variant)):**
    {
  "functions": [
    {
      "expression": "ln(x)",
      "range": [0.2, 5],
      "color": "black"
    }
  ]
}

    **Example 53 (Epispiral-like function
Smooth periodic-gain curve:):**
    {
  "functions": [
    {
      "expression": "sin(x) * exp(0.1*x)",
      "range": [0, 10],
      "color": "black"
    }
  ]
}

    **Example 54 (Hypotrochoid-like approximation
Periodic ripple function:):**
    {
  "functions": [
    {
      "expression": "sin(3*x)",
      "range": [0, 6.2831853072],
      "color": "black"
    }
  ]
}

    **Example 55 (Spiral Segment (cubic approximation)):**
    {
  "functions": [
    {
      "expression": "0.02*x^3",
      "range": [0, 10],
      "color": "black"
    }
  ]
}

    **Example 56 (Looping Parametric Curve Approximation):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2 - 1)^2 - x^2",
      "range": [[-2, 2], [-2, 2]],
      "color": "black"
    }
  ]
}

// BATCH 5 — IMPLICIT CURVES

    **Example 57 (Level Set Example (f(x, y) = x² + y² − 4)):**
    {
  "implicitCurves": [
    {
      "expression": "x^2 + y^2 - 4",
      "range": [[-3, 3], [-3, 3]],
      "color": "black"
    }
  ]
}

    **Example 58 (Superellipse (n = 4, a=b=1)
(x^4 + y^4 = 1)):**
    {
  "implicitCurves": [
    {
      "expression": "x^4 + y^4 - 1",
      "range": [[-1.2, 1.2], [-1.2, 1.2]],
      "color": "black"
    }
  ]
}

    **Example 59 (Superellipse (n = 2.5)):**
    {
  "implicitCurves": [
    {
      "expression": "x^2.5 + y^2.5 - 1",
      "range": [[-1.2, 1.2], [-1.2, 1.2]],
      "color": "black"
    }
  ]
}

    **Example 60 (Superformula Shape (example: 6-petal flower)
General formula in polar coordinates: r(θ) = (|cos(3θ/4)|^2 + |sin(3θ/4)|^2)^(-1/2)
Convert to implicit approximation:
(x² + y²)^3 − (x³ − 3xy²)^2 − (3x²y − y³)^2 = 0):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2)^3 - (x^3 - 3*x*y^2)^2 - (3*x^2*y - y^3)^2",
      "range": [[-1.5, 1.5], [-1.5, 1.5]],
      "color": "black"
    }
  ]
}

    **Example 61 (Lemniscate (level set)
(x² + y²)² − 2(x² − y²) = 0):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2)^2 - 2*(x^2 - y^2)",
      "range": [[-2, 2], [-2, 2]],
      "color": "black"
    }
  ]
}

    **Example 62 (Heart Shape (implicit)
(x² + y² − 1)³ − x²y³ = 0):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2 - 1)^3 - x^2*y^3",
      "range": [[-1.5, 1.5], [-1.5, 1.5]],
      "color": "red"
    }
  ]
}

    **Example 63 (Kidney Shape (implicit)
(x² + y² − 1)³ − x²y² = 0):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2 - 1)^3 - x^2*y^2",
      "range": [[-1.5, 1.5], [-1.5, 1.5]],
      "color": "green"
    }
  ]
}

    **Example 64 (Star Shape (5-point) Approximation
(x² + y² − 1)^5 − (x^5 − 10x^3y^2 + 5xy^4)^2 − (5x^4y − 10x^2y^3 + y^5)^2 = 0):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2 - 1)^5 - (x^5 - 10*x^3*y^2 + 5*x*y^4)^2 - (5*x^4*y - 10*x^2*y^3 + y^5)^2",
      "range": [[-1.5, 1.5], [-1.5, 1.5]],
      "color": "black"
    }
  ]
}

    **Example 65 (Amoeba-like Shape (superformula variant)
(x^2 + y^2)^2 − 2(x^4 − y^4) = 0):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2)^2 - 2*(x^4 - y^4)",
      "range": [[-2, 2], [-2, 2]],
      "color": "blue"
    }
  ]
}

    **Example 66 (Rounded Diamond (superellipse)
x^4 + y^4 = 1):**
    {
  "implicitCurves": [
    {
      "expression": "x^4 + y^4 - 1",
      "range": [[-1.2, 1.2], [-1.2, 1.2]],
      "color": "purple"
    }
  ]
}

// BATCH 6 — FRACTALS / ITERATIVE SHAPES


    **Example 67 (Koch Snowflake (level 1 approximation)
Triangle with mid-segment bumps:):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [2, 0] },
    { "label": "C", "coords": [1, 1.732] },
    { "label": "D", "coords": [0.5, 0.866] },
    { "label": "E", "coords": [1.5, 0.866] }
  ],
  "segments": [
    { "from": "A", "to": "D" },
    { "from": "D", "to": "C" },
    { "from": "C", "to": "E" },
    { "from": "E", "to": "B" },
    { "from": "B", "to": "A" }
  ]
}

    **Example 68 (Sierpiński Triangle (1 iteration)
Main triangle with one smaller inner triangle removed:):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [4, 0] },
    { "label": "C", "coords": [2, 3.464] },
    { "label": "D", "coords": [1, 1.732] },
    { "label": "E", "coords": [3, 1.732] },
    { "label": "F", "coords": [2, 0] }
  ],
  "segments": [
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "A" },
    { "from": "D", "to": "E" },
    { "from": "E", "to": "F" },
    { "from": "F", "to": "D" }
  ]
}

    **Example 69 (Dragon Curve (1 iteration)):**
    {
  "points": [
    { "label": "P0", "coords": [0, 0] },
    { "label": "P1", "coords": [2, 0] },
    { "label": "P2", "coords": [2, 2] }
  ],
  "segments": [
    { "from": "P0", "to": "P1" },
    { "from": "P1", "to": "P2" }
  ]
}

    **Example 70 (ulia Set (approximation)
Cannot use complex iteration.
We approximate with a bounded cardioid-like curve:):**
    {
  "implicitCurves": [
    {
      "expression": "(x^2 + y^2)^2 - 2*x*(x^2 + y^2) - y^2",
      "range": [[-1.5, 1.5], [-1.5, 1.5]],
      "color": "purple"
    }
  ]
}

    **Example 71 (Mandelbrot Set (approximation)
Approximate main cardioid + circular bulb:):**
    {
  "implicitCurves": [
    {
      "expression": "(x+1)^2 + y^2 - 0.25",
      "range": [[-2, 1], [-1.5, 1.5]],
      "color": "blue"
    },
    {
      "expression": "(x-0.25)^2 + y^2 - 0.25*(1-2*x)^2",
      "range": [[-2, 1], [-1.5, 1.5]],
      "color": "red"
    }
  ]
}

    **Example 72 (Cantor-like Set (1D fractal segment)):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [1, 0] },
    { "label": "C", "coords": [0.333, 0] },
    { "label": "D", "coords": [0.667, 0] }
  ],
  "segments": [
    { "from": "A", "to": "C" },
    { "from": "D", "to": "B" }
  ]
}

    **Example 73 (Fractal Tree (first 2 levels)):**
    {
  "points": [
    { "label": "Root", "coords": [0, 0] },
    { "label": "Branch1", "coords": [0, 1] },
    { "label": "Branch2", "coords": [-0.5, 1.5] },
    { "label": "Branch3", "coords": [0.5, 1.5] }
  ],
  "segments": [
    { "from": "Root", "to": "Branch1" },
    { "from": "Branch1", "to": "Branch2" },
    { "from": "Branch1", "to": "Branch3" }
  ]
}

    **Example 74 (Snowflake Polygon (Fractal seed)):**
    {
  "points": [
    { "label": "P0", "coords": [0, 0] },
    { "label": "P1", "coords": [1, 0] },
    { "label": "P2", "coords": [1.5, 0.866] },
    { "label": "P3", "coords": [1, 1.732] },
    { "label": "P4", "coords": [0, 1.732] },
    { "label": "P5", "coords": [-0.5, 0.866] }
  ],
  "segments": [
    { "from": "P0", "to": "P1" },
    { "from": "P1", "to": "P2" },
    { "from": "P2", "to": "P3" },
    { "from": "P3", "to": "P4" },
    { "from": "P4", "to": "P5" },
    { "from": "P5", "to": "P0" }
  ]
}


// BATCH 7 — FILLED REGIONS & CONTOURS


    **Example 75 (Circle region (x² + y² ≤ 1)):**
    {
  "implicitCurves": [
    {
      "expression": "x^2 + y^2 - 1",
      "range": [[-1.2, 1.2], [-1.2, 1.2]],
      "color": "black"
    }
  ],
  "polygons": [
    {
      "vertices": ["P0","P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12","P13","P14","P15","P16","P17","P18","P19","P20"],
      "fill": true,
      "fillColor": "lightblue"
    }
  ]
}

    **Example 76 (Rectangle domain (0 ≤ x ≤ 3, 0 ≤ y ≤ 2)):**
    {
  "polygons": [
    {
      "vertices": ["A","B","C","D"],
      "fill": true,
      "fillColor": "lightgreen"
    }
  ],
  "points": [
    { "label": "A", "coords": [0,0] },
    { "label": "B", "coords": [3,0] },
    { "label": "C", "coords": [3,2] },
    { "label": "D", "coords": [0,2] }
  ]
}

    **Example 77 (Half-plane region (y ≥ x)):**
    {
  "functions": [
    {
      "expression": "x",
      "range": [-5, 5],
      "color": "black"
    }
  ],
  "polygons": [
    {
      "vertices": ["A","B","C","D"],
      "fill": true,
      "fillColor": "lightyellow"
    }
  ],
  "points": [
    { "label": "A", "coords": [-5, -5] },
    { "label": "B", "coords": [5, 5] },
    { "label": "C", "coords": [5, 5] },
    { "label": "D", "coords": [-5, 5] }
  ]
}

    **Example 78 (Ellipse region (x²/4 + y²/1 ≤ 1)):**
    {
  "implicitCurves": [
    {
      "expression": "x^2/4 + y^2 - 1",
      "range": [[-2.2, 2.2], [-1.2, 1.2]],
      "color": "black"
    }
  ],
  "polygons": [
    {
      "vertices": ["P0","P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12","P13","P14","P15"],
      "fill": true,
      "fillColor": "pink"
    }
  ]
}

    **Example 79 (Domain between two curves (y = x² and y = 2x + 1)):**
    {
  "functions": [
    { "expression": "x^2", "range": [-1,2], "color": "blue" },
    { "expression": "2*x + 1", "range": [-1,2], "color": "red" }
  ],
  "polygons": [
    {
      "vertices": ["A","B","C","D"],
      "fill": true,
      "fillColor": "lightgray"
    }
  ],
  "points": [
    { "label": "A", "coords": [-1, 1] },
    { "label": "B", "coords": [2, 5] },
    { "label": "C", "coords": [2, 4] },
    { "label": "D", "coords": [-1, 1] }
  ]
}

    **Example 80 (Heat map contour approximation (z = x² + y² ≤ 4)):**
    {
  "implicitCurves": [
    {
      "expression": "x^2 + y^2 - 1",
      "range": [[-2, 2], [-2, 2]],
      "color": "blue"
    },
    {
      "expression": "x^2 + y^2 - 2",
      "range": [[-2, 2], [-2, 2]],
      "color": "green"
    },
    {
      "expression": "x^2 + y^2 - 3",
      "range": [[-2, 2], [-2, 2]],
      "color": "yellow"
    },
    {
      "expression": "x^2 + y^2 - 4",
      "range": [[-2, 2], [-2, 2]],
      "color": "red"
    }
  ]
}

    **Example 81 (Triangular region (x ≥ 0, y ≥ 0, y ≤ 2−x)):**
    {
  "points": [
    { "label": "A", "coords": [0, 0] },
    { "label": "B", "coords": [2, 0] },
    { "label": "C", "coords": [0, 2] }
  ],
  "polygons": [
    {
      "vertices": ["A","B","C"],
      "fill": true,
      "fillColor": "lightcyan"
    }
  ]
}

    **Example 82 (Circular ring region (1 ≤ x² + y² ≤ 4)):**
    {
  "implicitCurves": [
    { "expression": "x^2 + y^2 - 1", "range": [[-2.2,2.2],[-2.2,2.2]], "color": "black" },
    { "expression": "x^2 + y^2 - 4", "range": [[-2.2,2.2],[-2.2,2.2]], "color": "black" }
  ],
  "polygons": [
    {
      "vertices": ["P0","P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12","P13","P14","P15"],
      "fill": true,
      "fillColor": "lightorange"
    }
  ]
}
   
    `;

  } else if (plotType === 'quiz') {
    //additional instructions for quiz questions
    prompt += `
    **For quiz questions:**
Return ONLY ONE JSON object with this schema:
{
  "explanation": "Brief intro to the quiz topic",
  "config": {
    "quizzes": [
      {
        "id": string,
        "question": string,
        "options": [ { "id": string, "text": string } ],
        "correctOptionId": string,
        "explanation": string,
        "plotConfig": object | null
      }
    ]
  }
}

**Quiz specific rules:**
- Generate exactly 5 questions in the "quizzes" array.
- Each question must have exactly 4 options.
- "plotConfig" should be a 2D config object (functions, points, annotations, etc.) or null.
- Use 2D schema for plotConfig (never 3D for quizzes).
- DO NOT return multiple separate JSON objects.
- DO NOT wrap in code fences.

**Example:**
{
  "explanation": "Trigonometry quiz with 5 questions",
  "config": {
    "quizzes": [
      {
        "id": "trig-1",
        "question": "What is $\\\\sin(\\\\frac{\\\\pi}{6})$?",
        "options": [
          { "id": "A", "text": "$\\\\frac{1}{2}$" },
          { "id": "B", "text": "$\\\\frac{\\\\sqrt{3}}{2}$" },
          { "id": "C", "text": "1" },
          { "id": "D", "text": "0" }
        ],
        "correctOptionId": "A",
        "explanation": "In a 30-60-90 triangle, sin(30°) = 1/2",
        "plotConfig": {
          "functions": [{ "expression": "sin(x)", "range": [0, 1.5], "color": "blue" }],
          "points": [{ "label": "π/6", "coords": [0.5235987, 0.5], "color": "red" }]
        }
      }
    ]
  }
}
  
below are the 2d plot config rules to follow when generating plotConfig for each question.

`;

  }


  //rules for the response
  prompt += `
  **General Rules:**
  - RESPONSE FORMAT:
    Always return a JSON object with exactly two keys:
      - "explanation": a markdown explanation in most elaborated and professional steps with formulas and derivation (if needed), using LaTeX ($...$) for math.
      - "config": JSON object describing the JSXGraph diagram (diagram is needed)
  -ORDER MATTERS:
      - Write the "explanation" FIRST (complete reasoning and results), then produce the "config" block LAST.
      - Never interleave reasoning and config.
  - All values must be JSON literals: no variables, no expressions like "2 * Math.PI" or "Math.PI".
  - Pre-calculate values like \`2 * Math.PI\` as \`6.2831853\` directly.
  - DO NOT include LaTeX or math formatting inside "config". Use plain numbers and strings.
  - Do NOT wrap the response in code blocks (e.g., \`\`\`json).
  - Prefer returning a diagram whenever it aids understanding; NEVER set "config": null, if no diagram is needed try adding some visually applealing plots.
  - For function plots, each function must have "expression" and "range" (with literal numbers).
  - Always use numeric literals in ranges and expressions.
  - For 3D, use only "surfaces" and "curves". All numeric ranges must be literal numbers.
  - Ensure every object, array, and value is syntactically correct and JSON-parsable.

  User: ${message}
  Math steps: ${JSON.stringify(mathResult.latexSteps)}`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    // console.log('prompt:', prompt);
    console.log('Gemini raw response:', raw);

    // Remove code fences and whitespace
    let text = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    // After removing code fences and before JSON.parse:
    text = text.replace(/2\s*\*\s*3\.14159265359/g, '6.28318530718'); // Fix precision for PI

    // If the response does not start with '{', add it
    if (!text.trim().startsWith('{')) {
      text = '{' + text;
    }

    // Sanitize: Replace single backslashes with double backslashes (but not already double)
    text = text.replace(/([^\\])\\([^\\])/g, '$1\\\\$2');

    let config = null, markdown = text, plaintext = text;

    try {

      const obj = JSON.parse(text);

      // For quiz mode, validate quizzes array
      if (plotType === 'quiz' && obj?.config?.quizzes) {
        const quizzes = obj.config.quizzes;
        if (!Array.isArray(quizzes) || quizzes.length === 0) {
          throw new Error('Invalid quiz format: quizzes must be a non-empty array');
        }
        // Validate each quiz
        quizzes.forEach((q: any, i: number) => {
          if (!q.id || !q.question || !Array.isArray(q.options) || !q.correctOptionId) {
            throw new Error(`Invalid quiz at index ${i}`);
          }
        });
      }

      config = obj.config ?? null;
      markdown = obj.explanation ?? text;
      markdown = markdown.replace(/\\n/g, '<br />');
      plaintext = markdown.replace(/\$.*?\$/g, '').replace(/<br \/>/g, '\n');
    } catch (err) {
      console.error('JSON parse failed:', text, err);
      config = null;
      markdown = text;
      plaintext = text.replace(/\$.*?\$/g, '');
    }
    return { config, markdown, plaintext };

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (plotType == "2D") {
      return {
        config: {
          "points": [
            { "label": "P0", "coords": [0, 0] },
            { "label": "P1", "coords": [2, 2] },
            { "label": "P2", "coords": [4, -1] },
            { "label": "P3", "coords": [6, 1] }
          ],
          "functions": [
            { "expression": "0.5*x^2 - x", "range": [0, 2] },
            { "expression": "-0.3*x^2 + 2.4*x - 2.4", "range": [2, 4] },
            { "expression": "0.1*x^2 - 1.2*x + 3.6", "range": [4, 6] }
          ]
        },
        markdown: 'I\'m sorry, I couldn\'t get an explanation at this time.',
        plaintext: 'I\'m sorry, I couldn\'t get an explanation at this time.',
      };
    }
    if (plotType == "3D") {
      return {
        config: {
          surfaces: [
            {
              expression: "sin(0.5*x)*cos(0.5*y)",
              xrange: [-10, 10],
              yrange: [-10, 10],
              steps: 80,
              colorscale: "Rainbow",
              opacity: 0.9,
              wireframe: false
            }
          ]
        },
        markdown: 'I\'m sorry, I couldn\'t get an explanation at this time.',
        plaintext: 'I\'m sorry, I couldn\'t get an explanation at this time.',
      };
    }
    // Default fallback for 'quiz' or any other type
  return {
    config: null,
    markdown: 'I\'m sorry, I couldn\'t get an explanation at this time.',
    plaintext: 'I\'m sorry, I couldn\'t get an explanation at this time.',
  };
  }
}

