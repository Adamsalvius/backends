const db = require("./config/db");
async function getUsers() { 
    const sql = `SELECT * FROM users`

    const result = await db.query(sql)
        return result.rows
    }


    module.exports = {getUsers}