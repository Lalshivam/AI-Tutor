import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

export async function explainWithGemini(message: string, mathResult: any, plotType: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Create a different prompt based on plotType (3D vs 2D)
  let prompt = `
  You are a math tutor AI. For every question, respond ONLY with a JSON object with exactly two keys:

  - "config": a structured object describing a diagram or plot for the question (or null if no visual is needed)
  - "explanation": a markdown explanation in most elaborated and professional steps with formulas and derivation (if needed), using LaTeX ($...$) for math. Include any steps from the math engine below.

  The "config" object MUST match one of these schemas:

**For 3D plots:**

{
  "surfaces": [
    {
      "expression": string,
      "xrange": [number, number],
      "yrange": [number, number],
      "steps": number,
      "colorscale"?: string,
      "opacity"?: number,           // 0 to 1 for transparency
      "wireframe"?: boolean         // true to show wireframe overlay
    }
  ],
  "curves": [
    {
      "parametric": { "x": string, "y": string, "z": string },
      "trange": [number, number, number],
      "color"?: string,
      "linewidth"?: number          // thickness of curve line
    }
  ],
  "vectorFields"?: [               // Advanced: 3D vector fields (optional)
    {
      "vector": { "x": string, "y": string, "z": string },
      "domain": {
        "xrange": [number, number],
        "yrange": [number, number],
        "zrange": [number, number]
      },
      "density": number            // number of vectors per unit volume
    }
  ]
}

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
  ]
}

**For geometry diagrams:**

{
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


  **Rules:**
  - RESPONSE FORMAT:
    Always return a JSON object with exactly two keys:
      - "explanation": a markdown explanation in most elaborated and professional steps with formulas and derivation (if needed), using LaTeX ($...$) for math.
      - "config": JSON object describing the JSXGraph diagram (or null if no diagram is needed)
  -ORDER MATTERS:
      - Write the "explanation" FIRST (complete reasoning and results), then produce the "config" block LAST.
      - Never interleave reasoning and config.
  - All values must be JSON literals: no variables, no expressions like "2 * Math.PI" or "Math.PI".
  - Pre-calculate values like \`2 * Math.PI\` as \`6.2831853\` directly.
  - DO NOT include LaTeX or math formatting inside "config". Use plain numbers and strings.
  - Do NOT wrap the response in code blocks (e.g., \`\`\`json).
  - If a plot is not needed, set "config": null.
  - For function plots, each function must have "expression" and "range" (with literal numbers).
  - For geometry, use only "points", "segments", and "circles".
  - For 3D, use only "surfaces" and "curves". All numeric ranges must be literal numbers.
  - Ensure every object, array, and value is syntactically correct and JSON-parsable.

  User: ${message}
  Math steps: ${JSON.stringify(mathResult.latexSteps)}
  `;

  // Adjust prompt to add logic based on plotType
  if (plotType === '3D') {
    prompt += `
    For a 3D sphere with a radius of 5 cm, return a parametric equation or surface plot.

    Example for sphere:
    {
      "curves": [
        {
          "parametric": {
            "x": "5 * sin(u) * cos(v)",
            "y": "5 * sin(u) * sin(v)",
            "z": "5 * cos(u)"
          },
          "trange": [0, Math.PI, 50],
          "color": "blue"
        }
      ]
    }
    `;
  } else if (plotType === '2D') {
    // Handle 2D plot type
    prompt += `
    For 2D function plots, please return only functions as follows:
    {
      "functions": [
        { "expression": "sin(x)", "range": [-6, 6], "color": "blue" }
      ]
    }
    `;
  }

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
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
      config = obj.config ?? null;
      markdown = obj.explanation ?? text;

      // Here we handle the \n (newlines) in the explanation
      markdown = markdown.replace(/\\n/g, '<br />'); // Convert all \n to <br /> for HTML rendering

      // Optionally, if you need plaintext, we remove any LaTeX for a clean version
      plaintext = markdown.replace(/\$.*?\$/g, '').replace(/<br \/>/g, '\n'); // Clean up for plaintext (if required)
    } catch (err) {
      console.error('JSON parse failed:', text, err);
      config = null;
      markdown = text;
      plaintext = text.replace(/\$.*?\$/g, '');
    }

    return { config, markdown, plaintext };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      config: null,
      markdown: 'I\'m sorry, I couldn\'t get an explanation at this time.',
      plaintext: 'I\'m sorry, I couldn\'t get an explanation at this time.',
    };
  }
}

