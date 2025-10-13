import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

dotenv.config(); // load .env early

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';

// dynamic import of TS in dev and JS in production
const solveMathFile = isDev ? 'solveMath.ts' : 'solveMath.js';
const geminiFile = isDev ? 'gemini.ts' : 'gemini.js';

const solveMathUrl = pathToFileURL(path.resolve(__dirname, solveMathFile)).href;
const geminiUrl = pathToFileURL(path.resolve(__dirname, geminiFile)).href;

console.log('BOOT:', { NODE_ENV: process.env.NODE_ENV, isDev, __dirname, solveMathUrl, geminiUrl });

const { solveMath } = await import(solveMathUrl);
const { explainWithGemini } = await import(geminiUrl);

const app = express();
app.use(cors());
app.use(express.json());

// health / root
app.get('/', (req, res) => {
  res.send('AI Tutor Backend is running');
});

// chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { message, plotType } = req.body || {};
    const mathResult = await solveMath(message);
    const aiResponse = await explainWithGemini(message, mathResult, plotType);
    res.json(aiResponse);
  } catch (err) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Determine frontend build folder (try multiple candidates)
const candidates = [
  // backend/dist/frontend (when copied)
  path.resolve(__dirname, 'frontend'),
  // repo-root/frontend/dist when backend/dist is one level deeper
  path.resolve(__dirname, '..', 'frontend', 'dist'),
  // repo-root/frontend/dist when started from repo root
  path.resolve(process.cwd(), 'frontend', 'dist'),
  // repo-root/dist/frontend
  path.resolve(process.cwd(), 'dist', 'frontend'),
];

let frontendPath: string | null = null;
for (const c of candidates) {
  if (fs.existsSync(c)) {
    frontendPath = c;
    break;
  }
}

// Debug logs for Render / production troubleshooting
console.log('server debug:');
console.log('  NODE_ENV =', process.env.NODE_ENV);
console.log('  process.cwd() =', process.cwd());
console.log('  candidate frontend paths =', candidates);
console.log('  selected frontendPath =', frontendPath);

if (frontendPath) {
  // serve static files in production (and also in non-prod if you want to debug)
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(frontendPath));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
    console.log('Serving frontend from', frontendPath);
  } else {
    // helpful for debugging on Render if NODE_ENV not set
    console.log('Found frontend build but NODE_ENV != production — serving anyway for debug.');
    app.use(express.static(frontendPath));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  }
} else {
  console.log('No frontend build found. Static serving disabled.');
}

// start server
const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});



// import express from 'express';
// import cors from 'cors';
// import 'dotenv/config';
// import dotenv from 'dotenv';
// import { solveMath } from './solveMath.ts';
// import { explainWithGemini } from './gemini.ts';

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('AI Tutor Backend is running');
// });


// app.post('/api/chat', async (req, res) => {
//   const { message } = req.body;
//   const mathResult = await solveMath(message);
//   const aiResponse = await explainWithGemini(message, mathResult);
//   res.json(aiResponse);
// });

// app.listen(3001, () => {
//   console.log('Server running at http://localhost:3001');
// });
