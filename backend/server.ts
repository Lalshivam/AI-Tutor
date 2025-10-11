import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import dotenv from 'dotenv';
import { solveMath } from './solveMath.ts';
import { explainWithGemini } from './gemini.ts';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('AI Tutor Backend is running');
});

app.post('/api/chat', async (req, res) => {
  const { message, plotType } = req.body;  // Extract plotType from the request body
  const mathResult = await solveMath(message);

  // Pass plotType along with the message and math result to Gemini
  const aiResponse = await explainWithGemini(message, mathResult, plotType);
  res.json(aiResponse);
});

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
