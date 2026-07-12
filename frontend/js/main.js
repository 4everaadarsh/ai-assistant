/* ==========================================================================
   DENTALAI OS - ENTRYPOINT MANAGER
   Wires up global components (Sidebar, Topbar, Copilot Widget, Theme toggling).
   ========================================================================== */

import { store } from './store.js';
import { router } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Routing
    router.init();

    // 2. Wire up Topbar Notifications Dropdown
    initNotifications();

    // 3. Wire up Theme Toggler (Dark / Light)
    initThemeToggle();

    // 4. Wire up AI Copilot Widget chatbot responses
    initAiCopilot();

    // 5. Wire up Sidebar Logout button
    const logoutBtn = document.getElementById('sidebar-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            router.setLoginState(false);
        });
    }

    // Clinic selector toggle
    const clinicSelector = document.querySelector('.sidebar-clinic-selector');
    const clinicNameDisplay = document.getElementById('clinic-name-display');
    if (clinicSelector) {
        clinicSelector.addEventListener('click', () => {
            const currentClinic = store.activeClinicId;
            const nextClinic = currentClinic === 'bellevue' ? 'redmond' : 'bellevue';
            
            store.switchClinic(nextClinic);
            
            const config = store.getClinicConfig();
            if (clinicNameDisplay) {
                clinicNameDisplay.innerText = config.name;
            }
            
            // Re-render current page
            router.handleRouting();
            
            alert(`Switched active clinic location to: ${config.name}`);
        });
    }

    // User profile settings trigger (practitioner account switching)
    const userTrigger = document.getElementById('user-profile-trigger');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');
    if (userTrigger && userDropdownMenu) {
        userTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('hidden');
        });

        // Close on clicking outside
        document.addEventListener('click', () => {
            userDropdownMenu.classList.add('hidden');
        });

        userDropdownMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const switchItems = userDropdownMenu.querySelectorAll('.user-switch-item');
        switchItems.forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.getAttribute('data-user-id');
                store.switchUser(userId);

                // Update active checklist states
                switchItems.forEach(i => {
                    i.classList.remove('active');
                    const check = i.querySelector('.check-icon');
                    if (check) check.classList.add('hidden');
                });
                item.classList.add('active');
                const check = item.querySelector('.check-icon');
                if (check) check.classList.remove('hidden');

                // Update Header and Sidebar profile details
                const headerAvatar = document.getElementById('header-avatar-img');
                const sidebarName = document.querySelector('.sidebar-footer .user-name');
                const sidebarRole = document.querySelector('.sidebar-footer .user-role');
                const sidebarAvatar = document.querySelector('.sidebar-footer .user-avatar');

                const userDetails = store.currentUser;
                if (headerAvatar) headerAvatar.src = userDetails.avatar;
                if (sidebarAvatar) sidebarAvatar.src = userDetails.avatar;
                if (sidebarName) sidebarName.innerText = userDetails.name.split(',')[0];
                if (sidebarRole) sidebarRole.innerText = userDetails.role;

                userDropdownMenu.classList.add('hidden');

                // Reload current view
                router.handleRouting();

                alert(`Account Switched! Active practitioner profile: ${userDetails.name}`);
            });
        });
    }

    // 6. Wire up Mobile sidebar sliding menu toggle
    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    
    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
    });

    // Close mobile sidebar on navigating links
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
        });
    });

    // 7. Wire up Global search bar shortcut (Cmd+K)
    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('global-search-input').focus();
        }
    });

    // Global Search behavior
    const globalSearch = document.getElementById('global-search-input');
    globalSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = globalSearch.value.trim().toLowerCase();
            if (query) {
                // Navigate to Patient CRM with pre-filled search if patient name matches
                const matchingPat = store.getPatients().find(p => p.name.toLowerCase().includes(query));
                if (matchingPat) {
                    window.location.hash = `#patients?id=${matchingPat.id}`;
                } else {
                    window.location.hash = `#patients`;
                    // Brief delay to let page render, then set input
                    setTimeout(() => {
                        const localSearch = document.getElementById('patient-search');
                        if (localSearch) {
                            localSearch.value = globalSearch.value;
                            localSearch.dispatchEvent(new Event('input'));
                        }
                    }, 500);
                }
                globalSearch.value = '';
            }
        }
    });

    // Listen to store changes to update badge counts in the sidebar
    store.addEventListener('appointment-added', updateSidebarBadges);
    store.addEventListener('patient-updated', updateSidebarBadges);
    store.addEventListener('schedule-updated', updateSidebarBadges);
    
    // Listen to user switcher changes
    store.addEventListener('user-changed', syncUserProfileUI);

    // Initial setup
    updateSidebarBadges();
    syncUserProfileUI();
});

