import bcrypt from "bcryptjs";
import crypto from 'crypto';
import { Router } from "express";
import authMiddleware from "../middlewares/authmid";

const router = Router();

// Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const name =  'Ayan'; 
  if (!email || !password) {
    return res.status(400).json({error: "Missing fields"});
  }

  const hash = await bcrypt.hash(password, 10);
 
  try {
    await pool.query(
      `INSERT INTO users (email,password_hash,name)
       VALUES ($1,$2,$3)`,
       [email,hash,name]
    );
  } catch (err){
    if(err.code==='23505'){
      return res.status(409).json({error:'Email already registered!'});
    }
    throw err; 
  }
  return res.status(200).json({ message: "Registered successfully" });
});

// Login
router.post("/login", async (req, res) => {
    
  const { email, password } = req.body;

  const { rows } = await pool.query(
    `SELECT user_id, password_hash
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO sessions (session_id, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [sessionId, user.user_id, expiresAt]
  );

  res.cookie('connect.sid', sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires: expiresAt
  });

  return res.status(200).json({
    user: { email: user.email }
  });
});

//Profile info route
router.get("/me", async(req, res) => {
  const { rows } = await pool.query(
    `SELECT user_id, email, name, created_at
     FROM users 
     WHERE user_id = $1`,
     [req.userId]
  );
  res.json(rows[0]);
});

//Logout
router.post("/logout", async(req, res) => {
  const sessionId = req.cookies['connect.sid'];

  await pool.query(
    `DELETE FROM sessions WHERE session_id=$1`,
    [sessionId]
  );

  res.clearCookie('connect.sid');
  res.json({message: 'Logged out'});
});
export default router;