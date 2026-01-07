const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining
    socket.on('join', (username) => {
        users.set(socket.id, username);
        socket.broadcast.emit('user joined', username);
        
        // Send current users list
        io.emit('users update', Array.from(users.values()));
        
        console.log(`${username} joined the chat`);
    });

    // Handle messages
    socket.on('chat message', (data) => {
        const username = users.get(socket.id);
        if (username) {
            const messageData = {
                username,
                message: data.message,
                timestamp: new Date().toLocaleTimeString()
            };
            io.emit('chat message', messageData);
        }
    });

    // Handle typing indicator
    socket.on('typing', (isTyping) => {
        const username = users.get(socket.id);
        if (username) {
            socket.broadcast.emit('typing', { username, isTyping });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            users.delete(socket.id);
            socket.broadcast.emit('user left', username);
            io.emit('users update', Array.from(users.values()));
            console.log(`${username} left the chat`);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Chat server running on http://localhost:${PORT}`);
});