// Notifications Dropdown updates
function initNotifications() {
    const notifBtn = document.getElementById('notifications-btn');
    const dropdownMenu = document.getElementById('notification-dropdown-menu');
    const listContainer = document.getElementById('notification-list-container');
    const badgeCount = document.getElementById('header-notif-count');
    const markAllReadBtn = document.getElementById('mark-all-read-btn');

    // Toggle dropdown
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
        renderDropdownList();
    });

    // Close on body click
    document.addEventListener('click', () => {
        dropdownMenu.classList.add('hidden');
    });

    dropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Mark all read
    markAllReadBtn.addEventListener('click', () => {
        store.markAllNotificationsRead();
        renderDropdownList();
    });

    function renderDropdownList() {
        const notifs = store.getNotifications();
        const unread = notifs.filter(n => !n.read).length;

        // Update badge indicator
        if (unread > 0) {
            badgeCount.innerText = unread;
            badgeCount.classList.remove('hidden');
        } else {
            badgeCount.classList.add('hidden');
        }

        listContainer.innerHTML = '';
        if (notifs.length === 0) {
            listContainer.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted); font-size:0.8rem;">No notifications.</div>`;
            return;
        }

        notifs.forEach(n => {
            const item = document.createElement('div');
            item.className = `notification-item ${!n.read ? 'unread' : ''}`;
            
            let iconName = 'info';
            let iconClass = 'info';
            if (n.type === 'alert') {
                iconName = 'alert-triangle';
                iconClass = 'alert';
            } else if (n.type === 'warning') {
                iconName = 'clock';
                iconClass = 'warning';
            }

            item.innerHTML = `
                <div class="notif-icon-box ${iconClass}">
                    <i data-lucide="${iconName}" style="width:14px; height:14px;"></i>
                </div>
                <div class="notif-details">
                    <span class="notif-text">${n.text}</span>
                    <span class="notif-time">${n.time}</span>
                </div>
            `;

            // Clicking notification marks it read and routes to patient details if relevant
            item.addEventListener('click', () => {
                n.read = true;
                dropdownMenu.classList.add('hidden');
                
                if (n.text.includes("John Doe")) {
                    window.location.hash = `#patients?id=pat-001&tab=diagnostics`;
                } else if (n.text.includes("Mark Vance")) {
                    window.location.hash = `#patients?id=pat-003`;
                } else if (n.text.includes("Sarah Jenkins")) {
                    window.location.hash = `#patients?id=pat-002&tab=treatment`;
                }
                
                renderDropdownList();
            });

            listContainer.appendChild(item);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Initial render
    renderDropdownList();
    
    // Listen to new notifications added in store
    store.addEventListener('notification-added', () => {
        renderDropdownList();
    });
}

// Light & Dark theme toggle controller
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const htmlEl = document.documentElement;

    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlEl.setAttribute('data-theme', nextTheme);
        
        // Re-route/re-render to refresh ApexCharts and Canvas options with color corrections
        router.handleRouting();
    });
}

// Sidebar live counts update
function updateSidebarBadges() {
    const patientsBadge = document.getElementById('badge-patients-count');
    const apptsBadge = document.getElementById('badge-appt-today');

    if (patientsBadge) {
        patientsBadge.innerText = store.getPatients().length;
    }

    if (apptsBadge) {
        const todayStr = "2026-06-08";
        const todayApptCount = store.getAppointments().filter(a => a.time.startsWith(todayStr)).length;
        apptsBadge.innerText = todayApptCount;
    }
}

