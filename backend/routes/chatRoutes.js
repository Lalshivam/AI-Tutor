import { Router } from "express";

const router = Router();

router.get("/chats", async(req,res) => {
    const { rows } = await pool.query(
      `SELECT chat_id, title, created_at, last_message_at 
        FROM chats`,
    );
    res.json(rows);
})

router.get("/chats/:chatId", async(req,res) => {
    const chatId = req.params.chatId;
    const { rows } = await pool.query(
      `SELECT chat_id, title, created_at, last_message_at 
        FROM chats
        WHERE chat_id = $1`,
        [chatId]
    );
    res.json(rows[0]);
})

router.patch("/chats/:chatId", async(req,res)=>{
    const chatId = req.params.chatId;
    const { name } = req.body;
    await pool.query(
        `UPDATE chats
         SET title = $1
         WHERE chat_id = $2`
         [name,chatId]
    );
    res.sendStatus(204);
})

router.delete("/chats/:chatId", async(req,res)=>{
    const chatId = req.params.chatId;
    await pool.query(
        `DELETE FROM chats
         WHERE chat_id = $1`
         [chatId]
    );
    res.sendStatus(204);
})



export default router; 