class QueueLess {
    constructor() {
        this.appointments = JSON.parse(localStorage.getItem('queueless_appointments')) || [];
        this.currentView = 'patient';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateTimeSlots();
        this.updateDisplay();
        this.setMinDate();
    }

    setupEventListeners() {
        // View toggle
        document.getElementById('userMode').addEventListener('click', () => this.switchView('patient'));
        document.getElementById('adminMode').addEventListener('click', () => this.switchView('admin'));

        // Booking form
        document.getElementById('bookingForm').addEventListener('submit', (e) => this.handleBooking(e));
        
        // Date change updates time slots
        document.getElementById('appointmentDate').addEventListener('change', () => this.updateTimeSlots());
    }

    switchView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.role-toggle button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(view === 'patient' ? 'userMode' : 'adminMode').classList.add('active');
        
        // Update view display
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(view === 'patient' ? 'patientView' : 'adminView').classList.add('active');
        
        this.updateDisplay();
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentDate').min = today;
    }

    generateTimeSlots() {
        const timeSlotSelect = document.getElementById('timeSlot');
        const slots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
        ];

        timeSlotSelect.innerHTML = '<option value="">Select Time</option>';
        slots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot;
            option.textContent = slot;
            timeSlotSelect.appendChild(option);
        });
    }

    updateTimeSlots() {
        const selectedDate = document.getElementById('appointmentDate').value;
        const timeSlotSelect = document.getElementById('timeSlot');
        
        if (!selectedDate) return;

        // Get booked slots for selected date
        const bookedSlots = this.appointments
            .filter(apt => apt.date === selectedDate && apt.status !== 'cancelled')
            .map(apt => apt.time);

        // Disable booked slots
        Array.from(timeSlotSelect.options).forEach(option => {
            if (option.value && bookedSlots.includes(option.value)) {
                option.disabled = true;
                option.textContent = `${option.value} (Booked)`;
            } else if (option.value) {
                option.disabled = false;
                option.textContent = option.value;
            }
        });
    }

    handleBooking(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const appointment = {
            id: Date.now().toString(),
            name: document.getElementById('patientName').value,
            phone: document.getElementById('patientPhone').value,
            service: document.getElementById('serviceType').value,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('timeSlot').value,
            status: 'waiting',
            bookedAt: new Date().toISOString()
        };

        // Validate slot availability
        const isSlotTaken = this.appointments.some(apt => 
            apt.date === appointment.date && 
            apt.time === appointment.time && 
            apt.status !== 'cancelled'
        );

        if (isSlotTaken) {
            alert('This time slot is already booked. Please select another time.');
            return;
        }

        this.appointments.push(appointment);
        this.saveData();
        this.updateDisplay();
        
        // Reset form
        e.target.reset();
        this.updateTimeSlots();
        
        alert(`Appointment booked successfully!\nReference ID: ${appointment.id}\nDate: ${appointment.date} at ${appointment.time}`);
    }

    updateDisplay() {
        if (this.currentView === 'patient') {
            this.updateQueueDisplay();
        } else {
            this.updateAdminDisplay();
        }
    }

    updateQueueDisplay() {
        const queueDisplay = document.getElementById('queueDisplay');
        const today = new Date().toISOString().split('T')[0];
        
        const todayAppointments = this.appointments
            .filter(apt => apt.date === today && apt.status !== 'cancelled')
            .sort((a, b) => a.time.localeCompare(b.time));

        if (todayAppointments.length === 0) {
            queueDisplay.innerHTML = '<p>No appointments scheduled for today.</p>';
            return;
        }

        let currentIndex = todayAppointments.findIndex(apt => apt.status === 'waiting');
        if (currentIndex === -1) currentIndex = 0;

        queueDisplay.innerHTML = todayAppointments.map((apt, index) => `
            <div class="queue-item ${index === currentIndex ? 'current' : ''}">
                <div>
                    <div class="queue-number">Queue #${index + 1}</div>
                    <div>${apt.service} - ${apt.time}</div>
                </div>
                <div class="status ${apt.status}">${apt.status.toUpperCase()}</div>
            </div>
        `).join('');
    }

    updateAdminDisplay() {
        this.updateStats();
        this.updateAppointmentsList();
    }

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = this.appointments.filter(apt => apt.date === today);
        
        document.getElementById('todayCount').textContent = todayAppointments.length;
        document.getElementById('queueCount').textContent = 
            todayAppointments.filter(apt => apt.status === 'waiting').length;
        document.getElementById('completedCount').textContent = 
            todayAppointments.filter(apt => apt.status === 'completed').length;
    }

    updateAppointmentsList() {
        const appointmentsList = document.getElementById('appointmentsList');
        const today = new Date().toISOString().split('T')[0];
        
        const todayAppointments = this.appointments
            .filter(apt => apt.date === today)
            .sort((a, b) => a.time.localeCompare(b.time));

        if (todayAppointments.length === 0) {
            appointmentsList.innerHTML = '<p>No appointments for today.</p>';
            return;
        }

        appointmentsList.innerHTML = todayAppointments.map(apt => `
            <div class="appointment-item">
                <div class="appointment-info">
                    <h4>${apt.name} - ${apt.phone}</h4>
                    <p>${apt.service} | ${apt.time} | ID: ${apt.id}</p>
                </div>
                <div class="appointment-actions">
                    ${apt.status === 'waiting' ? `
                        <button class="btn btn-success" onclick="queueless.updateAppointmentStatus('${apt.id}', 'completed')">
                            Complete
                        </button>
                    ` : ''}
                    ${apt.status !== 'cancelled' ? `
                        <button class="btn btn-danger" onclick="queueless.updateAppointmentStatus('${apt.id}', 'cancelled')">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    updateAppointmentStatus(id, status) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (appointment) {
            appointment.status = status;
            this.saveData();
            this.updateDisplay();
        }
    }

    saveData() {
        localStorage.setItem('queueless_appointments', JSON.stringify(this.appointments));
    }
}

// Initialize the application
const queueless = new QueueLess();