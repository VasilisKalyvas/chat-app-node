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
        origin: "https://real-chat-app-tmow.onrender.com/",
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    }
});

function startHeartbeat(socket) {
    socket.heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat', Date.now());
    }, 8000); // Send a heartbeat every 5 seconds
  
    socket.on('heartbeat', () => {
      // Respond to the heartbeat
    });
  }
  
  function stopHeartbeat(socket) {
    clearInterval(socket.heartbeatInterval);
  }

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
        startHeartbeat(socket);
        messages.push({user: 'Admin', message: `${username} Joined...`, socketId: socket.id, isAdmin: true})
        socket.broadcast.emit('messages', messages)
    })

    socket.on('typing', ({isTyping, username}) => {
        socket.broadcast.emit('typing', {isTyping, username: !isTyping ? '': username})
    })

    socket.on('send-message', ({message, user}) => {
        if(!message?.length) return
        messages.push({user: user, message: message, socketId: socket.id})
        io.emit('messages', messages)
    })

    socket.on('logout', (user) => {
        const updatedOnlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
        onlineUsers = updatedOnlineUsers
        io.emit('online', onlineUsers)
        messages.push({user: 'Admin', message: `${user} left...`, socketId: socket.id})
        io.emit('messages', messages)
        stopHeartbeat(socket);
        console.log(' A user disconnected');
    })

    socket.on('disconnect', () => {
        const user = onlineUsers.find(user => user?.socketId === socket.id)
        if(user){
            messages.push({user: 'Admin', message: `${user?.username} left...`, socketId: socket.id})
            io.emit('messages', messages)
        }
        const updatedOnlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
        onlineUsers = updatedOnlineUsers
        io.emit('online', onlineUsers)
        stopHeartbeat(socket);
        console.log(' A user disconnected');
    });
});

server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ${PORT}`);
});
