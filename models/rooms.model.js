const db = require("../config/db");
 async function getRooms() { 
    const sql = `SELECT * FROM rooms`

    const result = await db.query(sql)
    return result.rows
}

 async function getRoomsByName() { 
    const sql = `SELECT name FROM rooms`

    const result = await db.query(sql)
    return result.rows
        
    }
    module.exports = {getRooms, getRoomsByName}