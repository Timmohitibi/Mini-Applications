class QuickServe {
    constructor() {
        this.currentView = 'customer';
        this.currentTicket = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStats();
    }

    setupEventListeners() {
        // View toggle
        document.getElementById('customerBtn').addEventListener('click', () => this.switchView('customer'));
        document.getElementById('staffBtn').addEventListener('click', () => this.switchView('staff'));

        // Forms
        document.getElementById('ticketForm').addEventListener('submit', (e) => this.submitTicket(e));
        document.getElementById('checkStatusBtn').addEventListener('click', () => this.checkStatus());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadTickets());
        document.getElementById('updateTicketBtn').addEventListener('click', () => this.updateTicket());

        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => this.loadTickets());
        document.getElementById('priorityFilter').addEventListener('change', () => this.loadTickets());

        // Modal
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
    }

    switchView(view) {
        this.currentView = view;
        
        // Update buttons
        document.querySelectorAll('.view-toggle button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(view === 'customer' ? 'customerBtn' : 'staffBtn').classList.add('active');
        
        // Update views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(view === 'customer' ? 'customerView' : 'staffView').classList.add('active');
        
        if (view === 'staff') {
            this.loadStats();
            this.loadTickets();
        }
    }

    async submitTicket(e) {
        e.preventDefault();
        
        const ticketData = {
            title: document.getElementById('ticketTitle').value,
            description: document.getElementById('ticketDescription').value,
            priority: document.getElementById('ticketPriority').value,
            customerEmail: document.getElementById('customerEmail').value
        };

        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticketData)
            });

            if (response.ok) {
                const ticket = await response.json();
                alert(`Ticket submitted successfully!\nTicket ID: #${ticket.id}\nWe'll contact you at ${ticket.customerEmail}`);
                document.getElementById('ticketForm').reset();
            } else {
                throw new Error('Failed to submit ticket');
            }
        } catch (error) {
            alert('Error submitting ticket. Please try again.');
        }
    }

    async checkStatus() {
        const email = document.getElementById('statusEmail').value;
        if (!email) return;

        try {
            const response = await fetch('/api/tickets');
            const tickets = await response.json();
            const userTickets = tickets.filter(t => t.customerEmail === email);

            const container = document.getElementById('customerTickets');
            if (userTickets.length === 0) {
                container.innerHTML = '<p>No tickets found for this email.</p>';
                return;
            }

            container.innerHTML = userTickets.map(ticket => `
                <div class="ticket-item">
                    <div class="ticket-title">#${ticket.id} - ${ticket.title}</div>
                    <div class="ticket-meta">
                        <span class="status ${ticket.status}">${ticket.status.toUpperCase()}</span>
                        <span class="priority ${ticket.priority}">${ticket.priority.toUpperCase()}</span>
                        <span>Created: ${new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="ticket-description">${ticket.description}</div>
                    ${ticket.responses.length > 0 ? `
                        <div class="responses">
                            ${ticket.responses.map(r => `
                                <div class="response">
                                    <div class="response-time">${new Date(r.timestamp).toLocaleString()}</div>
                                    <div>${r.message}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } catch (error) {
            alert('Error checking status. Please try again.');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/analytics');
            const stats = await response.json();

            document.getElementById('openCount').textContent = stats.open;
            document.getElementById('progressCount').textContent = stats.inProgress;
            document.getElementById('closedCount').textContent = stats.closed;
            document.getElementById('highPriorityCount').textContent = stats.byPriority.high;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadTickets() {
        const status = document.getElementById('statusFilter').value;
        const priority = document.getElementById('priorityFilter').value;
        
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);

        try {
            const response = await fetch(`/api/tickets?${params}`);
            const tickets = await response.json();

            const container = document.getElementById('ticketsList');
            if (tickets.length === 0) {
                container.innerHTML = '<p style="padding: 20px; text-align: center;">No tickets found.</p>';
                return;
            }

            container.innerHTML = tickets.map(ticket => `
                <div class="ticket-item" onclick="quickServe.openTicket(${ticket.id})">
                    <div class="ticket-header">
                        <div class="ticket-title">#${ticket.id} - ${ticket.title}</div>
                        <div>
                            <span class="status ${ticket.status}">${ticket.status.toUpperCase()}</span>
                            <span class="priority ${ticket.priority}">${ticket.priority.toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="ticket-meta">
                        <span>Customer: ${ticket.customerEmail}</span>
                        <span>Created: ${new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <span>Updated: ${new Date(ticket.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="ticket-description">${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    }

    async openTicket(ticketId) {
        try {
            const response = await fetch('/api/tickets');
            const tickets = await response.json();
            const ticket = tickets.find(t => t.id === ticketId);

            if (!ticket) return;

            this.currentTicket = ticket;
            document.getElementById('newStatus').value = ticket.status;

            const details = document.getElementById('ticketDetails');
            details.innerHTML = `
                <h3>#${ticket.id} - ${ticket.title}</h3>
                <div class="ticket-meta" style="margin: 10px 0;">
                    <span class="status ${ticket.status}">${ticket.status.toUpperCase()}</span>
                    <span class="priority ${ticket.priority}">${ticket.priority.toUpperCase()}</span>
                    <span>Customer: ${ticket.customerEmail}</span>
                </div>
                <p><strong>Description:</strong></p>
                <p>${ticket.description}</p>
                <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
                ${ticket.responses.length > 0 ? `
                    <div class="responses">
                        <h4>Responses:</h4>
                        ${ticket.responses.map(r => `
                            <div class="response">
                                <div class="response-time">${new Date(r.timestamp).toLocaleString()}</div>
                                <div>${r.message}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;

            document.getElementById('ticketModal').style.display = 'block';
        } catch (error) {
            console.error('Error opening ticket:', error);
        }
    }

    async updateTicket() {
        if (!this.currentTicket) return;

        const response = document.getElementById('responseText').value;
        const status = document.getElementById('newStatus').value;

        const updateData = { status };
        if (response.trim()) updateData.response = response;

        try {
            const res = await fetch(`/api/tickets/${this.currentTicket.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                this.closeModal();
                this.loadTickets();
                this.loadStats();
                document.getElementById('responseText').value = '';
            } else {
                throw new Error('Failed to update ticket');
            }
        } catch (error) {
            alert('Error updating ticket. Please try again.');
        }
    }

    closeModal() {
        document.getElementById('ticketModal').style.display = 'none';
        this.currentTicket = null;
    }
}

// Initialize the application
const quickServe = new QuickServe();

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('ticketModal');
    if (event.target === modal) {
        quickServe.closeModal();
    }
}