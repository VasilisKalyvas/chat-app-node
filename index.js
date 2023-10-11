const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require('socket.io')
const PORT = 4000
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ['GET', 'POST']
    }
});

let onlineUsers = []
let messages = []
//Add this before the app.get() block
io.on('connection', (socket) => {
    console.log(` ${socket.id} connected!`);
    io.emit('online', onlineUsers)
    io.emit('messages', messages)

    socket.on('username', (username) => {
        if(onlineUsers?.includes(user => user.socketId === socket.id)) return
        onlineUsers.push({username: username, socketId: socket.id})
        io.emit('online', onlineUsers)
    })

    socket.on('send-message', ({message, user}) => {
        if(!message?.length) return
        messages.push({user: user, message: message, socketId: socket.id})
        io.emit('messages', messages)
    })

    socket.on('disconnect', () => {
        const updatedOnlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
        onlineUsers = updatedOnlineUsers
        io.emit('online', onlineUsers)
      console.log(' A user disconnected');
    });
});

server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ${PORT}`);
});