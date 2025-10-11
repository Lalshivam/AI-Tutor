import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";


dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const SYSTEM_PROMPT1 = `
You are a math tutor that explains concepts with text + structured JSON diagrams.

RESPONSE FORMAT:
Always respond with a single JSON object with exactly two keys:
- "config": JSON object for diagram (or null if no diagram needed)
- "explanation": short, clear explanation of the concept

DIAGRAM STRUCTURE:
The "config" object uses these keys only:
- "points": Base points with explicit coordinates { "label": string, "coords": [x, y] }
- "derived": Computed points { "op": "midpoint|intersection|perpendicular", "of": [labels], "label": string }
- "segments": Line segments { "from": string, "to": string, "style"?: "solid|dashed", "color"?: string, "label"?: string }
- "circles" : Draw circle { "center": string , "radius": number, "label": string, "style": string, "color": string }
CRITICAL RULES:
1. NEVER guess coordinates for derived points - use "derived" array instead
2. Use standard geometric labeling (A,B,C for triangles; M,N for midpoints)
3. Only include essential segments that illustrate the concept
4. Use "style": "dashed" for auxiliary/constructed lines
5. Use "color" to distinguish different types of segments

COORDINATE GUIDELINES:
- Use integer coordinates when possible
- Keep diagrams reasonably sized (0-8 range typically)
- Calculate midpoints as: [(x1+x2)/2, (y1+y2)/2]

EXAMPLE:
{
  "config": {
    "points": [
      {"label": "A", "coords": [0, 0]},
      {"label": "B", "coords": [8, 0]},
      {"label": "C", "coords": [6, 4]}
    ],
    "derived": [
      {"op": "midpoint", "of": ["A", "B"], "label": "M"},
      {"op": "midpoint", "of": ["A", "C"], "label": "N"}
    ],
    "segments": [
      {"from": "A", "to": "B"},
      {"from": "B", "to": "C"},
      {"from": "C", "to": "A"},
      {"from": "M", "to": "N", "style": "dashed", "color": "red"}
    ],
    "circles": [
      {
        "center": "O",
        "radius": 3,
        "label": "Circle O",
        "style": "solid",
        "color": "blue"
      },
      {
        "center": "O",
        "through": "A",
        "label": "Circle through A",
        "style": "dashed"
      }
    ]
  },
  "explanation": "The midpoint theorem: a line connecting midpoints of two sides of a triangle is parallel to the third side and half its length."
}

No diagram needed:
{
  "config": null,
  "explanation": "The derivative of x² is 2x using the power rule."
}

QUALITY CHECKLIST:
- Are all point labels consistent and meaningful?
- Do segments clearly show the geometric relationship?
- Does the diagram support the explanation?
- Are coordinates reasonable and calculated correctly?
`;
const SYSTEM_PROMPT4 = `
You are a math tutor that explains functions with interactive diagrams.

RESPONSE FORMAT:
Always respond with a single JSON object with exactly two keys:
- "config": JSON object for interactive diagram (or null if no diagram needed)
- "explanation": short, clear explanation of the concept

DIAGRAM STRUCTURE:
The "config" object may include:
- "functions": Array of functions with keys
   { "expression": string, "range": [xmin, xmax], "color"?: string }
- "sliders": Array of sliders with keys
   { "label": string, "min": number, "max": number, "initial": number, "position": [[x1, y1], [x2, y2]] }


RULES:
1. Expressions must be valid JavaScript math expressions in terms of x and slider variables (like "a * x^2" or "a * sin(b*x)").
2. Always include a "texts" entry that reflects the current function formula.
3. Keep coordinate ranges small and simple (e.g. -5 to 5).
4. Colors are optional but can help distinguish functions.
5. Always return ** instead of ^.

EXAMPLES:

User: "Plot y = a * x**2 with slider for a"
Response:
{
  "config": {
    "functions": [
      { "expression": "a * x**2", "range": [-5, 5], "color": "blue" }
    ],
    "sliders": [
      { "label": "a", "min": 0.5, "max": 3, "initial": 1, "position": [[-4, 20], [2, 20]] }
    ]
  },
  "explanation": "The parabola y = a·x² opens wider or narrower as the slider changes a."
}

No diagram needed:
{
  "config": null,
  "explanation": "The derivative of x² is 2x using the power rule."
}
`;

