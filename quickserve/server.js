const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage (replace with database in production)
let tickets = [];
let ticketCounter = 1;

// API Routes
app.get('/api/tickets', (req, res) => {
    const { status, priority } = req.query;
    let filtered = tickets;
    
    if (status) filtered = filtered.filter(t => t.status === status);
    if (priority) filtered = filtered.filter(t => t.priority === priority);
    
    res.json(filtered);
});

app.post('/api/tickets', (req, res) => {
    const { title, description, priority, customerEmail } = req.body;
    
    if (!title || !description || !customerEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const ticket = {
        id: ticketCounter++,
        title,
        description,
        priority: priority || 'medium',
        customerEmail,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: []
    };
    
    tickets.push(ticket);
    res.status(201).json(ticket);
});

app.put('/api/tickets/:id', (req, res) => {
    const ticketId = parseInt(req.params.id);
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const { status, priority, response } = req.body;
    
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (response) {
        ticket.responses.push({
            message: response,
            timestamp: new Date().toISOString(),
            type: 'staff'
        });
    }
    
    ticket.updatedAt = new Date().toISOString();
    res.json(ticket);
});

app.delete('/api/tickets/:id', (req, res) => {
    const ticketId = parseInt(req.params.id);
    const index = tickets.findIndex(t => t.id === ticketId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Ticket not found' });
    }
    
    tickets.splice(index, 1);
    res.status(204).send();
});

// Analytics endpoint
app.get('/api/analytics', (req, res) => {
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        closed: tickets.filter(t => t.status === 'closed').length,
        byPriority: {
            high: tickets.filter(t => t.priority === 'high').length,
            medium: tickets.filter(t => t.priority === 'medium').length,
            low: tickets.filter(t => t.priority === 'low').length
        }
    };
    res.json(stats);
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`QuickServe running on http://localhost:${PORT}`);
});