const express = require(`express`);
const app = express();
const http = require(`http`);
const fs = require("fs");
const server = http.createServer(app);
const { Server } = require("socket.io");
const PORT = process.env.PORT; /* || 666 */
const db = require("./config/db");
/* import { getMessages } from "./models/messages.model";
import { getUsers } from "./models/users.model";
import { getRooms, getRoomsByName} from "./models/rooms.model";  */

    const io = new Server(server, {
        cors: {
        origin: ["*", "https://testars.herokuapp.com" ],
        methods: ["GET", "POST", "OPTIONS"],
        headers: "Content-Type"
        }
    });

/* , "http://localhost:3000", "https://testars.herokuapp.com/" */

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


async function getUsers() { 
    const sql = `SELECT * FROM users`

    const result = await db.query(sql)
        return result.rows
    }


async function getMessages(room) { 
    const sql = `SELECT * FROM messages WHERE room_id = $1`

    const result = await db.query(sql, [room])
    return result.rows
    } 

function logit(data) {
    const fsData = JSON.stringify(data);
    if (data.message) {
        fs.appendFile("Logger.txt", fsData + "\n", (error) => {
            if (error) {
                return (
                console.log("Error writing to Logger.txt")
                )
            } else {
               return console.log("Attemp to store data in Logger.txt was successful")
            }
        })
    }
}

io.use((socket, next) => {
    socket.on("message", (date, input, user, room) => {
        const data = {
            date: date,
            message: input,
            user: user,
            room: room
        }
      logit(data);
    });
    next();
  });

io.on(`connection`, (socket) => {
    console.log(`User with id ${socket.id} has connected`);

    // Rooms
    socket.on("create_room", async function (room) {
        const sql = `INSERT INTO rooms (name) VALUES ($1)`
        const rooms = await getRooms();
     
       if (!rooms.filter(e => e.name === room).length > 0) {
            db.query(sql, [room], (error) => {
                if (error) console.error(error.message)
            }) 
            console.log(`Created ${room}`)
            socket.emit("chatroom_created", room)
        }
        else {
           console.log("There is a room like that already")
         socket.emit("chatroom_err", `did not create room "${room}". there prob is one with the same name `)
        }
     }
    )

    socket.on("join_room", async function (room) {
        const rooms = await getRooms();
      
        if (rooms.filter(e => e.name === room).length > 0) {
        console.log(`${socket.id} joined ${room}`)
        socket.join(room);
    
        io.to(room).emit("joined_room", socket.id);
        const messages = await getMessages(room);
        socket.emit("welcome_user", [messages, room])
        } else {
            socket.emit("chatroom_err", "there is no such room")
        }
      })
    
      socket.on("chatroom_leave", (data) => {
        console.log(`${socket.id} has left room ${data}`)
        socket.leave(data);
        console.log(socket.rooms);
      })

      socket.on("delete_chatroom", async function (room) {
        const sql = `DELETE FROM rooms WHERE name = $1`
        const rooms = await getRooms();
        if (rooms.filter(e => e.name === room).length > 0) {
            db.query(sql, [room], (error) => {
                if (error) console.error(error.message)
            })
        } else {
            console.log("No such room");
            socket.emit("err_delete_chatroom", "No such room")
        }
      })

      socket.on("get_chatrooms", async function () {
          const rooms = await getRoomsByName();
         
        socket.emit("all_rooms", rooms)
      })
    
      io.emit("new_client", "A new client has joined");

      socket.on("register_user", async function (user) {
        const sql = `INSERT INTO users (name) VALUES ($1)`
        const users = await getUsers();
        
       if (!users.filter(e => e.name === user).length >0) {
            db.query(sql, [user], (error) => {
                if (error) console.error(error.message)
            })
            console.log(`Created user: ${user}`)
            socket.emit("user_created", user)
        }
        else {
           console.log("User already exists")
            socket.emit("user_error", `User with the name "${user}" already taken`)
        }
      }
      )

      socket.on("login_user", async function (user) {
          const users = await getUsers()
          
        if (!users.filter(e => e.name === user).length > 0) {
            socket.emit("error_loggedin", "User does not exist")
        } else {
            socket.emit("user_loggedin", user)
        }
      })
    
      socket.on("message", function (date, data, user, room) {
        const sql = `INSERT INTO messages (date, message, user_id, room_id) VALUES ($1, $2, $3, $4);`
        if (!user) {
            console.log("ERROR_Must be logged in as user")
        } else {
        db.query(sql, [date, data, user, room], (error) => {
            if (error) console.error(error.message)
            const newMessage = {
                date: date,
                message: data,
                room: room,
                user: user,
                userId: socket.id
            }
            socket.to(room).emit("new_message", newMessage)
        })
    }
      })

      socket.on("direct_message", (data) => {
        socket.to(data.to).emit("message", data.message)
      })
    
      socket.on("disconnect", (reason) => {
        console.log(`User ${socket.id} disconnected. Reason: ${reason}`)
      })
    })

server.listen(PORT, () => {
    console.log(`Listening on ${PORT} fo sho`)
})