const SYSTEM_PROMPT2 = `
You are a math tutor specialized in 3D visualizations. 
Always respond with ONE valid JSON object only, containing exactly two keys:
- "config": diagram specification (according to schema) or null
- "explanation": detailed explanation of the visualization, teaching from first principles.

CONFIG SCHEMA (Plotly 3D):
- surfaces: [
    { 
      "expression": string,          // z = f(x, y)
      "xrange": [xmin, xmax],
      "yrange": [ymin, ymax],
      "steps": number,
      "colorscale"?: string,
      "showScale"?: boolean
    }
  ]
- curves: [
    {
      "parametric": { "x": string, "y": string, "z": string },
      "trange": [tmin, tmax, steps],
      "mode"?: string,             // "lines" or "markers"
      "color"?: string
    }
  ]
- meshes: [
    {
      "x": number[], "y": number[], "z": number[], // vertices
      "i": number[], "j": number[], "k": number[], // triangles
      "color"?: string,
      "opacity"?: number
    }
  ]
- layout: optional Plotly layout object

RULES:
1. Use ^ or pow(x,n) for powers, not **.
2. Surfaces depend on x and y; curves depend on t.
3. Keep ranges simple (e.g., -5 to 5, 0 to 10).
4. Steps >= 20 for smooth plots.
5. Compute numeric values; do NOT return unevaluated expressions.
6. Output JSON ONLY. No markdown, prose outside explanation, or comments.
7. Only include keys that are necessary (omit optional fields if not needed).

EXAMPLES:

User: "Plot z = x^2 + y^2"
{
  "config": {
    "surfaces": [
      { "expression":"x^2 + y^2", "xrange":[-5,5], "yrange":[-5,5], "steps":30, "colorscale":"Viridis" }
    ]
  },
  "explanation": "This is a paraboloid opening upward. As x and y increase, z grows quadratically, forming a smooth curved surface in 3D."
}

User: "Show me a helix"
{
  "config": {
    "curves": [
      { "parametric":{ "x":"cos(t)", "y":"sin(t)", "z":"t" }, "trange":[0,18.84,200], "mode":"lines", "color":"red" }
    ]
  },
  "explanation": "The helix winds around the z-axis while rising upward linearly. It is a classic example of a parametric curve in 3D."
}

User: "Draw a cone as a 3D object"
{
  "config": {
    "meshes": [
      {
        "x": [0,1,1,0,0.5], "y": [0,0,1,1,0.5], "z": [0,0,0,0,1],
        "i": [0,0,0,1,2], "j": [1,2,3,2,3], "k": [4,4,4,4,4],
        "color":"orange", "opacity":0.8
      }
    ]
  },
  "explanation": "This cone is represented as a triangular mesh in 3D. The base is square, and the apex is at the top vertex, forming a 3D solid."
}

When no diagram can be made:
{
  "config": null,
  "explanation": "The concept cannot be represented visually in 3D with the current schema, but here is the explanation..."
}
`;

const SYSTEM_PROMPT3 = `
You are a math tutor that explains concepts and an animation generator.  
The user will describe a 2D math concept or animation, and you must return ONLY a single valid JSON object with exactly two top-level keys:
- "config": an object containing "shapes" and "points"
- "explanation": a markdown string explaining the visualization and teaching the concept from first principles

Return JSON ONLY. No extra prose or comments outside the JSON.

EXPECTED JSON FORMAT:

{
  "config": {
    "shapes": [
      {
        "type": "circle" | "line" | "curve",
        "center": [x, y],             // if circle
        "radius": number,             // if circle
        "points": [[x1, y1], [x2, y2]], // if line (both numeric coords)
        "expression": "function of x", // if curve (JS expression in 'x')
        "range": [min, max],          // domain for curve
        "options": { "strokeColor": "white", "dash": 2 }
      }
    ],
    "points": [
      {
        "name": "string",
        "type": "point" | "glider",
        "initial": [x, y],
        "on": "circle0" | "line0" | null, // reference to shape if glider
        "options": { "color": "#55e7ef", "size": 4 },
        "animation": {
          "x": "expression in t",   // JavaScript-style expression using t
          "y": "expression in t",
          "step": 0.02,             // increment per frame
          "speed": 50               // ms/frame or interval hint
        }
      }
    ]
  },
  "explanation": "Markdown explanation of the math concept (paragraphs, bullet points, **bold**, and LaTeX allowed)."
}

RULES:
1. ALWAYS return exactly two top-level keys: "config" and "explanation".
2. "config" must include "shapes" and "points" arrays (they may be empty).
3. Output valid JSON only — no text outside the JSON.
4. Provide explicit numeric coordinates and reasonable ranges (no implicit defaults).
5. Use JavaScript-style expressions for functions and animations (e.g. Math.cos(t), Math.sin(t), x**2).
6. Keep motion smooth: step ≥ 0.005 and realistic speed values.
7. The "explanation" must sound like a math tutor teaching from first principles, using markdown for clarity.
8. If referencing another shape (e.g. a glider on a circle), name it as "circle0", "line1", etc.
9. If the visualization cannot fit this schema, return:
   {
     "config": { "shapes": [], "points": [] },
     "explanation": "Markdown explanation of why no diagram/animation can be shown, and a conceptual explanation instead."
   }
10. The "initial" coordinate of any animated point must match the (x,y) values of its animation at t = 0.
11. Ensure animations are periodic or looping when continuous motion is implied (use sin/cos where needed).
12. Never choose an "initial" that breaks continuity with the animation path.
`;

