/* ==========================================================================
   DENTALAI OS - APPOINTMENTS CALENDAR (ENHANCED)
   Includes week date navigation, cell clicks, rescheduling, and doctor filtering.
   ========================================================================== */

import { store } from '../store.js';

export function renderAppointments(container) {
    let appointments = store.getAppointments();
    const patients = store.getPatients();
    const dentists = store.getClinicConfig()?.dentists || [];

    // Calendar state variables
    let currentWeekStart = new Date("2026-06-08T00:00:00"); // Base reference (Monday)
    let selectedDentistFilter = 'all'; // 'all', 'mercer', 'ross'
    let currentCalendarView = 'week'; // 'week', 'day'
    let selectedApptToEdit = null; // Appointment object if editing

    container.className = 'page-view appointments-layout';
    
    // Core structure
    container.innerHTML = `
        <!-- Left Calendar Section -->
        <div class="card calendar-card">
            <div class="calendar-header-row">
                <div class="calendar-navigation-controls">
                    <button class="header-action-btn" id="btn-prev-week"><i data-lucide="chevron-left"></i></button>
                    <h2 class="calendar-month-title" id="calendar-month-year">June 8 - 12, 2026</h2>
                    <button class="header-action-btn" id="btn-next-week"><i data-lucide="chevron-right"></i></button>
                </div>
                
                <div style="display:flex; align-items:center; gap:12px;">
                    <!-- Provider Filter -->
                    <select id="calendar-provider-filter" class="patient-search-input" style="background-color:var(--bg-tertiary); cursor:pointer; width:170px; font-size:0.8rem; padding:6px 10px;">
                        <option value="all">All Providers / Chairs</option>
                        ${dentists.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                    </select>

                    <div class="calendar-view-toggles">
                        <span class="calendar-toggle-tab active" id="tab-view-week">Week</span>
                        <span class="calendar-toggle-tab" id="tab-view-day">Day</span>
                    </div>
                </div>
                
                <button class="btn btn-primary" id="btn-open-book-modal">
                    <i data-lucide="plus"></i>
                    <span>New Appt</span>
                </button>
            </div>

            <!-- Calendar Grid -->
            <div class="calendar-grid-week" id="calendar-grid-wrapper">
                <!-- Programmatically populated -->
            </div>
        </div>

        <!-- Right AI Suggestions Sidebar -->
        <div class="card smart-scheduler-card">
            <div style="display:flex; align-items:center; gap:8px;">
                <i data-lucide="sparkles" style="color:var(--color-primary); width:20px; height:20px;"></i>
                <h2 style="font-size:1.1rem; font-weight:700;">AI Smart Suggestions</h2>
            </div>
            <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4;">
                Select a patient needing scheduling to automatically identify optimal booking slots.
            </p>

            <div class="form-group" style="margin-top:8px;">
                <label>Select Patient</label>
                <select id="smart-sched-patient-select" class="patient-search-input" style="background-color:var(--bg-tertiary); cursor:pointer; font-size:0.8rem;">
                    ${patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
            </div>

            <div class="form-group">
                <label>Select Dentist</label>
                <select id="smart-sched-dentist-select" class="patient-search-input" style="background-color:var(--bg-tertiary); cursor:pointer; font-size:0.8rem;">
                    ${dentists.map(d => `<option value="${d.id}">${d.name} (${d.specialty})</option>`).join('')}
                </select>
            </div>

            <div class="suggested-slots-container" id="suggested-slots-wrapper">
                <!-- AI slots -->
            </div>
        </div>

        <!-- Modal Booking/Editing Form (Hidden by default) -->
        <div class="modal-overlay hidden" id="booking-modal-overlay">
            <div class="modal-card">
                <div class="modal-header-row">
                    <h3 id="booking-modal-title">Book Clinic Appointment</h3>
                    <button class="btn-close-copilot" id="btn-close-modal"><i data-lucide="x"></i></button>
                </div>
                <form class="modal-body-form" id="booking-form">
                    <input type="hidden" id="appt-patient-id" value="">
                    
                    <div class="form-group" id="group-patient-name-input">
                        <label for="appt-patient-name">Patient Full Name</label>
                        <div class="input-with-icon">
                            <i data-lucide="user"></i>
                            <input type="text" id="appt-patient-name" placeholder="John Doe" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="appt-dentist">Provider / Chair</label>
                        <select id="appt-dentist" class="patient-search-input" style="background-color:var(--bg-tertiary); cursor:pointer;">
                            ${dentists.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                        </select>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                        <div class="form-group">
                            <label for="appt-date">Appointment Date</label>
                            <input type="date" id="appt-date" class="patient-search-input" style="background-color:var(--bg-tertiary);" value="2026-06-08" required>
                        </div>
                        <div class="form-group">
                            <label for="appt-time">Appointment Time</label>
                            <input type="time" id="appt-time" class="patient-search-input" style="background-color:var(--bg-tertiary);" value="10:00" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="appt-treatment">Planned Treatment</label>
                        <div class="input-with-icon">
                            <i data-lucide="activity"></i>
                            <input type="text" id="appt-treatment" placeholder="e.g. Composite Restoration #14" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="appt-status">Confirmation Status</label>
                        <select id="appt-status" class="patient-search-input" style="background-color:var(--bg-tertiary); cursor:pointer;">
                            <option value="pending">Pending Confirmation</option>
                            <option value="ai-confirmed">AI Confirmed</option>
                            <option value="completed">Completed Visit</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="appt-notes">Scheduler Notes</label>
                        <textarea id="appt-notes" class="patient-search-input" style="background-color:var(--bg-tertiary); height:60px; resize:none;" placeholder="Notes or instructions..."></textarea>
                    </div>

                    <div class="modal-footer" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-modal" style="display:none; background-color:var(--color-danger-glow); color:var(--color-danger); border-color:transparent;">Cancel Appointment</button>
                        <div style="display:flex; gap:12px; margin-left:auto;">
                            <button type="button" class="btn btn-secondary" id="btn-close-modal-cancel">Close</button>
                            <button type="submit" class="btn btn-primary" id="btn-submit-booking-form">Book Schedule Slot</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    // References
    const gridWrapper = container.querySelector('#calendar-grid-wrapper');
    const monthYearTitle = container.querySelector('#calendar-month-year');
    const providerFilter = container.querySelector('#calendar-provider-filter');
    const tabWeek = container.querySelector('#tab-view-week');
    const tabDay = container.querySelector('#tab-view-day');
    const patientSelect = container.querySelector('#smart-sched-patient-select');
    const dentistSelect = container.querySelector('#smart-sched-dentist-select');
    const slotsWrapper = container.querySelector('#suggested-slots-wrapper');
    const modalOverlay = container.querySelector('#booking-modal-overlay');
    const bookingForm = container.querySelector('#booking-form');

    // Date calculations helpers
    function getWeekDays(start) {
        const days = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }

    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getMonthName(date) {
        return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }

    // Render calendar grid programmatically
    function drawCalendar() {
        appointments = store.getAppointments(); // read latest

        // Filter by provider
        let filteredAppts = appointments;
        if (selectedDentistFilter !== 'all') {
            filteredAppts = appointments.filter(a => a.dentistId === selectedDentistFilter);
        }

        const weekDays = getWeekDays(currentWeekStart);
        const activeDates = currentCalendarView === 'week' ? weekDays : [weekDays[0]]; // Mon only for Day view demonstration

        // Update header month title
        if (currentCalendarView === 'week') {
            monthYearTitle.innerText = `${weekDays[0].toLocaleString('en-US', { month: 'short', day: 'numeric' })} - ${weekDays[4].toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else {
            monthYearTitle.innerText = weekDays[0].toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        // Generate Grid Columns HTML structure
        gridWrapper.className = currentCalendarView === 'week' ? 'calendar-grid-week' : 'calendar-grid-week day-view-grid';
        gridWrapper.style.gridTemplateColumns = currentCalendarView === 'week' ? '60px repeat(5, 1fr)' : '60px 1fr';

        let gridHtml = `<div class="grid-corner"></div>`;

        // Column headers
        activeDates.forEach(date => {
            const isToday = formatDate(date) === "2026-06-08"; // Fixed demo reference date
            gridHtml += `
                <div class="week-day-header">
                    <span class="day-label">${date.toLocaleString('en-US', { weekday: 'short' })}</span>
                    <span class="day-num ${isToday ? 'today' : ''}">${date.getDate()}</span>
                </div>
            `;
        });

        // Hours columns & cell columns container
        gridHtml += `
            <div class="calendar-hours-column">
                <div class="hour-cell">09:00 AM</div>
                <div class="hour-cell">10:00 AM</div>
                <div class="hour-cell">11:00 AM</div>
                <div class="hour-cell">12:00 PM</div>
                <div class="hour-cell">01:00 PM</div>
                <div class="hour-cell">02:00 PM</div>
                <div class="hour-cell">03:00 PM</div>
                <div class="hour-cell">04:00 PM</div>
                <div class="hour-cell">05:00 PM</div>
                <div class="hour-cell">06:00 PM</div>
            </div>
            
            <div class="calendar-day-columns-container" id="calendar-week-columns-inner" style="grid-column: 2 / -1; display:grid; grid-template-columns: repeat(${activeDates.length}, 1fr); height:600px;">
                <!-- Dynamically loaded days columns -->
            </div>
        `;

        gridWrapper.innerHTML = gridHtml;

        const columnsContainer = gridWrapper.querySelector('#calendar-week-columns-inner');

        activeDates.forEach(date => {
            const dateStr = formatDate(date);
            const col = document.createElement('div');
            col.className = 'day-column';
            col.dataset.date = dateStr;
            col.style.position = 'relative';
            col.style.height = '600px';

            // Add background grids
            col.innerHTML = `<div class="grid-cell-block"></div>`;

            // Draw appointment blocks belonging to this day
            const dayAppts = filteredAppts.filter(a => a.time.startsWith(dateStr));
            dayAppts.forEach(appt => {
                const apptTime = appt.time.split(' ')[1];
                const [hrs, mins] = apptTime.split(':').map(Number);
                const startHour = hrs + (mins / 60);

                if (startHour >= 9 && startHour <= 18) {
                    const pixelsPerHour = 60;
                    const offsetTop = (startHour - 9) * pixelsPerHour;
                    const durationHeight = (appt.duration / 60) * pixelsPerHour;

                    const eventDiv = document.createElement('div');
                    
                    let themeClass = 'primary';
                    if (appt.dentistId === 'ross') themeClass = 'accent';
                    if (appt.treatment.includes('Emergency') || appt.status === 'pending') themeClass = 'warning';

                    eventDiv.className = `appt-event-block ${themeClass}`;
                    eventDiv.style.top = `${offsetTop}px`;
                    eventDiv.style.height = `${durationHeight}px`;
                    eventDiv.title = `Click to Reschedule / Edit`;
                    eventDiv.innerHTML = `
                        <div class="appt-event-title">${appt.patientName}</div>
                        <div class="appt-event-desc">${appt.treatment}</div>
                    `;

                    // Click handler to open edit/reschedule actions
                    eventDiv.addEventListener('click', (e) => {
                        e.stopPropagation(); // Stop empty cell bubble trigger
                        openEditModal(appt);
                    });

                    col.appendChild(eventDiv);
                }
            });

            // Click empty cell to book slots
            col.addEventListener('click', (e) => {
                if (e.target.closest('.appt-event-block')) return;

                const rect = col.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const hourVal = Math.floor(clickY / 60) + 9;
                const minVal = clickY % 60 >= 30 ? '30' : '00';
                
                openBookingModal({
                    date: dateStr,
                    time: `${String(hourVal).padStart(2, '0')}:${minVal}`,
                    dentistId: selectedDentistFilter !== 'all' ? selectedDentistFilter : 'mercer'
                });
            });

            columnsContainer.appendChild(col);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Navigation date shifts
    container.querySelector('#btn-prev-week').addEventListener('click', () => {
        const offset = currentCalendarView === 'week' ? 7 : 1;
        currentWeekStart.setDate(currentWeekStart.getDate() - offset);
        drawCalendar();
    });

    container.querySelector('#btn-next-week').addEventListener('click', () => {
        const offset = currentCalendarView === 'week' ? 7 : 1;
        currentWeekStart.setDate(currentWeekStart.getDate() + offset);
        drawCalendar();
    });

    // Provider filter change
    providerFilter.addEventListener('change', (e) => {
        selectedDentistFilter = e.target.value;
        drawCalendar();
    });

    // View tab toggles
    tabWeek.addEventListener('click', () => {
        tabWeek.classList.add('active');
        tabDay.classList.remove('active');
        currentCalendarView = 'week';
        drawCalendar();
    });

    tabDay.addEventListener('click', () => {
        tabDay.classList.add('active');
        tabWeek.classList.remove('active');
        currentCalendarView = 'day';
        drawCalendar();
    });

    // Smart Scheduler suggestions render
    function renderAiSuggestions() {
        const patId = patientSelect.value;
        const dentId = dentistSelect.value;
        const suggestions = store.getSmartSlots(patId, dentId);
        const patient = store.getPatientById(patId);

        slotsWrapper.innerHTML = '';
        suggestions.forEach(s => {
            const item = document.createElement('div');
            item.className = 'suggested-slot-item';
            const [dateStr, timeStr] = s.time.split(' ');

            item.innerHTML = `
                <div class="slot-time-row">
                    <span>${dateStr} @ ${timeStr}</span>
                    <span class="slot-score-badge">${s.score}</span>
                </div>
                <p class="slot-rationale">${s.rationale}</p>
            `;

            // Interactive slot selection
            item.addEventListener('click', () => {
                const firstTreatment = patient.treatmentPlan.find(tp => tp.status === 'proposed')?.procedure || "General Consultation";
                openBookingModal({
                    patientId: patient.id,
                    patientName: patient.name,
                    dentistId: dentId,
                    date: dateStr,
                    time: timeStr,
                    treatment: firstTreatment,
                    notes: "AI Recommended schedule optimization slot."
                });
            });

            slotsWrapper.appendChild(item);
        });
    }

    patientSelect.addEventListener('change', renderAiSuggestions);
    dentistSelect.addEventListener('change', renderAiSuggestions);

    // Book/Edit modals toggles
    function openBookingModal(data) {
        selectedApptToEdit = null;
        
        container.querySelector('#booking-modal-title').innerText = "Book Clinic Appointment";
        container.querySelector('#appt-patient-id').value = data.patientId || '';
        container.querySelector('#appt-patient-name').value = data.patientName || '';
        container.querySelector('#appt-patient-name').disabled = false;
        container.querySelector('#appt-dentist').value = data.dentistId || 'mercer';
        container.querySelector('#appt-date').value = data.date || '2026-06-08';
        container.querySelector('#appt-time').value = data.time || '10:00';
        container.querySelector('#appt-treatment').value = data.treatment || '';
        container.querySelector('#appt-status').value = 'pending';
        container.querySelector('#appt-notes').value = data.notes || '';
        
        container.querySelector('#btn-submit-booking-form').innerText = "Book Schedule Slot";
        container.querySelector('#btn-cancel-modal').style.display = 'none'; // Hide cancel action

        modalOverlay.classList.remove('hidden');
    }

    function openEditModal(appt) {
        selectedApptToEdit = appt;
        
        container.querySelector('#booking-modal-title').innerText = "Edit / Reschedule Appointment";
        container.querySelector('#appt-patient-id').value = appt.patientId;
        container.querySelector('#appt-patient-name').value = appt.patientName;
        container.querySelector('#appt-patient-name').disabled = true; // Block name edit
        container.querySelector('#appt-dentist').value = appt.dentistId;
        container.querySelector('#appt-date').value = appt.time.split(' ')[0];
        container.querySelector('#appt-time').value = appt.time.split(' ')[1];
        container.querySelector('#appt-treatment').value = appt.treatment;
        container.querySelector('#appt-status').value = appt.status;
        container.querySelector('#appt-notes').value = appt.notes;
        
        container.querySelector('#btn-submit-booking-form').innerText = "Save Rescheduled Changes";
        container.querySelector('#btn-cancel-modal').style.display = 'block'; // Show cancel button

        modalOverlay.classList.remove('hidden');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        bookingForm.reset();
        selectedApptToEdit = null;
    }

    container.querySelector('#btn-open-book-modal').addEventListener('click', () => openBookingModal({}));
    container.querySelector('#btn-close-modal').addEventListener('click', closeModal);
    container.querySelector('#btn-close-modal-cancel').addEventListener('click', closeModal);

    // Cancel appointment action
    container.querySelector('#btn-cancel-modal').addEventListener('click', () => {
        if (selectedApptToEdit) {
            if (confirm(`Are you sure you want to cancel the appointment for ${selectedApptToEdit.patientName}?`)) {
                store.removeAppointment(selectedApptToEdit.id);
                closeModal();
                drawCalendar();
            }
        }
    });

    // Form submission (Book/Reschedule)
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const dentistId = container.querySelector('#appt-dentist').value;
        const dObj = dentists.find(d => d.id === dentistId);
        
        const apptData = {
            patientId: container.querySelector('#appt-patient-id').value,
            patientName: container.querySelector('#appt-patient-name').value,
            dentistId: dentistId,
            dentistName: dObj ? dObj.name : "Dr. Sarah Mercer",
            time: `${container.querySelector('#appt-date').value} ${container.querySelector('#appt-time').value}`,
            duration: 60,
            treatment: container.querySelector('#appt-treatment').value,
            status: container.querySelector('#appt-status').value,
            notes: container.querySelector('#appt-notes').value
        };

        if (selectedApptToEdit) {
            // Edit flow
            // First remove original appt
            store.removeAppointment(selectedApptToEdit.id);
            // Re-add edited appointment
            store.addAppointment(apptData);
            alert("Appointment rescheduled and updated successfully.");
        } else {
            // Add flow
            store.addAppointment(apptData);
            alert(`Appointment successfully created for ${apptData.patientName}.`);
        }

        closeModal();
        drawCalendar();
    });

    // Initial renders
    drawCalendar();
    renderAiSuggestions();

    // Listen to clinic changes
    store.addEventListener('clinic-changed', () => {
        drawCalendar();
        renderAiSuggestions();
    });
}
