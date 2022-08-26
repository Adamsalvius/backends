const db = require("../config/db");

async function getMessages(room) { 
    const sql = `SELECT * FROM messages WHERE room_id = $1`

    const result = await db.query(sql, [room])
    return result.rows
    }
    module.exports = {getMessages}