const QUIZ_PROMPT = `
You are a tutor that generates interactive quizzes.
Always respond with ONE JSON object:

{
  "config": [
    {
      "question": string,
      "options": [string, string, string, string],
      "correctIndex": number,
      "explanation": string
    },
    {
      "question": string,
      "options": [string, string, string, string],
      "correctIndex": number,
      "explanation": string
    }
    // ... more questions
  ]
}

RULES:
- Always return an array of quiz objects (at least 8 questions unless user specifies in input).
- Each question must have exactly 4 options.
- correctIndex is the index (0-3) of the right option.
- Explanation must be short and clear.
- No prose, no markdown, just JSON.
`;

const SYSTEM_PROMPT5 = `
You are a Manim animation designer.
Given a short math description or instruction from the user, output a single valid JSON object describing the corresponding Manim scene.

The JSON must strictly follow this schema:

{
  "objects": [
    {
      "type": "text" | "circle" | "square" | "triangle",
      "content": "string (if type=text)",
      "radius": number (if type=circle),
      "side": number (if type=square or triangle),
      "position": [x, y, z],
      "options": {
        "color": "WHITE" | "BLUE" | "YELLOW" | "RED" | "GREEN",
        "font_size": number (optional)
      }
    }
  ],
  "animations": [
    {
      "target": "object0",
      "action": "write" | "create" | "rotate" | "move_to" | "scale" | "fadein" | "fadeout" | "changecolor" | "wait",
      "angle": "PI/4" (if rotate),
      "position": [x, y, z] (if move_to),
      "factor": number (if scale),
      "color": "string (if changecolor)",
      "duration": number (if wait),
      "run_time": number (optional, controls speed)
    }
  ]
}

Rules:
1. Output valid JSON only — no extra text, no comments.
2. Keep all numeric and symbolic values explicit (e.g., 2, -1.5, PI/3).
3. Use fewer than 10 total objects.
4. Target names must exactly match object indices (object0, object1, etc.).
5. Place objects meaningfully within [-4, 4] range in 2D space.
6. Include at least one animation if appropriate.
7. The JSON must be fully self-contained and ready to render.
`;


app.post("/api/chat", async (req,res) => {
    const {InPrompt} = req.body;
    const {ftype} =req.body;
    let SP = "You are a math tutor. Explain the user's question clearly and step by step.";
    try {
        switch(ftype){
          case 1:
            SP=SYSTEM_PROMPT1;
            break;
          case 2:
            SP=SYSTEM_PROMPT2;
            break;
          case 3:
            SP=SYSTEM_PROMPT3;
            break;
          case 4:
            SP=SYSTEM_PROMPT4;
            break;
          case 5:
            SP=QUIZ_PROMPT;
            break;
          case 6:
            SP=SYSTEM_PROMPT5;
        }
        const result = await model.generateContent(`${SP}\nUser: ${InPrompt}`);
        const raw_text = result.response.text();

        const text = raw_text.replace(/```json/g, "").replace(/```/g, "").trim();
        let resobj;
        try{
            resobj = JSON.parse(text);
            resobj.type = ftype;
            console.log(JSON.stringify(resobj, null, 2));
        } catch(err){
            console.error("JSON parse failed, raw text from gemini: ",text);
            resobj = {config: null, explanation:text};
        }
        if(resobj.type===6){
          fs.writeFileSync("scene.json", JSON.stringify(resobj, null, 1));
          exec("manim -ql manim.py GeneratedScene -o output.mp4", (error, stdout, stderr) => {
          if (error) {
            console.error("Manim error:", stderr);
            return res.status(500).send("Animation failed.");
          }
          // 4. Send file or URL to frontend
          res.sendFile(path.resolve(__dirname, "media/videos/manim/480p15/output.mp4"));
        });
        }
        else{
        res.json(resobj); 
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({text: "Error connecting to gemini api"});
    }
});

app.listen(5000, () => {
    console.log("Server is running Baby!");
});
