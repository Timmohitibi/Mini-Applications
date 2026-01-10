class USSDire {
    constructor() {
        this.sessions = JSON.parse(localStorage.getItem('ussdire_sessions')) || [];
        this.menuStructure = JSON.parse(localStorage.getItem('ussdire_menus')) || this.getDefaultMenus();
        this.currentSession = null;
        this.currentTab = 'menus';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.loadMenuTree();
        this.updateAnalytics();
        this.loadSessions();
        setInterval(() => this.updateTime(), 1000);
    }

    getDefaultMenus() {
        return {
            'main': {
                id: 'main',
                title: 'Main Menu',
                content: `Welcome to USSDire Services

1. Account Balance
2. Mobile Money
3. Airtime & Data
4. Bill Payments
5. Customer Service
0. Exit

Enter your choice:`,
                type: 'menu',
                options: {
                    '1': 'balance',
                    '2': 'mobile_money',
                    '3': 'airtime',
                    '4': 'bills',
                    '5': 'support',
                    '0': 'exit'
                }
            },
            'balance': {
                id: 'balance',
                title: 'Account Balance',
                content: `Account Balance Inquiry

Your current balance is: $125.50
Available credit: $75.25
Last transaction: -$5.00 (Data bundle)

1. Mini Statement
2. Full Statement
9. Back to Main Menu
0. Exit`,
                type: 'menu',
                options: {
                    '1': 'mini_statement',
                    '2': 'full_statement',
                    '9': 'main',
                    '0': 'exit'
                }
            },
            'mobile_money': {
                id: 'mobile_money',
                title: 'Mobile Money',
                content: `Mobile Money Services

1. Send Money
2. Withdraw Cash
3. Buy Goods
4. Pay Bills
5. Check Balance
9. Back to Main Menu
0. Exit`,
                type: 'menu',
                options: {
                    '1': 'send_money',
                    '2': 'withdraw',
                    '3': 'buy_goods',
                    '4': 'pay_bills',
                    '5': 'mm_balance',
                    '9': 'main',
                    '0': 'exit'
                }
            },
            'airtime': {
                id: 'airtime',
                title: 'Airtime & Data',
                content: `Airtime & Data Services

1. Buy Airtime
2. Data Bundles
3. International Bundles
4. Gift Airtime
9. Back to Main Menu
0. Exit`,
                type: 'menu',
                options: {
                    '1': 'buy_airtime',
                    '2': 'data_bundles',
                    '3': 'international',
                    '4': 'gift_airtime',
                    '9': 'main',
                    '0': 'exit'
                }
            },
            'send_money': {
                id: 'send_money',
                title: 'Send Money',
                content: `Send Money

Enter recipient phone number:`,
                type: 'input',
                nextStep: 'send_amount',
                validation: 'phone'
            },
            'send_amount': {
                id: 'send_amount',
                title: 'Send Amount',
                content: `Send Money

Recipient: {phone}
Enter amount to send:`,
                type: 'input',
                nextStep: 'send_confirm',
                validation: 'amount'
            },
            'send_confirm': {
                id: 'send_confirm',
                title: 'Confirm Transaction',
                content: `Confirm Send Money

Recipient: {phone}
Amount: ${amount}
Fee: $0.50
Total: ${total}

1. Confirm
2. Cancel`,
                type: 'menu',
                options: {
                    '1': 'send_success',
                    '2': 'mobile_money'
                }
            },
            'send_success': {
                id: 'send_success',
                title: 'Transaction Successful',
                content: `Transaction Successful!

Reference: TXN{ref}
Amount sent: ${amount}
Recipient: {phone}
New balance: ${balance}

Thank you for using our service.`,
                type: 'action',
                autoExit: true
            },
            'buy_airtime': {
                id: 'buy_airtime',
                title: 'Buy Airtime',
                content: `Buy Airtime

Select amount:
1. $5
2. $10
3. $20
4. $50
5. Other amount
9. Back
0. Exit`,
                type: 'menu',
                options: {
                    '1': 'airtime_5',
                    '2': 'airtime_10',
                    '3': 'airtime_20',
                    '4': 'airtime_50',
                    '5': 'airtime_custom',
                    '9': 'airtime',
                    '0': 'exit'
                }
            },
            'airtime_5': {
                id: 'airtime_5',
                title: 'Airtime Purchase',
                content: `Airtime purchased successfully!

Amount: $5.00
Reference: AIR{ref}
New balance: ${balance}

Thank you!`,
                type: 'action',
                autoExit: true
            },
            'exit': {
                id: 'exit',
                title: 'Session Ended',
                content: 'Thank you for using USSDire services. Session ended.',
                type: 'action',
                autoExit: true
            }
        };
    }

    setupEventListeners() {
        // USSD Input handling
        document.getElementById('sendBtn').addEventListener('click', () => this.handleUSSDInput());
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelSession());
        document.getElementById('ussdInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUSSDInput();
        });

        // Keypad
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', (e) => this.handleKeypadInput(e.target.dataset.key));
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Quick actions
        document.getElementById('dialBtn').addEventListener('click', () => this.startSession('*123#'));
        document.getElementById('balanceBtn').addEventListener('click', () => this.startSession('*124#'));
        document.getElementById('rechargeBtn').addEventListener('click', () => this.startSession('*125#'));
        document.getElementById('helpBtn').addEventListener('click', () => this.startSession('*100#'));

        // Menu management
        document.getElementById('addMenuBtn').addEventListener('click', () => this.openMenuModal());
        document.getElementById('resetMenuBtn').addEventListener('click', () => this.resetMenus());
        document.getElementById('menuForm').addEventListener('submit', (e) => this.handleMenuSubmit(e));

        // Modal controls
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('sessionFilter').addEventListener('change', () => this.filterSessions());
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('currentTime').textContent = timeString;
    }

    startSession(code) {
        this.currentSession = {
            id: Date.now().toString(),
            code: code,
            startTime: new Date().toISOString(),
            currentMenu: 'main',
            history: [],
            data: {},
            status: 'active'
        };

        document.getElementById('sessionId').textContent = code;
        this.navigateToMenu('main');
        this.saveSession();
    }

    handleUSSDInput() {
        const input = document.getElementById('ussdInput').value.trim();
        if (!input) return;

        if (!this.currentSession) {
            if (input.startsWith('*') && input.endsWith('#')) {
                this.startSession(input);
            } else {
                this.showMessage('Please dial a USSD code (e.g., *123#)');
            }
            return;
        }

        this.processInput(input);
        document.getElementById('ussdInput').value = '';
    }

    handleKeypadInput(key) {
        const input = document.getElementById('ussdInput');
        input.value += key;
        input.focus();
    }

    processInput(input) {
        const currentMenu = this.menuStructure[this.currentSession.currentMenu];
        
        this.currentSession.history.push({
            menu: this.currentSession.currentMenu,
            input: input,
            timestamp: new Date().toISOString()
        });

        if (currentMenu.type === 'menu') {
            const nextMenuId = currentMenu.options[input];
            if (nextMenuId) {
                this.navigateToMenu(nextMenuId);
            } else {
                this.showMessage('Invalid option. Please try again.');
            }
        } else if (currentMenu.type === 'input') {
            if (this.validateInput(input, currentMenu.validation)) {
                this.currentSession.data[currentMenu.id] = input;
                if (currentMenu.nextStep) {
                    this.navigateToMenu(currentMenu.nextStep);
                }
            } else {
                this.showMessage('Invalid input. Please try again.');
            }
        }

        this.saveSession();
    }

    navigateToMenu(menuId) {
        const menu = this.menuStructure[menuId];
        if (!menu) return;

        this.currentSession.currentMenu = menuId;
        
        let content = menu.content;
        
        // Replace placeholders with session data
        Object.keys(this.currentSession.data).forEach(key => {
            const value = this.currentSession.data[key];
            content = content.replace(new RegExp(`{${key}}`, 'g'), value);
        });

        // Generate dynamic values
        content = content.replace(/{ref}/g, Math.random().toString(36).substr(2, 8).toUpperCase());
        content = content.replace(/\${amount}/g, this.currentSession.data.send_amount || '0.00');
        content = content.replace(/\${total}/g, (parseFloat(this.currentSession.data.send_amount || 0) + 0.50).toFixed(2));
        content = content.replace(/\${balance}/g, (125.50 - parseFloat(this.currentSession.data.send_amount || 0)).toFixed(2));

        this.showMessage(content);

        if (menu.type === 'action' && menu.autoExit) {
            setTimeout(() => this.endSession('completed'), 3000);
        }
    }

    validateInput(input, validation) {
        switch (validation) {
            case 'phone':
                return /^\+?[\d\s-()]{10,15}$/.test(input);
            case 'amount':
                return /^\d+(\.\d{1,2})?$/.test(input) && parseFloat(input) > 0;
            default:
                return true;
        }
    }

    showMessage(message) {
        const display = document.getElementById('ussdDisplay');
        display.innerHTML = `<div class="welcome-message">${message}</div>`;
    }

    cancelSession() {
        if (this.currentSession) {
            this.endSession('cancelled');
        } else {
            this.showMessage('No active session to cancel.');
        }
    }

    endSession(status) {
        if (this.currentSession) {
            this.currentSession.status = status;
            this.currentSession.endTime = new Date().toISOString();
            this.currentSession.duration = new Date(this.currentSession.endTime) - new Date(this.currentSession.startTime);
            
            this.sessions.push(this.currentSession);
            this.currentSession = null;
            
            document.getElementById('sessionId').textContent = 'No Session';
            this.showMessage('Session ended. Dial *123# to start a new session.');
            
            this.saveData();
            this.updateAnalytics();
            this.loadSessions();
        }
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
        if (tabName === 'analytics') this.updateAnalytics();
        if (tabName === 'sessions') this.loadSessions();
    }

    loadMenuTree() {
        const menuTree = document.getElementById('menuTree');
        const menus = Object.values(this.menuStructure);
        
        menuTree.innerHTML = menus.map(menu => `
            <div class="menu-item">
                <div class="menu-info">
                    <h4>${menu.title} (${menu.id})</h4>
                    <p>Type: ${menu.type} | ${menu.content.substring(0, 50)}...</p>
                </div>
                <div class="menu-actions">
                    <button class="btn btn-sm" onclick="ussdire.editMenu('${menu.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="ussdire.deleteMenu('${menu.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateAnalytics() {
        const totalSessions = this.sessions.length;
        const completedSessions = this.sessions.filter(s => s.status === 'completed').length;
        
        // Calculate most used service
        const serviceUsage = {};
        this.sessions.forEach(session => {
            session.history.forEach(entry => {
                serviceUsage[entry.menu] = (serviceUsage[entry.menu] || 0) + 1;
            });
        });
        
        const mostUsed = Object.keys(serviceUsage).reduce((a, b) => 
            serviceUsage[a] > serviceUsage[b] ? a : b, 'None');
        
        // Calculate average session time
        const avgTime = this.sessions.length > 0 ? 
            this.sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / this.sessions.length / 1000 : 0;

        document.getElementById('totalSessions').textContent = totalSessions;
        document.getElementById('completedSessions').textContent = completedSessions;
        document.getElementById('popularService').textContent = this.menuStructure[mostUsed]?.title || 'None';
        document.getElementById('avgSessionTime').textContent = `${Math.round(avgTime)}s`;

        // Update usage chart
        this.updateUsageChart(serviceUsage);
    }

    updateUsageChart(serviceUsage) {
        const chartContainer = document.getElementById('usageChart');
        const maxUsage = Math.max(...Object.values(serviceUsage), 1);
        
        chartContainer.innerHTML = Object.entries(serviceUsage)
            .slice(0, 5)
            .map(([menuId, count]) => {
                const height = (count / maxUsage) * 100;
                const menuTitle = this.menuStructure[menuId]?.title || menuId;
                return `
                    <div class="chart-bar" style="height: ${height}%">
                        <div class="chart-label">${menuTitle}</div>
                    </div>
                `;
            }).join('');
    }

    loadSessions() {
        const sessionsList = document.getElementById('sessionsList');
        const filter = document.getElementById('sessionFilter').value;
        
        let filteredSessions = [...this.sessions];
        if (filter !== 'all') {
            filteredSessions = this.sessions.filter(s => s.status === filter);
        }
        
        if (this.currentSession && (filter === 'all' || filter === 'active')) {
            filteredSessions.unshift({...this.currentSession, status: 'active'});
        }

        sessionsList.innerHTML = filteredSessions.map(session => `
            <div class="session-item">
                <div class="session-header">
                    <span class="session-id">${session.code} - ${session.id}</span>
                    <span class="session-status ${session.status}">${session.status.toUpperCase()}</span>
                </div>
                <div class="session-details">
                    Started: ${new Date(session.startTime).toLocaleString()} | 
                    Menu: ${this.menuStructure[session.currentMenu]?.title || session.currentMenu} |
                    Steps: ${session.history.length}
                </div>
            </div>
        `).join('');
    }

    filterSessions() {
        this.loadSessions();
    }

    openMenuModal(menuId = null) {
        const modal = document.getElementById('menuModal');
        const form = document.getElementById('menuForm');
        
        if (menuId) {
            const menu = this.menuStructure[menuId];
            document.getElementById('menuId').value = menuId;
            document.getElementById('menuTitle').value = menu.title;
            document.getElementById('menuContent').value = menu.content;
            document.getElementById('menuType').value = menu.type;
        } else {
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('menuModal').style.display = 'none';
    }

    handleMenuSubmit(e) {
        e.preventDefault();
        
        const menuId = document.getElementById('menuId').value || Date.now().toString();
        const title = document.getElementById('menuTitle').value;
        const content = document.getElementById('menuContent').value;
        const type = document.getElementById('menuType').value;
        
        this.menuStructure[menuId] = {
            id: menuId,
            title: title,
            content: content,
            type: type,
            options: type === 'menu' ? {} : undefined
        };
        
        this.saveData();
        this.loadMenuTree();
        this.closeModal();
    }

    editMenu(menuId) {
        this.openMenuModal(menuId);
    }

    deleteMenu(menuId) {
        if (confirm('Are you sure you want to delete this menu item?')) {
            delete this.menuStructure[menuId];
            this.saveData();
            this.loadMenuTree();
        }
    }

    resetMenus() {
        if (confirm('Reset to default menu structure? This will delete all custom menus.')) {
            this.menuStructure = this.getDefaultMenus();
            this.saveData();
            this.loadMenuTree();
        }
    }

    saveSession() {
        if (this.currentSession) {
            localStorage.setItem('ussdire_current_session', JSON.stringify(this.currentSession));
        }
    }

    saveData() {
        localStorage.setItem('ussdire_sessions', JSON.stringify(this.sessions));
        localStorage.setItem('ussdire_menus', JSON.stringify(this.menuStructure));
    }
}

// Initialize the application
const ussdire = new USSDire();

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('menuModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}