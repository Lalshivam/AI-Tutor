import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import dotenv from 'dotenv';
import { solveMath } from './solveMath.ts';
import { explainWithGemini } from './gemini.ts';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('AI Tutor Backend is running');
});

app.post('/api/chat', async (req, res) => {
  const { message, plotType } = req.body;
  const mathResult = await solveMath(message);
  const aiResponse = await explainWithGemini(message, mathResult, plotType);
  res.json(aiResponse);
});

// === Serve frontend in production ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.resolve(__dirname, '../frontend/dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendPath));

  // ✅ Correct wildcard route
  app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
}

app.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
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
