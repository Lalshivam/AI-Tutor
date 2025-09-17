import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

export async function explainWithGemini(message: string, mathResult: any) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
  You are a math tutor AI. For every question, respond ONLY with a JSON object with exactly two keys:

- "config": a structured object describing a diagram or plot for the question (or null if no visual is needed)
- "explanation": a markdown explanation in most elaborated and professional steps with formulas and derivation(if needed), using LaTeX ($...$) for math. Include any steps from the math engine below.

The "config" object MUST match one of these schemas:

---

**1. For 2D function plots:**
{
  "functions": [
    { "expression": string, "range": [number, number], "color"?: string }
    // Add more functions as needed
  ],
  "sliders"?: [
    { "label": string, "min": number, "max": number, "initial": number }
    // Optional, for interactive plots
  ]
}

**2. For geometry diagrams:**
{
  "points": [
    { "label": string, "coords": [number, number] }
  ],
  "segments"?: [
    { "from": string, "to": string, "style"?: "solid"|"dashed", "color"?: string }
  ],
  "circles"?: [
    { "center": string, "radius": number, "color"?: string }
  ]
}

**3. For 3D plots:**
{
  "surfaces"?: [
    { "expression": string, "xrange": [number, number], "yrange": [number, number], "steps": number, "colorscale"?: string }
  ],
  "curves"?: [
    { "parametric": { "x": string, "y": string, "z": string }, "trange": [number, number, number], "color"?: string }
  ]
}

---

**Rules:**
- Use ONLY the above schemas for "config". Do NOT add extra fields (like "type", "plots", "axes", "title", etc.).
- For function plots, each function must have "expression" and "range".
- For geometry, use only "points", "segments", and "circles" as shown.
- For 3D, use only "surfaces" and "curves" as shown.
- If no diagram is needed, set "config": null.
- Always use valid JSON (no comments, no trailing commas, no markdown code fences).
- Do NOT include any explanation or text outside the JSON object.
- When writing LaTeX in the explanation, always double-escape backslashes (use \\\\ instead of \\) so the JSON is valid.
- For every surface in "surfaces", always include "xrange" and "yrange".
- For every curve in "curves", always include "trange" with [min, max, steps].
- For every segment in "segments", always include "from" and "to" referencing point labels.
- For every circle in "circles", always include "center" referencing a point label and "radius".
- Use "color" fields to specify colors (e.g. "red", "blue", "#ff0000") where applicable.
- Use "style" in segments to specify line style ("solid" or "dashed").
- If the user requests multiple functions, points, or shapes, include them all in the respective arrays.
- All array values in JSON (like "trange", "xrange", "yrange") must be explicit numbers, not expressions. For example, use 6.283 instead of 2*3.1415.
- For 3D surfaces, always provide an explicit formula for z in terms of x and y (e.g., "z = sqrt(25 - x**2 - y**2)"). Do not use implicit equations or expressions involving z on both sides.


---

**Examples:**

User: Plot y = sin(x) and y = cos(x) from -6 to 6.
Response:
{
  "config": {
    "functions": [
      { "expression": "sin(x)", "range": [-6, 6], "color": "blue" },
      { "expression": "cos(x)", "range": [-6, 6], "color": "red" }
    ]
  },
  "explanation": "Here are the graphs of $y=\\sin(x)$ and $y=\\cos(x)$ on the same axes."
}

User: Draw a triangle with vertices A(0,0), B(4,0), C(2,3).
Response:
{
  "config": {
    "points": [
      { "label": "A", "coords": [0, 0] },
      { "label": "B", "coords": [4, 0] },
      { "label": "C", "coords": [2, 3] }
    ],
    "segments": [
      { "from": "A", "to": "B" },
      { "from": "B", "to": "C" },
      { "from": "C", "to": "A" }
    ]
  },
  "explanation": "This triangle has vertices at $A(0,0)$, $B(4,0)$, and $C(2,3)$."
}

User: Plot the surface z = x^2 + y^2 for x and y from -5 to 5.
Response:
{
  "config": {
    "surfaces": [
      { "expression": "x**2 + y**2", "xrange": [-5, 5], "yrange": [-5, 5], "steps": 30 }
    ]
  },
  "explanation": "This is the surface $z = x^2 + y^2$."
}

User: What is the derivative of x^2?
Response:
{
  "config": null,
  "explanation": "The derivative of $x^2$ is $2x$."
}

---

Remember: **Respond ONLY with the JSON object in the exact schema above.**

User: ${message}
Math steps: ${JSON.stringify(mathResult.latexSteps)}
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    console.log('Gemini raw response:', raw);

    // Remove code fences and whitespace
    let text = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    // After removing code fences and before JSON.parse:
    text = text.replace(/2\s*\*\s*3\.14159265359/g, '6.28318530718');

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
      plaintext = markdown.replace(/\$.*?\$/g, '');
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
// import { GoogleGenerativeAI } from '@google/generative-ai';

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
// console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

// export async function explainWithGemini(message: string, mathResult: any) {

//   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

//   const prompt = `
// You're a math tutor. For the following question, respond with a JSON object with two keys:
// - "config": a diagram/plot specification for the question (or null if not needed)
// - "explanation": a markdown explanation in simple steps, using LaTeX ($...$) for math. Include any steps from the math engine below.

// User: ${message}
// Math steps: ${JSON.stringify(mathResult.latexSteps)}
// `;

//   try {
//     const result = await model.generateContent(prompt);
//     const text = result.response.text();
//     return {
//       markdown: text,
//       plaintext: text.replace(/\$.*?\$/g, ''),
//     };
//   } catch (error) {
//     console.error('Error calling Gemini API:', error);
//     return {
//       markdown: 'I\'m sorry, I couldn\'t get an explanation at this time.',
//       plaintext: 'I\'m sorry, I couldn\'t get an explanation at this time.',
//     };
//   }
// }