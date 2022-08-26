const express = require(`express`);
const app = express();
const http = require(`http`);
const fs = require("fs");
const server = http.createServer(app);
const { Server } = require("socket.io");
const PORT = process.env.PORT || 666
const db = require("./config/db")

    const io = new Server(server, {
        cors: {
        origin: ["*"],
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

function straightToTheLog(data) {
    const fsData = JSON.stringify(data);
    if (data.message) {
        fs.appendFile("DOOM_LOG.txt", fsData + "\n", (error) => {
            if (error) {
                return (
                console.log("Error writing to DOOM_LOG.txt")
                )
            } else {
               return console.log("Attemp to store data in DOOM_LOG.txt was successful")
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
      straightToTheLog(data);
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
            console.log(`Created room: ${room}`)
            socket.emit("room_created", room)
        }
        else {
           console.log("Room already exists")
         socket.emit("room_error", `Error creating room "${room}", it might already exist`)
        }
     }
    )

    socket.on("join_room", async function (room) {
        const rooms = await getRooms();
      
        if (rooms.filter(e => e.name === room).length > 0) {
        console.log(`${socket.id} has joined ${room}`)
        socket.join(room);
    
        io.to(room).emit("joined_room", socket.id);
        const messages = await getMessages(room);
        socket.emit("welcome_to_room", [messages, room])
        } else {
            socket.emit("room_error", "No such room, create one or try another name")
        }
      })
    
      socket.on("leave_room", (data) => {
        console.log(`${socket.id} has left room ${data}`)
        socket.leave(data);
        console.log(socket.rooms);
      })

      socket.on("remove_room", async function (room) {
        const sql = `DELETE FROM rooms WHERE name = $1`
        const rooms = await getRooms();
        if (rooms.filter(e => e.name === room).length > 0) {
            db.query(sql, [room], (error) => {
                if (error) console.error(error.message)
            })
        } else {
            console.log("No such room");
            socket.emit("error_remove_room", "No such room")
        }
      })

      socket.on("get_rooms", async function () {
          const rooms = await getRoomsByName();
         
        socket.emit("all_rooms", rooms)
      })
    
      io.emit("new_client", "A new client has joined");

      socket.on("create_user", async function (user) {
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