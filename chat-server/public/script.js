const socket = io();

let username = '';
let typingTimer;

// DOM elements
const usernameModal = document.getElementById('username-modal');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const usernameDisplay = document.getElementById('username-display');
const userCount = document.getElementById('user-count');
const usersList = document.getElementById('users-list');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

// Join chat
joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

function joinChat() {
    const inputUsername = usernameInput.value.trim();
    if (inputUsername) {
        username = inputUsername;
        socket.emit('join', username);
        usernameModal.style.display = 'none';
        usernameDisplay.textContent = `Welcome, ${username}!`;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// Send message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    } else {
        handleTyping();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chat message', { message });
        messageInput.value = '';
        socket.emit('typing', false);
    }
}

function handleTyping() {
    socket.emit('typing', true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit('typing', false);
    }, 1000);
}

// Socket event listeners
socket.on('chat message', (data) => {
    displayMessage(data);
});

socket.on('user joined', (joinedUsername) => {
    displaySystemMessage(`${joinedUsername} joined the chat`);
});

socket.on('user left', (leftUsername) => {
    displaySystemMessage(`${leftUsername} left the chat`);
});

socket.on('users update', (users) => {
    updateUsersList(users);
    userCount.textContent = `${users.length} user${users.length !== 1 ? 's' : ''} online`;
});

socket.on('typing', (data) => {
    if (data.isTyping) {
        typingIndicator.textContent = `${data.username} is typing...`;
    } else {
        typingIndicator.textContent = '';
    }
});

function displayMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.username === username ? 'own' : 'other'}`;
    
    messageDiv.innerHTML = `
        <div class="message-header">${data.username} • ${data.timestamp}</div>
        <div>${data.message}</div>
    `;
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

function displaySystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

function updateUsersList(users) {
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        if (user === username) {
            li.style.fontWeight = 'bold';
            li.style.color = '#667eea';
        }
        usersList.appendChild(li);
    });
}