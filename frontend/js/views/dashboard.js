/* ==========================================================================
   DENTALAI OS - EXECUTIVE DASHBOARD VIEW RENDERER (REDESIGNED)
   A 4-row executive command center showcasing operations, growth, and ROI.
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
    const welcomeName = store.currentUser.name.includes("Mercer") ? "Dr. Mercer" : "Dr. Ross";

    container.innerHTML = `
        <!-- Page Header -->
        <div class="page-header">
            <div class="page-title-area">
                <h1>Executive Command Center</h1>
                <p>Welcome back, ${welcomeName}. Practice operations and growth overview.</p>
            </div>
            <div class="page-actions-area">
                <button class="btn btn-secondary" id="btn-refresh-dashboard">
                    <i data-lucide="refresh-cw"></i>
                    <span>Sync Data</span>
                </button>
                <a href="#appointments" class="btn btn-primary">
                    <i data-lucide="calendar"></i>
                    <span>Schedule Appt</span>
                </a>
            </div>
        </div>

        <!-- ROW 1: Executive KPI Cards -->
        <div class="dashboard-grid">
            <!-- Today's Revenue -->
            <div class="card kpi-card">
                <div class="kpi-details">
                    <span class="kpi-title">Today's Revenue</span>
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

            <!-- AI Generated Revenue -->
            <div class="card kpi-card">
                <div class="kpi-details">
                    <span class="kpi-title">AI Generated Revenue</span>
                    <span class="kpi-value">$3,780</span>
                    <span class="kpi-trend positive">
                        <i data-lucide="cpu" class="icon-small"></i>
                        <span>45% of today's bookings</span>
                    </span>
                </div>
                <div class="kpi-icon-box purple">
                    <i data-lucide="sparkles"></i>
                </div>
            </div>

            <!-- Treatment Pipeline -->
            <div class="card kpi-card">
                <div class="kpi-details">
                    <span class="kpi-title">Treatment Pipeline</span>
                    <span class="kpi-value">$24,500</span>
                    <span class="kpi-trend positive">
                        <i data-lucide="activity" class="icon-small"></i>
                        <span>Future backlog value</span>
                    </span>
                </div>
                <div class="kpi-icon-box blue">
                    <i data-lucide="briefcase"></i>
                </div>
            </div>

            <!-- Patient Retention Score -->
            <div class="card kpi-card">
                <div class="kpi-details">
                    <span class="kpi-title">Patient Retention</span>
                    <span class="kpi-value">92.4%</span>
                    <span class="kpi-trend positive">
                        <i data-lucide="percent" class="icon-small"></i>
                        <span>+1.2% this quarter</span>
                    </span>
                </div>
                <div class="kpi-icon-box amber">
                    <i data-lucide="shield-check"></i>
                </div>
            </div>
        </div>

        <!-- ROW 2: Operations Center -->
        <div class="dashboard-split" style="margin-bottom: 24px;">
            <!-- Left: Today's Appointments -->
            <div class="card section-card">
                <div class="section-header">
                    <h2>Today's Appointments</h2>
                    <span class="badge-pill">${todaysAppts.length} Scheduled</span>
                </div>
                <div class="appt-timeline" id="dashboard-timeline-list" style="max-height: 280px;">
                    <!-- Dynamically populated -->
                </div>
            </div>

            <!-- Right: AI Receptionist Performance Center -->
            <div class="card section-card">
                <div class="section-header">
                    <h2>AI Receptionist Performance Center</h2>
                    <span class="widget-status">
                        <span class="pulse-dot"></span>
                        <span style="font-size: 0.75rem;">Online & Active</span>
                    </span>
                </div>
                <div class="live-receptionist-widget" style="background: transparent; border: none; padding: 0;">
                    <div class="widget-conversation-box" id="widget-call-transcripts" style="min-height: 180px; height: 180px;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; width: 100%;">
                            <div style="padding:12px; border-radius:10px; text-align:center; background:rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.1);">
                                <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">Calls Processed</div>
                                <div style="font-size:22px; font-weight:700; color: var(--color-success);">98</div>
                            </div>
                            <div style="padding:12px; border-radius:10px; text-align:center; background:rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.1);">
                                <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">Auto-Booked</div>
                                <div style="font-size:22px; font-weight:700; color: var(--color-primary);">42</div>
                            </div>
                            <div style="padding:12px; border-radius:10px; text-align:center; background:rgba(6,182,212,0.06); border: 1px solid rgba(6,182,212,0.1);">
                                <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">Yield Generated</div>
                                <div style="font-size:22px; font-weight:700; color: var(--color-accent);">$3.7k</div>
                            </div>
                            <div style="padding:12px; border-radius:10px; text-align:center; background:rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.1);">
                                <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">Missed Recovered</div>
                                <div style="font-size:22px; font-weight:700; color: var(--color-warning);">18</div>
                            </div>
                        </div>
                    </div>
                    <div class="widget-action" style="margin-top: 12px;">
                        <span style="font-size: 0.75rem; color: var(--text-muted);">98 Calls processed today</span>
                        <a href="#receptionist" class="btn btn-secondary" style="font-size: 0.75rem; padding: 6px 12px;">Open Receptionist Console</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- ROW 3: Growth Center -->
        <div class="dashboard-split" style="margin-bottom: 24px;">
            <!-- Left: Revenue Opportunities -->
            <div class="card section-card">
                <div class="section-header">
                    <h2>Revenue Opportunities</h2>
                    <span class="badge-pill" style="background-color: var(--color-success-glow); color: var(--color-success); border-color: transparent;">$7,250 Actionable</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <!-- Opp 1 -->
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-tertiary); padding:12px 16px; border-radius:12px; border:1px solid var(--border-light);">
                        <div>
                            <div style="font-weight:600; font-size:0.875rem;">John Doe</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Crown Treatment Pending (#14)</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:700; color:var(--color-success); font-size:0.9rem;">$2,400</div>
                            <div style="font-size:0.7rem; color:var(--color-primary); margin-top:2px;">AI Campaign Active</div>
                        </div>
                    </div>
                    <!-- Opp 2 -->
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-tertiary); padding:12px 16px; border-radius:12px; border:1px solid var(--border-light);">
                        <div>
                            <div style="font-weight:600; font-size:0.875rem;">Mark Vance</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Implant Restoration (#30)</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:700; color:var(--color-success); font-size:0.9rem;">$4,500</div>
                            <div style="font-size:0.7rem; color:var(--color-warning); margin-top:2px;">Awaiting Consult</div>
                        </div>
                    </div>
                    <!-- Opp 3 -->
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-tertiary); padding:12px 16px; border-radius:12px; border:1px solid var(--border-light);">
                        <div>
                            <div style="font-weight:600; font-size:0.875rem;">Sarah Jenkins</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Hygiene Clean Overdue</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-weight:700; color:var(--color-success); font-size:0.9rem;">$350</div>
                            <div style="font-size:0.7rem; color:var(--color-accent); margin-top:2px;">Recall Queued</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Clinical AI Feed -->
            <div class="card section-card">
                <div class="section-header">
                    <h2>Clinical AI Action Feed</h2>
                    <i data-lucide="sparkles" style="color: var(--color-primary); width:18px; height:18px;"></i>
                </div>
                <div class="activity-feed" id="dashboard-action-feed" style="max-height: 280px;">
                    <!-- Dynamic alerts -->
                </div>
            </div>
        </div>

        <!-- ROW 4: Executive Intelligence Center (Full Width) -->
        <div class="card" style="margin-bottom: 24px; padding: 24px; display: flex; flex-direction: column; gap: 20px;">
            <div class="section-header">
                <div>
                    <h2 style="font-size:1.2rem; font-weight:800; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="trending-up" style="color: var(--color-accent);"></i>
                        Executive Intelligence & ROI Center
                    </h2>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Practice annual growth forecasts, retention risks, and active AI impact projections.</p>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1.2fr 2fr; gap: 24px; align-items: start;">
                <!-- Left: Metrics & Recommendations -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- Risk & Opportunity Detection metrics -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div style="background: var(--bg-tertiary); border: 1px solid var(--border-light); border-radius: 12px; padding: 16px;">
                            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Pipeline Coverage</div>
                            <div style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">75% Actioned</div>
                            <p style="font-size: 11px; color: var(--color-success); margin-top: 4px;">$18.4k actively tracked by AI</p>
                        </div>
                        <div style="background: var(--bg-tertiary); border: 1px solid var(--border-light); border-radius: 12px; padding: 16px;">
                            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Churn Mitigation</div>
                            <div style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-top: 4px;">12 Patients</div>
                            <p style="font-size: 11px; color: var(--color-success); margin-top: 4px;">Recovered via recall</p>
                        </div>
                    </div>

                    <!-- AI Recommendations -->
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-light); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i>
                            Strategic AI Action Recommendations
                        </h4>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
                            AI identified 18 inactive patients with remaining MetLife PPO benefits ($7,200 values). Recommends launching a conversational SMS activation.
                        </div>
                        <button class="btn btn-primary" id="btn-execute-campaign" style="font-size: 0.75rem; padding: 8px 12px; align-self: flex-start;">
                            Execute Recall Campaign
                        </button>
                    </div>

                    <!-- Annual Impact Projections -->
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-light); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">12-Month Impact Forecast</div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">Projected Annual Yield Uplift:</span>
                            <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-success);">+$145,000</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">Front-Desk Productivity Saved:</span>
                            <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-accent);">320 Hours</span>
                        </div>
                    </div>
                </div>

                <!-- Right: Chart Forecast Graph -->
                <div style="background: var(--bg-tertiary); border: 1px solid var(--border-light); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px; height: 100%;">
                    <h3 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">Revenue Growth Projection (DentalAI OS vs. Legacy)</h3>
                    <div id="chart-growth-forecast" style="min-height: 220px; width: 100%;"></div>
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
            
            item.addEventListener('click', () => {
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

    // Execute campaign handler
    container.querySelector('#btn-execute-campaign').addEventListener('click', () => {
        alert("Campaign initiated! AI is reaching out to 18 eligible patients with outstanding MetLife insurance limits.");
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
        
        transBox.scrollTop = transBox.scrollHeight;
    }

    // Render Growth Forecast Chart
    setTimeout(() => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const themeMode = isDark ? 'dark' : 'light';
        const labelColor = isDark ? '#9ca3af' : '#475569';
        const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

        const forecastChart = new ApexCharts(container.querySelector('#chart-growth-forecast'), {
            chart: {
                type: 'area',
                height: 220,
                background: 'transparent',
                foreColor: labelColor,
                toolbar: { show: false }
            },
            theme: {
                mode: themeMode
            },
            series: [
                {
                    name: 'DentalAI OS (Automated Growth)',
                    data: [80, 85, 94, 110, 125, 145, 160, 185]
                },
                {
                    name: 'Legacy Operation (Linear Growth)',
                    data: [80, 81, 83, 85, 87, 89, 91, 93]
                }
            ],
            colors: ['#6366f1', '#6b7280'],
            stroke: {
                curve: 'smooth',
                width: 3
            },
            xaxis: {
                categories: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
            },
            grid: {
                borderColor: gridColor
            },
            tooltip: {
                shared: true
            }
        });
        forecastChart.render();
    }, 100);

    if (window.lucide) {
        window.lucide.createIcons();
    }
}
