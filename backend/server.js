import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai"
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import authRoutes from "./routes/auth.js";
import msgRoutes from "./routes/msgRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import cookieParser from "cookie-parser";
import authMiddleware from "./middlewares/authmid.js";
import { QUIZ_PROMPT, SYSTEM_PROMPT2D, SYSTEM_PROMPT3D, SYSTEM_PROMPT_ANIMATE, SYSTEM_PROMPT_MANIM } from "./prompts.js";


dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
//app.use(cors()); -> only allows simple requests

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use(authMiddleware());

app.use("/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api", msgRoutes);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.post("/api/chat", async (req,res) => {

    if (!req.session.userId) return res.status(401).json({ loggedIn: false });
    const {InPrompt} = req.body;
    const {ftype} =req.body;
    let SP = "You are a math tutor. Explain the user's question clearly and step by step.";
    try {
        switch(ftype){
          case 1:
            SP=SYSTEM_PROMPT2D;
            break;
          case 2:
            SP=SYSTEM_PROMPT3D;
            break;
          case 3:
            SP=SYSTEM_PROMPT_ANIMATE;
            break;
          case 4:
            SP=QUIZ_PROMPT;
            break;
          case 5:
            SP=SYSTEM_PROMPT_MANIM;
            break;
        }
        const result = await model.generateContent(`${SP}\nUser: ${InPrompt}`);
        const raw_text = result.response.text();

        const text = raw_text.replace(/```json/g, "").replace(/```/g, "").trim();
        let resobj;
        try{
            resobj = JSON.parse(text);
            console.log(JSON.stringify(resobj, null, 2));
        } catch(err){
            console.error("JSON parse failed, raw text from gemini: ",text);
            resobj = {config: null, explanation:text};
        }
        if(ftype===5){
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

//global error handler 
app.use((err, req, res, next) => {
  console.error(err); 

  res.status(500).json({
    error: 'Internal server error',
  });
});

app.listen(5000, () => {
    console.log("Server is running Baby!");
});