import { Router } from "express";

const router = Router();

router.get("/messages/:chatId", async(req,res) => {
    const chatId = req.params.chatId;
    const { rows } = await pool.query(
      `SELECT chat_id, message_id, sender, content, created_at 
        FROM messages
        WHERE chat_id = $1`,
        [chatId]
    );
    res.json(rows);
})

export default router; 