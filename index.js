const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require('socket.io');

const socketApp = express();

const httpServer = http.createServer(socketApp);

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  }
});

const PORT = 4000;

socketApp.use(cors());

let onlineUsers = []
let messages = []
let typingUsers = []

//Add this before the app.get() block
io.on('connection', (socket) => {
    console.log(` ${socket.id} connected!`);
    io.emit('connected', {isConnected: true})

    io.emit('online', onlineUsers)
    io.emit('messages', messages)

    socket.on('username', (username) => {
        if(onlineUsers?.includes(user => user.socketId === socket.id)) return
        onlineUsers.push({username: username, socketId: socket.id})
        io.emit('online', onlineUsers)
        messages.push({user: 'Admin', message: {content: `${username} Joined...`, type: 'message'}, socketId: socket.id, isAdmin: true})
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
        if(!message?.content?.length) return
        messages.push({user: user, message: message, socketId: socket.id})
        io.emit('messages', messages)
    })

    socket.on('logout', (username) => {
        if(username?.length){
            messages.push({user: 'Admin', message:{content: `${username} left...`, type: 'message'}, socketId: socket.id})

                const updatedOnlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
                onlineUsers = updatedOnlineUsers

                const updatedTypingUsers = typingUsers.filter((user) => user !== username)
                typingUsers = updatedTypingUsers

                io.emit('typing', {isTyping: false, typingUsers})
                io.emit('online', onlineUsers)

            
                io.emit('messages', messages)
                io.emit('connected', {isConnected: false})
                console.log(' A user disconnected');
        }
    })

    socket.on('disconnect', (reason) => {
        const user = onlineUsers.find((user) => user.socketId === socket.id)
        if(user){
            if(reason !== 'client namespace disconnect'){
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
           
            } else {
                messages.push({user: 'Admin', message: { content: `${user.username} left...`, type: 'message'}, socketId: socket.id})

                const updatedOnlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
                onlineUsers = updatedOnlineUsers

                const updatedTypingUsers = typingUsers.filter((user) => user !== user)
                typingUsers = updatedTypingUsers

                io.emit('typing', {isTyping: false, typingUsers})
                io.emit('online', onlineUsers)

            
                io.emit('messages', messages)
                io.emit('connected', {isConnected: false})
                console.log(' A user disconnected');
            }
        }
    });
});

httpServer.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ${PORT}`);
});
