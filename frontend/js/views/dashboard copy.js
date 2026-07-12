/* ==========================================================================
   DENTALAI OS - DASHBOARD VIEW RENDERER
   Comprehensive clinic status, appointments, and quick AI insights.
   ========================================================================== */

import { store } from '../store.js';

export function renderDashboard(container) {
    // Read state from mock store
    const appointments = store.getAppointments();
    const notifications = store.getNotifications();
    const patients = store.getPatients();

    // Calculate dynamic stats
    const todayStr = "2026-06-08"; // Fixed mock date for demo consistency
    const todaysAppts = appointments.filter(a => a.time.startsWith(todayStr));
    const pendingAppts = appointments.filter(a => a.status === 'pending').length;

    container.innerHTML = `
        <!-- Page Header -->
        <div class="page-header">
            <div class="page-title-area">
                <h1>Practice Dashboard</h1>
                <p>Welcome back, Dr. Mercer. Here is the operational overview for today.</p>
            </div>
            <div class="page-actions-area">
                <button class="btn btn-secondary" id="btn-refresh-dashboard">
                    <i data-lucide="refresh-cw"></i>
                    <span>Sync Data</span>
                </button>
                <a href="#appointments" class="btn btn-primary">
                    <i data-lucide="calendar-plus"></i>
                    <span>Schedule Appt</span>
                </a>
            </div>
        </div>

        <!-- KPI Grid -->
        <div class="dashboard-grid">
            <div class="card kpi-card">
                <div class="kpi-details">
                    <span class="kpi-title">Today's Est. Revenue</span>
                    <span class="kpi-value">$8,420</span>
                    <span class="kpi-trend positive">
                        <i data-lucide="trending-up" class="icon-small"></i>
                        <span>+14.8% vs last Mon</span>
                    </span>
                </div>
                <div class="kpi-icon-box green">
                    <i data-lucide="dollar-sign"></i>
                </div>
            </div>

              <div class="card kpi-card">
    <div class="kpi-details">
        <span class="kpi-title">AI Revenue Generated</span>
        <span class="kpi-value">$3,780</span>
        <span class="kpi-trend positive">
            <i data-lucide="trending-up" class="icon-small"></i>
            <span>45% of today's bookings</span>
        </span>
    </div>
    <div class="kpi-icon-box purple">
        <i data-lucide="bot"></i>
    </div>
</div>
            <div class="card kpi-card">
    <div class="kpi-details">
        <span class="kpi-title">Patients Today</span>
        <span class="kpi-value">27</span>
        <span class="kpi-trend positive">
            <i data-lucide="users" class="icon-small"></i>
            <span>3 emergency visits</span>
        </span>
    </div>
    <div class="kpi-icon-box blue">
        <i data-lucide="users"></i>
    </div>
</div>
            <div class="card kpi-card">
    <div class="kpi-details">
        <span class="kpi-title">Pending Treatment Value</span>
        <span class="kpi-value">$24,500</span>
        <span class="kpi-trend positive">
            <i data-lucide="dollar-sign" class="icon-small"></i>
            <span>Future revenue pipeline</span>
        </span>
    </div>
    <div class="kpi-icon-box amber">
        <i data-lucide="briefcase"></i>
    </div>
</div>
</div>
        <!-- Split Grid (Timeline & Feed) -->
        <div class="dashboard-split">
            <!-- Timeline (Left) -->
            <div class="card section-card">
                <div class="section-header">
                    <h2>Today's Appointments</h2>
                    <span class="badge-pill">${todaysAppts.length} Scheduled</span>
                </div>
                <div class="appt-timeline" id="dashboard-timeline-list">
                    <!-- Timeline items rendered dynamically -->
                </div>


    </div>

            <!-- AI Feeds (Right) -->
            <div class="flex-column" style="display:flex; flex-direction:column; gap:24px;">
                <!-- Live AI Receptionist Mini Panel -->
                <div class="card section-card" style="padding: 20px;">
                    <div class="section-header">
                     <h2>AI Receptionist Performance Center</h2>
                    </div>
                    <div class="live-receptionist-widget">
                        <div class="widget-title">
                            <h3>Alexis AI Revenue Engine</h3>
                            <span class="widget-status">
                                <span class="pulse-dot"></span>
                                <span>Online & Booking Patients</span>
                            </span>
                        </div>
                        <div class="widget-conversation-box" id="widget-call-transcripts">
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">

        <div style="padding:12px; border-radius:10px; text-align:center; background:rgba(34,197,94,0.08);">
            <div style="font-size:11px; color:var(--text-muted);">Calls Today</div>
            <div style="font-size:22px; font-weight:700;">98</div>
        </div>

        <div style="padding:12px; border-radius:10px; text-align:center; background:rgba(59,130,246,0.08);">
            <div style="font-size:11px; color:var(--text-muted);">Booked</div>
            <div style="font-size:22px; font-weight:700;">42</div>
        </div>

        <div style="padding:12px; border-radius:10px; text-align:center; background:rgba(168,85,247,0.08);">
            <div style="font-size:11px; color:var(--text-muted);">Revenue</div>
            <div style="font-size:22px; font-weight:700;">$3.7k</div>
        </div>

        <div style="padding:12px; border-radius:10px; text-align:center; background:rgba(245,158,11,0.08);">
            <div style="font-size:11px; color:var(--text-muted);">Recovered</div>
            <div style="font-size:22px; font-weight:700;">18</div>
        </div>

    </div>
</div>
                        <div class="widget-action">
                            <span style="font-size: 0.7rem; color: var(--text-muted);">98 Calls processed today</span>
                            <a href="#receptionist" class="btn-trigger-quick">Open Simulator Console</a>
                        </div>
                    </div>
                </div>

                <!-- Urgent Clinical Feed -->
                <div class="card section-card" style="flex:1;">
                    <div class="section-header">
                        <h2>Clinical AI Action Feed</h2>
                        <i data-lucide="sparkles" style="color: var(--color-primary); width:18px; height:18px;"></i>
                    </div>
                    <div class="activity-feed" id="dashboard-action-feed">
                        <!-- Clinical alerts populated dynamically -->
                    </div>
                </div>
                <div class="card section-card" style="padding:20px;">

    <div class="section-header">
        <h3>AI Revenue Opportunities</h3>
        <span class="badge-pill">$7,250 Potential</span>
    </div>

    <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">

        <div style="background:var(--bg-secondary); padding:12px; border-radius:12px; margin-bottom:12px; border:1px solid var(--border-color);">
    
    <div style="font-weight:600;">John Doe</div>
    
    <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
        Crown Treatment Pending
    </div>

    <div style="margin-top:8px; font-weight:700; color:#22c55e;">
        $2,400 Opportunity
    </div>

</div>

    <div style="background:var(--bg-secondary); padding:12px; border-radius:12px; margin-bottom:12px; border:1px solid var(--border-color);">

    <div style="font-weight:600;">Sarah Jenkins</div>

    <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
        Recall Overdue
    </div>

    <div style="margin-top:8px; font-weight:700; color:#f59e0b;">
        $350 Opportunity
    </div>

</div>

<div style="background:var(--bg-secondary); padding:12px; border-radius:12px; border:1px solid var(--border-color);">

    <div style="font-weight:600;">Mark Vance</div>

    <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
        Implant Consultation
    </div>

    <div style="margin-top:8px; font-weight:700; color:#3b82f6;">
        $4,500 Opportunity
    </div>

</div>
    </div>

</div>


            </div>
            <div class="card section-card" style="padding:20px;">
    
    <div class="section-header">
       <h2>AI Executive Intelligence Center</h2>
        <span class="badge-pill">ROI</span>
    </div>

    <div style="display:flex; flex-direction:column; gap:12px;">

    <div class="activity-item">
    <div class="activity-content">
        <span class="activity-title">Revenue Opportunity Detected</span>
        <span class="activity-time">$12,400 Potential Revenue</span>
    </div>
</div>

<div class="activity-item">
    <div class="activity-content">
        <span class="activity-title">Patient Retention Risk</span>
        <span class="activity-time">12 Patients Overdue</span>
    </div>
</div>

<div class="activity-item">
    <div class="activity-content">
        <span class="activity-title">Top Treatment Pipeline</span>
        <span class="activity-time">8 Implant Consultations</span>
    </div>
</div>

<div class="activity-item">
    <div class="activity-content">
        <span class="activity-title">AI Recommendation</span>
        <span class="activity-time">Contact Implant Leads Within 24h</span>
    </div>
</div>
        <div style="
            margin-top:10px;
            padding:14px;
            border-radius:12px;
            text-align:center;
            background:linear-gradient(135deg,#16a34a22,#22c55e22);
            border:1px solid #22c55e55;
        ">
            <div style="font-size:12px;color:#9ca3af;">
                PROJECTED ANNUAL IMPACT
            </div>

            <div style="
                font-size:28px;
                font-weight:800;
                color:#22c55e;
                margin-top:4px;
            ">
                $312,000
            </div>
        </div>

    </div>

</div>
        </div>
    `;

    // Render schedule timeline list
    const timelineContainer = container.querySelector('#dashboard-timeline-list');
    if (todaysAppts.length === 0) {
        timelineContainer.innerHTML = `<div class="empty-state" style="text-align:center; padding: 40px; color: var(--text-muted);">No appointments remaining today.</div>`;
    } else {
        todaysAppts.forEach(appt => {
            const timePart = appt.time.split(' ')[1];
            const badgeClass = appt.status === 'ai-confirmed' ? 'ai-confirmed' : 'pending';
            const badgeLabel = appt.status === 'ai-confirmed' ? 'AI Confirmed' : 'Pending SMS';
            
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-time">${timePart}</div>
                <div class="timeline-patient">
                    <span class="timeline-patient-name">${appt.patientName}</span>
                    <span class="timeline-treatment">${appt.treatment}</span>
                </div>
                <div class="timeline-badge ${badgeClass}">${badgeLabel}</div>
            `;
            
            // Interaction: Clicking a schedule item goes directly to that patient in the CRM!
            item.addEventListener('click', () => {
                // Find matching patient profile ID
                const patient = patients.find(p => p.name === appt.patientName || p.id === appt.patientId);
                if (patient) {
                    window.location.hash = `#patients?id=${patient.id}`;
                } else {
                    window.location.hash = `#patients`;
                }
            });
            timelineContainer.appendChild(item);
        });
    }

    // Render clinical notifications feed
    const actionFeedContainer = container.querySelector('#dashboard-action-feed');
    const unreadNotifs = notifications.filter(n => n.type === 'alert' || n.type === 'warning');
    if (unreadNotifs.length === 0) {
        actionFeedContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.8rem; text-align:center;">No urgent issues pending review.</p>`;
    } else {
        unreadNotifs.forEach(notif => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.style.cursor = 'pointer';
            
            const indicatorClass = notif.type === 'alert' ? 'urgent' : 'ai';
            const iconName = notif.type === 'alert' ? 'alert-triangle' : 'sparkles';
            
            item.innerHTML = `
                <div class="activity-indicator ${indicatorClass}">
                    <i data-lucide="${iconName}" style="width:12px; height:12px;"></i>
                </div>
                <div class="activity-content">
                    <span class="activity-title">${notif.text}</span>
                    <span class="activity-time">${notif.time}</span>
                </div>
            `;
            
            // Interaction: Clicking clinical alert opens John Doe's X-ray diagnostic page!
            item.addEventListener('click', () => {
                if (notif.text.includes("John Doe")) {
                    window.location.hash = `#patients?id=pat-001&tab=diagnostics`;
                } else if (notif.text.includes("Mark Vance")) {
                    window.location.hash = `#patients?id=pat-003`;
                } else {
                    window.location.hash = `#patients`;
                }
            });
            
            actionFeedContainer.appendChild(item);
        });
    }

    // Refresh sync click handler
    container.querySelector('#btn-refresh-dashboard').addEventListener('click', function() {
        const icon = this.querySelector('i');
        icon.style.transform = 'rotate(360deg)';
        icon.style.transition = 'transform 0.5s ease';
        setTimeout(() => {
            icon.style.transform = 'none';
            icon.style.transition = 'none';
            alert("Clinic database fully synchronized with local records.");
        }, 500);
    });

    // Check if a simulated call is currently running
    const activeSimSession = window.__activeSimSession;
    if (activeSimSession && activeSimSession.isRunning) {
        const transBox = container.querySelector('#widget-call-transcripts');
        const widgetStatus = container.querySelector('.widget-status');
        
        widgetStatus.innerHTML = `<span class="pulse-dot"></span><span style="color:var(--color-success)">Live Call: ${activeSimSession.scenarioTitle}</span>`;
        
        transBox.innerHTML = '';
        activeSimSession.history.slice(-3).forEach(msg => {
            const p = document.createElement('p');
            p.className = `widget-msg ${msg.sender}`;
            p.innerHTML = `<strong>${msg.sender === 'ai' ? 'AI' : 'Patient'}:</strong> ${msg.text}`;
            transBox.appendChild(p);
        });
        
        // Auto scroll
        transBox.scrollTop = transBox.scrollHeight;
    }
}
