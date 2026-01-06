
async function authMiddleware(req, res, next){
    const sessionId = req.cookies['connect.sid'];
    if(!sessionId){
        return res.status(401).json({error: 'Not authenticated!'})
    }

    const { rows } = await pool.query(
        `SELECT user_id FROM sessions 
         WHERE session_id = $1 AND expires_at > now()`,
         [sessionId]
    ); 

    if(rows.length === 0){
        return res.status(401).json({error: 'Invalid or expired session!'});
    }
    req.userId = rows[0].user_id;
    next();
}

export default authMiddleware;