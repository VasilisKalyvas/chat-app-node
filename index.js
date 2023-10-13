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
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    }
});

let onlineUsers = []
let messages = []
let typingUsers = []

//Add this before the app.get() block
io.on('connection', (socket) => {
    console.log(` ${socket.id} connected!`);
    io.emit('online', onlineUsers)
    io.emit('messages', messages)

    socket.on('username', (username) => {
        if(onlineUsers?.includes(user => user.socketId === socket.id)) return
        onlineUsers.push({username: username, socketId: socket.id})
        io.emit('online', onlineUsers)
        messages.push({user: 'Admin', message: `${username} Joined...`, socketId: socket.id, isAdmin: true})
        socket.broadcast.emit('messages', messages)
    })

    socket.on('typing', ({isTyping, username, socketId}) => {
        if(isTyping){
            if(!typingUsers?.find(user => user.socketId === socketId))
            {
                typingUsers.push({username: username, socketId: socketId})
            }
        } else {
            const updatedTypingUsers = typingUsers.filter((user) => user.socketId !== socketId)
            typingUsers = updatedTypingUsers
        }
        io.emit('typing', {isTyping, typingUsers})
    })

    socket.on('send-message', ({message, user}) => {
        if(!message?.length) return
        messages.push({user: user, message: message, socketId: socket.id})
        io.emit('messages', messages)
    })

    socket.on('logout', (username) => {
        if(username?.length){
            messages.push({user: 'Admin', message: `${username} left...`, socketId: socket.id})

                const updatedOnlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
                onlineUsers = updatedOnlineUsers

                const updatedTypingUsers = typingUsers.filter((user) => user !== username)
                typingUsers = updatedTypingUsers

                io.emit('typing', {isTyping: false, typingUsers})
                io.emit('online', onlineUsers)

            
                io.emit('messages', messages)
                console.log(' A user disconnected');
        }
    })

    socket.on('disconnect', (reason) => {
        const user = onlineUsers.find((user) => user.socketId === socket.id)
        if(user){
            if(!reason?.length){
                console.log('unwanted disconnect')
                const updatedOnlineUsers = onlineUsers.map(user => {
                    if(user?.socketId === socket.id){
                        console.log('true')
                        return {...user, socketId: socket.id}
                    } else {
                        return user
                    }
                })
                onlineUsers = updatedOnlineUsers
                io.emit('online', onlineUsers)
           
            }else {
                messages.push({user: 'Admin', message: `${user.username} left...`, socketId: socket.id})

                const updatedOnlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
                onlineUsers = updatedOnlineUsers

                const updatedTypingUsers = typingUsers.filter((user) => user !== user)
                typingUsers = updatedTypingUsers

                io.emit('typing', {isTyping: false, typingUsers})
                io.emit('online', onlineUsers)

            
                io.emit('messages', messages)
                console.log(' A user disconnected');
            }
        }
    });
});

server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ${PORT}`);
});