// AI Copilot widget response logic (Trained response engine)
function initAiCopilot() {
    const toggleBtn = document.getElementById('copilot-toggle-btn');
    const panel = document.getElementById('copilot-panel');
    const closeBtn = document.getElementById('close-copilot-btn');
    const chatBody = document.getElementById('copilot-chat-body');
    const input = document.getElementById('copilot-input');
    const sendBtn = document.getElementById('copilot-send-btn');

    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('hidden');
    });

    closeBtn.addEventListener('click', () => {
        panel.classList.add('hidden');
    });

    function handleSend() {
        const query = input.value.trim();
        if (!query) return;

        // Render User Message
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user';
        userMsg.innerText = query;
        chatBody.appendChild(userMsg);
        
        input.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        // Render AI Thinking State
        const thinkingMsg = document.createElement('div');
        thinkingMsg.className = 'chat-message ai';
        thinkingMsg.innerText = 'Analyzing practice metrics & databases...';
        chatBody.appendChild(thinkingMsg);
        chatBody.scrollTop = chatBody.scrollHeight;

        // Trigger response logic with mock delay
        setTimeout(async () => {
            thinkingMsg.remove();
            
            const aiMsg = document.createElement('div');
            aiMsg.className = 'chat-message ai';
            
            let gotResponse = false;
            try {
                  const res = await fetch('https://dentalai-os-backend.onrender.com/api/copilot/chat', {                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: query })
                });
                if (res.ok) {
                    const data = await res.json();
                    aiMsg.innerHTML = data.response;
                    gotResponse = true;
                }
            } catch (err) {
                console.error("AI Copilot backend failed, falling back to local NLP:", err);
            }

            if (!gotResponse) {
                const cleanQuery = query.toLowerCase().trim();

                if (cleanQuery === 'help') {
                    aiMsg.innerHTML = `
                        <strong>Trained DentalAI Copilot Commands:</strong><br>
                        • Type <strong>'John Doe'</strong> or <strong>'Mark Vance'</strong>: Patient summary.<br>
                        • Type <strong>'roi'</strong> or <strong>'savings'</strong>: AI practice savings.<br>
                        • Type <strong>'pipeline'</strong> or <strong>'treatment'</strong>: Actionable opportunity queue.<br>
                        • Type <strong>'risks'</strong> or <strong>'alerts'</strong>: Clinical diagnostic flags.<br>
                        • Type <strong>'billing'</strong>: Claims and collection efficiency logs.<br>
                        • Type <strong>'schedule'</strong>: Load summary for Mercer & Ross chairs today.
                    `;
                } else if (cleanQuery.includes('john') || cleanQuery.includes('doe')) {
                    aiMsg.innerHTML = `
                        <strong>John Doe</strong> (34yo, M):<br>
                        • Insurance: Delta Dental PPO<br>
                        • AI Pathology Flags: Tooth #14 (Deep Caries, 94% conf) & #32 (Impacted Molar, 98% conf).<br>
                        • Treatment Planned: Resin Composite on #14 ($380) and surgical extraction #32 ($650). Both proposed.
                    `;
                } else if (cleanQuery.includes('mark') || cleanQuery.includes('vance')) {
                    aiMsg.innerHTML = `
                        <strong>Mark Vance</strong> (52yo, M):<br>
                        • Insurance: Cigna PPO (Allergic to Sulfa Drugs)<br>
                        • Scheduled Today: Root Canal Consult #30 at 11:30 AM with Dr. Arthur Ross.<br>
                        • Note: Scheduled via AI emergency triage routing for severe throbbing molar pain.
                    `;
                } else if (cleanQuery.includes('sarah') || cleanQuery.includes('jenkins')) {
                    aiMsg.innerHTML = `
                        <strong>Sarah Jenkins</strong> (28yo, F):<br>
                        • Insurance: MetLife Dental PPO<br>
                        • Status: Completed standard Cleaning and Prophylaxis at 2:00 PM today. AI detected zero active caries.<br>
                        • Pending: Custom maxillary nightguard proposed ($450) to mitigate incisal grinding attrition.
                    `;
                } else if (cleanQuery.includes('roi') || cleanQuery.includes('savings')) {
                    aiMsg.innerHTML = `
                        <strong>DentalAI OS - Active Practice ROI:</strong><br>
                        • Hours Saved: 235 hrs (receptionist administrative task automation)<br>
                        • Missed Calls Recovered: 210 out-of-hours leads ($12,600 values)<br>
                        • AI Generated Bookings: 340 appointments ($54,800 value generated)<br>
                        • Net Monthly Cost Mitigation: $4,250
                    `;
                } else if (cleanQuery.includes('pipeline') || cleanQuery.includes('treatment')) {
                    aiMsg.innerHTML = `
                        <strong>Outstanding Treatment Pipeline:</strong><br>
                        • Total Pipeline Value: $24,500<br>
                        • High Actionable Queue: John Doe ($2,400 crown), Mark Vance ($4,500 implant consult), Sarah Jenkins ($350 hygiene recall)
                    `;
                } else if (cleanQuery.includes('risks') || cleanQuery.includes('alerts')) {
                    aiMsg.innerHTML = `
                        <strong>Clinical AI Pathology Risks:</strong><br>
                        • John Doe: Tooth #14 (Deep Caries, 94% conf) & #32 (Impacted Molar, 98% conf).<br>
                        • Mark Vance: Tooth #30 (Periapical Abscess, 96% conf).<br>
                        • Sarah Jenkins: Tooth #8 (Bruxism incisal attrition wear, 72% conf).
                    `;
                } else if (cleanQuery.includes('billing') || cleanQuery.includes('collected')) {
                    aiMsg.innerHTML = `
                        <strong>Billing Operations Performance (June 2026):</strong><br>
                        • Billed amount: $84,210<br>
                        • Claims submitted: $68,450 (92.5% first-pass clean claim submission)<br>
                        • Collection Efficiency: 96.8% (aided by automated billing SMS reminder alerts)
                    `;
                } else if (cleanQuery.includes('schedule') || cleanQuery.includes('appointments') || cleanQuery.includes('today')) {
                    const todayStr = "2026-06-08";
                    const todays = store.getAppointments().filter(a => a.time.startsWith(todayStr));
                    aiMsg.innerHTML = `
                        <strong>Today's Schedule Summary:</strong><br>
                        • Total appointments: ${todays.length}<br>
                        • Dr. Mercer chair load: John Doe (10 AM), Sarah Jenkins (2 PM)<br>
                        • Dr. Ross chair load: Mark Vance emergency exam (11:30 AM)<br>
                        • AI Auto-Confirmation Rate: 100% of outreach logs successfully booked.
                    `;
                } else {
                    aiMsg.innerHTML = `I am trained on your practice databases. I can calculate ROI, list pipeline values, audit billing, or identify clinical alerts.<br>Type <strong>'help'</strong> to see all commands.`;
                }
            }

            chatBody.appendChild(aiMsg);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 600);
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function syncUserProfileUI() {
    const headerAvatar = document.getElementById('header-avatar-img');
    const sidebarName = document.querySelector('.sidebar-footer .user-name');
    const sidebarRole = document.querySelector('.sidebar-footer .user-role');
    const sidebarAvatar = document.querySelector('.sidebar-footer .user-avatar');

    const userDetails = store.currentUser;
    if (headerAvatar) headerAvatar.src = userDetails.avatar;
    if (sidebarAvatar) sidebarAvatar.src = userDetails.avatar;
    if (sidebarName) sidebarName.innerText = userDetails.name.split(',')[0];
    if (sidebarRole) sidebarRole.innerText = userDetails.role;

    // Sync dropdown checklist state
    const isMercer = userDetails.name.includes("Mercer");
    const activeUserId = isMercer ? "mercer" : "ross";

    const userDropdownMenu = document.getElementById('user-dropdown-menu');
    if (userDropdownMenu) {
        const switchItems = userDropdownMenu.querySelectorAll('.user-switch-item');
        switchItems.forEach(i => {
            const itemUserId = i.getAttribute('data-user-id');
            const check = i.querySelector('.check-icon');
            if (itemUserId === activeUserId) {
                i.classList.add('active');
                if (check) check.classList.remove('hidden');
            } else {
                i.classList.remove('active');
                if (check) check.classList.add('hidden');
            }
        });
    }
}
