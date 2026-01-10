class PulseSMS {
    constructor() {
        this.templates = JSON.parse(localStorage.getItem('pulsesms_templates')) || this.getDefaultTemplates();
        this.contacts = JSON.parse(localStorage.getItem('pulsesms_contacts')) || [];
        this.campaigns = JSON.parse(localStorage.getItem('pulsesms_campaigns')) || [];
        this.currentTab = 'compose';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTemplates();
        this.loadContacts();
        this.updatePreview();
        this.updateAnalytics();
        this.setMinDateTime();
    }

    getDefaultTemplates() {
        return [
            { id: '1', name: 'Appointment Reminder', content: 'Hi {name}, this is a reminder for your appointment on {date} at {time}. Please confirm or reschedule if needed.' },
            { id: '2', name: 'Payment Due', content: 'Dear {name}, your payment of ${amount} is due on {date}. Please make payment to avoid late fees.' },
            { id: '3', name: 'Welcome Message', content: 'Welcome to our service, {name}! We\'re excited to have you on board. Contact us anytime for support.' },
            { id: '4', name: 'Order Confirmation', content: 'Your order #{order_id} has been confirmed. Expected delivery: {date}. Track your order at {link}' }
        ];
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Form submissions
        document.getElementById('smsForm').addEventListener('submit', (e) => this.handleSMSSubmit(e));
        document.getElementById('templateForm').addEventListener('submit', (e) => this.handleTemplateSubmit(e));
        document.getElementById('contactForm').addEventListener('submit', (e) => this.handleContactSubmit(e));

        // Real-time updates
        document.getElementById('messageContent').addEventListener('input', () => this.updatePreview());
        document.getElementById('recipients').addEventListener('input', () => this.updateRecipientCount());
        document.getElementById('templateSelect').addEventListener('change', (e) => this.loadTemplate(e.target.value));

        // Radio button changes
        document.querySelectorAll('input[name="recipientType"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleRecipientType());
        });

        document.querySelectorAll('input[name="scheduleType"]').forEach(radio => {
            radio.addEventListener('change', () => this.toggleScheduleType());
        });

        // Modal controls
        document.getElementById('addTemplateBtn').addEventListener('click', () => this.openModal('templateModal'));
        document.getElementById('addContactBtn').addEventListener('click', () => this.openModal('contactModal'));

        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal').id));
        });

        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => this.filterHistory());
        document.getElementById('dateFilter').addEventListener('change', () => this.filterHistory());
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        // Load tab-specific data
        if (tabName === 'history') this.loadHistory();
        if (tabName === 'analytics') this.updateAnalytics();
    }

    setMinDateTime() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5); // Minimum 5 minutes from now
        document.getElementById('scheduleTime').min = now.toISOString().slice(0, 16);
    }

    toggleRecipientType() {
        const type = document.querySelector('input[name="recipientType"]:checked').value;
        const recipientsTextarea = document.getElementById('recipients');
        const contactGroupSelect = document.getElementById('contactGroup');

        if (type === 'manual') {
            recipientsTextarea.style.display = 'block';
            contactGroupSelect.style.display = 'none';
        } else {
            recipientsTextarea.style.display = 'none';
            contactGroupSelect.style.display = 'block';
            this.loadContactGroups();
        }
        this.updateRecipientCount();
    }

    toggleScheduleType() {
        const type = document.querySelector('input[name="scheduleType"]:checked').value;
        const scheduleInputs = document.getElementById('scheduleInputs');
        scheduleInputs.style.display = type === 'later' ? 'block' : 'none';
    }

    updatePreview() {
        const content = document.getElementById('messageContent').value;
        const previewContent = document.getElementById('previewContent');
        const charCount = document.getElementById('charCount');

        previewContent.textContent = content || 'Your message will appear here...';
        charCount.textContent = content.length;

        if (content.length > 160) {
            charCount.style.color = '#dc3545';
        } else {
            charCount.style.color = '#666';
        }
    }

    updateRecipientCount() {
        const type = document.querySelector('input[name="recipientType"]:checked').value;
        let count = 0;

        if (type === 'manual') {
            const recipients = document.getElementById('recipients').value.trim();
            count = recipients ? recipients.split('\n').filter(line => line.trim()).length : 0;
        } else {
            const groupName = document.getElementById('contactGroup').value;
            count = this.contacts.filter(contact => contact.group === groupName).length;
        }

        document.getElementById('recipientCount').textContent = count;
        document.getElementById('estimatedCost').textContent = `$${(count * 0.05).toFixed(2)}`;
    }

    loadTemplate(templateId) {
        if (!templateId) return;
        
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            document.getElementById('messageContent').value = template.content;
            this.updatePreview();
        }
    }

    loadTemplates() {
        const templateSelect = document.getElementById('templateSelect');
        const templatesList = document.getElementById('templatesList');

        // Update select dropdown
        templateSelect.innerHTML = '<option value="">Select Template (Optional)</option>';
        this.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            templateSelect.appendChild(option);
        });

        // Update templates grid
        templatesList.innerHTML = this.templates.map(template => `
            <div class="template-card">
                <h4>${template.name}</h4>
                <p>${template.content.substring(0, 100)}${template.content.length > 100 ? '...' : ''}</p>
                <div class="template-actions">
                    <button class="btn btn-primary" onclick="pulseSMS.useTemplate('${template.id}')">Use</button>
                    <button class="btn btn-danger" onclick="pulseSMS.deleteTemplate('${template.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    loadContacts() {
        const contactsList = document.getElementById('contactsList');
        
        if (this.contacts.length === 0) {
            contactsList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No contacts added yet.</p>';
            return;
        }

        contactsList.innerHTML = this.contacts.map(contact => `
            <div class="contact-item">
                <div class="contact-info">
                    <h4>${contact.name}</h4>
                    <p>${contact.phone} ${contact.group ? `• ${contact.group}` : ''}</p>
                </div>
                <div class="contact-actions">
                    <button class="btn btn-danger" onclick="pulseSMS.deleteContact('${contact.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    loadContactGroups() {
        const groups = [...new Set(this.contacts.map(c => c.group).filter(g => g))];
        const select = document.getElementById('contactGroup');
        
        select.innerHTML = '<option value="">Select Contact Group</option>';
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = `${group} (${this.contacts.filter(c => c.group === group).length} contacts)`;
            select.appendChild(option);
        });
    }

    loadHistory() {
        const historyList = document.getElementById('campaignHistory');
        
        if (this.campaigns.length === 0) {
            historyList.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">No campaigns sent yet.</p>';
            return;
        }

        const sortedCampaigns = [...this.campaigns].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        historyList.innerHTML = sortedCampaigns.map(campaign => `
            <div class="history-item">
                <div class="history-info">
                    <h4>${campaign.message.substring(0, 50)}${campaign.message.length > 50 ? '...' : ''}</h4>
                    <p>${campaign.recipientCount} recipients • ${new Date(campaign.createdAt).toLocaleString()}</p>
                </div>
                <div class="status ${campaign.status}">${campaign.status.toUpperCase()}</div>
            </div>
        `).join('');
    }

    filterHistory() {
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        let filtered = [...this.campaigns];
        
        if (statusFilter) {
            filtered = filtered.filter(c => c.status === statusFilter);
        }
        
        if (dateFilter) {
            const filterDate = new Date(dateFilter).toDateString();
            filtered = filtered.filter(c => new Date(c.createdAt).toDateString() === filterDate);
        }
        
        const historyList = document.getElementById('campaignHistory');
        historyList.innerHTML = filtered.map(campaign => `
            <div class="history-item">
                <div class="history-info">
                    <h4>${campaign.message.substring(0, 50)}${campaign.message.length > 50 ? '...' : ''}</h4>
                    <p>${campaign.recipientCount} recipients • ${new Date(campaign.createdAt).toLocaleString()}</p>
                </div>
                <div class="status ${campaign.status}">${campaign.status.toUpperCase()}</div>
            </div>
        `).join('');
    }

    updateAnalytics() {
        const totalSent = this.campaigns.reduce((sum, c) => sum + c.recipientCount, 0);
        const successfulCampaigns = this.campaigns.filter(c => c.status === 'sent').length;
        const successRate = this.campaigns.length > 0 ? (successfulCampaigns / this.campaigns.length * 100).toFixed(1) : 0;
        const totalCost = this.campaigns.reduce((sum, c) => sum + (c.recipientCount * 0.05), 0);
        
        const thisMonth = new Date().getMonth();
        const monthlyCount = this.campaigns.filter(c => new Date(c.createdAt).getMonth() === thisMonth).length;

        document.getElementById('totalSent').textContent = totalSent;
        document.getElementById('successRate').textContent = `${successRate}%`;
        document.getElementById('totalCost').textContent = `$${totalCost.toFixed(2)}`;
        document.getElementById('monthlyCount').textContent = monthlyCount;
    }

    handleSMSSubmit(e) {
        e.preventDefault();
        
        const message = document.getElementById('messageContent').value.trim();
        if (!message) {
            alert('Please enter a message');
            return;
        }

        const type = document.querySelector('input[name="recipientType"]:checked').value;
        const scheduleType = document.querySelector('input[name="scheduleType"]:checked').value;
        
        let recipients = [];
        if (type === 'manual') {
            const recipientText = document.getElementById('recipients').value.trim();
            recipients = recipientText.split('\n').filter(line => line.trim());
        } else {
            const groupName = document.getElementById('contactGroup').value;
            recipients = this.contacts.filter(c => c.group === groupName).map(c => c.phone);
        }

        if (recipients.length === 0) {
            alert('Please add recipients');
            return;
        }

        const campaign = {
            id: Date.now().toString(),
            message: message,
            recipients: recipients,
            recipientCount: recipients.length,
            status: scheduleType === 'now' ? 'sent' : 'scheduled',
            scheduledFor: scheduleType === 'later' ? document.getElementById('scheduleTime').value : null,
            createdAt: new Date().toISOString(),
            cost: recipients.length * 0.05
        };

        this.campaigns.push(campaign);
        this.saveData();
        
        // Reset form
        document.getElementById('smsForm').reset();
        this.updatePreview();
        this.updateRecipientCount();
        
        // Show success message
        const status = scheduleType === 'now' ? 'sent' : 'scheduled';
        alert(`Campaign ${status} successfully!\nRecipients: ${recipients.length}\nCost: $${campaign.cost.toFixed(2)}`);
        
        // Switch to history tab
        this.switchTab('history');
    }

    handleTemplateSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('templateName').value.trim();
        const content = document.getElementById('templateContent').value.trim();
        
        if (!name || !content) {
            alert('Please fill in all fields');
            return;
        }

        const template = {
            id: Date.now().toString(),
            name: name,
            content: content
        };

        this.templates.push(template);
        this.saveData();
        this.loadTemplates();
        this.closeModal('templateModal');
        
        // Reset form
        document.getElementById('templateForm').reset();
    }

    handleContactSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('contactName').value.trim();
        const phone = document.getElementById('contactPhone').value.trim();
        const group = document.getElementById('contactGroup').value.trim();
        
        if (!name || !phone) {
            alert('Please fill in name and phone number');
            return;
        }

        const contact = {
            id: Date.now().toString(),
            name: name,
            phone: phone,
            group: group || 'Default'
        };

        this.contacts.push(contact);
        this.saveData();
        this.loadContacts();
        this.closeModal('contactModal');
        
        // Reset form
        document.getElementById('contactForm').reset();
    }

    useTemplate(templateId) {
        this.loadTemplate(templateId);
        this.switchTab('compose');
    }

    deleteTemplate(templateId) {
        if (confirm('Are you sure you want to delete this template?')) {
            this.templates = this.templates.filter(t => t.id !== templateId);
            this.saveData();
            this.loadTemplates();
        }
    }

    deleteContact(contactId) {
        if (confirm('Are you sure you want to delete this contact?')) {
            this.contacts = this.contacts.filter(c => c.id !== contactId);
            this.saveData();
            this.loadContacts();
        }
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    saveData() {
        localStorage.setItem('pulsesms_templates', JSON.stringify(this.templates));
        localStorage.setItem('pulsesms_contacts', JSON.stringify(this.contacts));
        localStorage.setItem('pulsesms_campaigns', JSON.stringify(this.campaigns));
    }
}

// Initialize the application
const pulseSMS = new PulseSMS();

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}