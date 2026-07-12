/* ==========================================================================
   DENTALAI OS - PATIENT CRM & AI DIAGNOSTIC SIMULATOR (ENHANCED)
   CRM profile details, radiographic canvases, notes logging, and history.
   ========================================================================== */

import { store } from '../store.js';

export function renderPatients(container) {
    const patients = store.getPatients();
    
    // Parse URL query variables
    const urlHash = window.location.hash;
    let selectedPatientId = patients[0]?.id;
    let activeTabId = 'tab-diagnostics';

    if (urlHash.includes('?')) {
        const queryStr = urlHash.split('?')[1];
        const params = new URLSearchParams(queryStr);
        if (params.has('id')) {
            selectedPatientId = params.get('id');
        }
        if (params.has('tab')) {
            activeTabId = `tab-${params.get('tab')}`;
        }
    }

    let selectedPatient = store.getPatientById(selectedPatientId) || patients[0];
    let isAiOverlayActive = true;
    let selectedFindingId = null;

    container.className = 'page-view patients-layout';
    
    // Render CRM layout skeleton
    container.innerHTML = `
        <!-- Left Patient List Column -->
        <div class="card patients-sidebar-card">
            <div class="search-filters-box">
                <input type="text" id="patient-search" class="patient-search-input" placeholder="Search patients by name..." value="">
                <div class="filter-selects">
                    <select id="filter-risk">
                        <option value="">All AI Risk Levels</option>
                        <option value="high">High Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="low">Low Risk</option>
                    </select>
                </div>
            </div>
            
            <div class="patient-list-container" id="crm-patient-list">
                <!-- Patient list -->
            </div>
        </div>

        <!-- Right Patient Details Column -->
        <div class="card patient-detail-card" id="crm-patient-detail">
            <!-- Loaded dynamically -->
        </div>
    `;

    const searchInput = container.querySelector('#patient-search');
    const riskFilter = container.querySelector('#filter-risk');
    const listContainer = container.querySelector('#crm-patient-list');
    const detailContainer = container.querySelector('#crm-patient-detail');

    // Left List Sidebar render
    function renderList() {
        listContainer.innerHTML = '';
        const query = searchInput.value.toLowerCase().trim();
        const riskVal = riskFilter.value;

        const filtered = patients.filter(pat => {
            const matchesQuery = pat.name.toLowerCase().includes(query) || pat.email.toLowerCase().includes(query) || pat.phone.includes(query);
            const matchesRisk = riskVal ? pat.riskStatus === riskVal : true;
            return matchesQuery && matchesRisk;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--text-muted); font-size:0.8rem;">No patients found.</div>`;
            return;
        }

        filtered.forEach(pat => {
            const isSelected = pat.id === selectedPatient.id;
            const item = document.createElement('div');
            item.className = `patient-list-item ${isSelected ? 'selected' : ''}`;
            item.innerHTML = `
                <div class="patient-list-name-row">
                    <span class="patient-list-name">${pat.name}</span>
                    <span class="patient-list-risk-badge ${pat.riskStatus}">${pat.riskStatus} risk</span>
                </div>
                <div class="patient-list-details">
                    <span>Age: ${pat.age} | ${pat.gender}</span>
                    <span>Last: ${pat.lastVisit}</span>
                </div>
            `;

            item.addEventListener('click', () => {
                selectedPatient = pat;
                selectedFindingId = null;
                window.history.pushState(null, '', `#patients?id=${pat.id}`);
                renderDetails();
                renderList();
            });

            listContainer.appendChild(item);
        });
    }

    // Right details container render
    function renderDetails() {
        if (!selectedPatient) {
            detailContainer.innerHTML = `<div style="text-align:center; padding: 40px; color:var(--text-muted);">Select a patient from the database.</div>`;
            return;
        }

        const proposedCost = selectedPatient.treatmentPlan
            .filter(tp => tp.status === 'proposed')
            .reduce((sum, item) => sum + item.cost, 0);
        const completedCost = selectedPatient.treatmentPlan
            .filter(tp => tp.status === 'completed')
            .reduce((sum, item) => sum + item.cost, 0);

        detailContainer.innerHTML = `
            <!-- Header -->
            <div class="patient-detail-header-row">
                <div class="patient-profile-meta">
                    <img src="${selectedPatient.avatar}" alt="${selectedPatient.name}" class="patient-large-avatar">
                    <div class="patient-meta-info">
                        <h2>${selectedPatient.name}</h2>
                        <div class="patient-submeta">
                            <span>ID: ${selectedPatient.id}</span>
                            <span>•</span>
                            <span>DOB: ${selectedPatient.dob} (${selectedPatient.age} yrs)</span>
                            <span>•</span>
                            <span class="patient-list-risk-badge ${selectedPatient.riskStatus}">AI Risk: ${selectedPatient.riskStatus}</span>
                        </div>
                    </div>
                </div>
                <div class="patient-header-actions">
                    <button class="btn btn-secondary" id="btn-open-book-direct">
                        <i data-lucide="calendar"></i>
                        <span>Book Appt</span>
                    </button>
                </div>
            </div>

            <!-- Contact card -->
            <div class="patient-contact-grid">
                <div class="contact-meta-item">
                    <span class="contact-meta-label">Mobile Number</span>
                    <span class="contact-meta-val">${selectedPatient.phone}</span>
                </div>
                <div class="contact-meta-item">
                    <span class="contact-meta-label">Email Address</span>
                    <span class="contact-meta-val">${selectedPatient.email}</span>
                </div>
                <div class="contact-meta-item">
                    <span class="contact-meta-label">Insurance Provider</span>
                    <span class="contact-meta-val">${selectedPatient.insurance || 'Private Cash'}</span>
                </div>
                <div class="contact-meta-item">
                    <span class="contact-meta-label">Drug Allergies</span>
                    <span class="contact-meta-val" style="color:var(--color-danger); font-weight:700;">
                        ${selectedPatient.allergies.join(', ')}
                    </span>
                </div>
            </div>

            <!-- AI Insight box -->
            <div class="card" style="background-color: var(--color-primary-glow); border-color: rgba(99, 102, 241, 0.2); padding: 16px;">
                <h4 style="font-size:0.8rem; font-weight:700; text-transform:uppercase; margin-bottom:6px; color:var(--color-primary); display:flex; align-items:center; gap:6px;">
                    <i data-lucide="sparkles" style="width:14px; height:14px;"></i>
                    DentalAI Practice Insight Recommendations
                </h4>
                <p style="font-size:0.8rem; line-height:1.4; color:var(--text-primary);">${selectedPatient.riskRationale}</p>
            </div>

            <!-- Navigation Tabs -->
            <div class="patient-tabs">
                <button class="patient-tab-btn ${activeTabId === 'tab-diagnostics' ? 'active' : ''}" data-tab="tab-diagnostics">AI Diagnostics (X-Ray)</button>
                <button class="patient-tab-btn ${activeTabId === 'tab-treatment' ? 'active' : ''}" data-tab="tab-treatment">Treatment Planner</button>
                <button class="patient-tab-btn ${activeTabId === 'tab-history' ? 'active' : ''}" data-tab="tab-history">Treatment History & Visits</button>
                <button class="patient-tab-btn ${activeTabId === 'tab-notes' ? 'active' : ''}" data-tab="tab-notes">Clinical Notes</button>
                <button class="patient-tab-btn ${activeTabId === 'tab-care' ? 'active' : ''}" data-tab="tab-care">Pre/Post Care Guidance</button>
            </div>

            <!-- Tab 1: AI Diagnostics (X-Ray Canvas) -->
            <div class="patient-tab-pane ${activeTabId === 'tab-diagnostics' ? 'active' : ''}" id="tab-diagnostics">
                <div class="xray-simulator-panel">
                    <div class="xray-canvas-container">
                        <div class="xray-canvas-controls">
                            <span class="xray-controls-left">Panoramic Radiograph Scanner</span>
                            <div class="xray-controls-right">
                                <button class="canvas-toggle-btn ${isAiOverlayActive ? 'active' : ''}" id="btn-toggle-ai-overlay">
                                    <i data-lucide="eye" class="icon-small" style="display:inline; margin-right:4px;"></i>
                                    <span>AI Highlights</span>
                                </button>
                            </div>
                        </div>
                        <div class="canvas-wrapper">
                            <canvas id="xray-diagnostic-canvas" width="640" height="400"></canvas>
                            <div class="simulation-disclaimer-overlay">
                                ⚠️ DEMO SIMULATION: Clinical review verified diagnostics draft.
                            </div>
                        </div>
                    </div>

                    <div class="diagnostic-findings-box">
                        <h3 style="font-size:0.9rem; font-weight:700; color:var(--text-primary); margin-bottom:6px;">Detected Findings</h3>
                        <div class="findings-list" id="findings-list-wrapper">
                            <!-- Loaded dynamically -->
                        </div>
                        <div class="card" style="background-color: var(--bg-tertiary); padding: 12px; font-size:0.75rem; line-height:1.4;" id="finding-description-detail">
                            <p style="color:var(--text-muted);">Click on a highlighted zone or category list item to view AI diagnostic findings notes.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 2: Treatment Planner -->
            <div class="patient-tab-pane ${activeTabId === 'tab-treatment' ? 'active' : ''}" id="tab-treatment">
                <div class="treatment-plan-grid">
                    <div class="treatment-phase-box">
                        <div class="phase-header">
                            <h3>Proposed Treatment Procedures</h3>
                            <div style="font-size:0.8rem; font-weight:700;">
                                Proposed: <span style="color:var(--color-primary)">$${proposedCost}</span> | Completed: <span style="color:var(--color-success)">$${completedCost}</span>
                            </div>
                        </div>
                        <div class="phase-body" id="treatment-rows-container">
                            <!-- Planned items -->
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:12px;">
                        <button class="btn btn-secondary" id="btn-print-tp">Print Treatment Form</button>
                        <button class="btn btn-primary" id="btn-submit-insurance">Submit Claims Authorization</button>
                    </div>
                </div>
            </div>

            <!-- Tab 3: Treatment History & Visits -->
            <div class="patient-tab-pane ${activeTabId === 'tab-history' ? 'active' : ''}" id="tab-history">
                <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:20px;">
                    <div class="care-card">
                        <div class="care-card-header post" style="border-bottom: 1px solid var(--border-color); padding-bottom:8px; margin-bottom:12px;">
                            <i data-lucide="check-circle" style="color:var(--color-success);"></i>
                            <h3>Completed Treatment History</h3>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:10px;" id="treatment-history-timeline">
                            <!-- Timeline lists -->
                        </div>
                    </div>
                    <div class="care-card">
                        <div class="care-card-header pre" style="border-bottom: 1px solid var(--border-color); padding-bottom:8px; margin-bottom:12px;">
                            <i data-lucide="calendar-check" style="color:var(--color-accent);"></i>
                            <h3>Visit History Logs</h3>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:12px;" id="visit-history-logs">
                            <!-- Logs of visits -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 4: Clinical Notes -->
            <div class="patient-tab-pane ${activeTabId === 'tab-notes' ? 'active' : ''}" id="tab-notes">
                <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:20px;">
                    <div class="care-card">
                        <div class="care-card-header pre" style="border-bottom: 1px solid var(--border-color); padding-bottom:8px; margin-bottom:12px;">
                            <i data-lucide="clipboard-signature" style="color:var(--color-primary);"></i>
                            <h3>Add Clinical Progress Note</h3>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:12px;">
                            <textarea id="input-new-note" class="patient-search-input" style="height:140px; resize:none; font-size:0.8rem;" placeholder="Type dentist findings, exam observations, or clinical notes..."></textarea>
                            <button class="btn btn-primary" id="btn-save-note" style="align-self:flex-end;">
                                <i data-lucide="save"></i>
                                <span>Save Note to Chart</span>
                            </button>
                        </div>
                    </div>
                    <div class="care-card">
                        <div class="care-card-header post" style="border-bottom: 1px solid var(--border-color); padding-bottom:8px; margin-bottom:12px;">
                            <i data-lucide="history"></i>
                            <h3>Chart Notes Log</h3>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:12px; max-height:280px; overflow-y:auto;" id="patient-notes-container">
                            <!-- Note list -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab 5: Pre/Post Care Guidance -->
            <div class="patient-tab-pane ${activeTabId === 'tab-care' ? 'active' : ''}" id="tab-care">
                <div class="care-guidance-grid">
                    <div class="care-card">
                        <div class="care-card-header pre">
                            <i data-lucide="shield-alert"></i>
                            <h3>Pre-Appointment Preparation</h3>
                        </div>
                        <ul class="care-instructions-list">
                            ${selectedPatient.preCare.map(inst => `
                                <li class="care-instruction-item">
                                    <i data-lucide="check-circle-2"></i>
                                    <span>${inst}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="care-card">
                        <div class="care-card-header post">
                            <i data-lucide="heart-handshake"></i>
                            <h3>Post-Treatment Recovery Care</h3>
                        </div>
                        <ul class="care-instructions-list">
                            ${selectedPatient.postCare.map(inst => `
                                <li class="care-instruction-item">
                                    <i data-lucide="check-circle-2"></i>
                                    <span>${inst}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Register tabs
        const tabBtns = detailContainer.querySelectorAll('.patient-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                detailContainer.querySelectorAll('.patient-tab-pane').forEach(p => p.classList.remove('active'));
                
                btn.classList.add('active');
                const pane = detailContainer.querySelector(`#${btn.dataset.tab}`);
                pane.classList.add('active');
                
                activeTabId = btn.dataset.tab;

                if (btn.dataset.tab === 'tab-diagnostics') {
                    initXrayCanvas();
                } else if (btn.dataset.tab === 'tab-notes') {
                    renderNotesTimeline();
                } else if (btn.dataset.tab === 'tab-history') {
                    renderHistoryTab();
                }
            });
        });

        // AI highlights toggle
        const toggleAiBtn = detailContainer.querySelector('#btn-toggle-ai-overlay');
        if (toggleAiBtn) {
            toggleAiBtn.addEventListener('click', () => {
                isAiOverlayActive = !isAiOverlayActive;
                toggleAiBtn.classList.toggle('active', isAiOverlayActive);
                initXrayCanvas();
            });
        }

        // Direct Book redirect
        detailContainer.querySelector('#btn-open-book-direct').addEventListener('click', () => {
            window.location.hash = `#appointments`;
        });

        // Save Note Form click handler
        const saveNoteBtn = detailContainer.querySelector('#btn-save-note');
        const inputNote = detailContainer.querySelector('#input-new-note');
        if (saveNoteBtn) {
            saveNoteBtn.addEventListener('click', () => {
                const text = inputNote.value.trim();
                if (text) {
                    store.addPatientNote(selectedPatient.id, text);
                    inputNote.value = '';
                    renderNotesTimeline();
                } else {
                    alert("Please write a clinical note before saving.");
                }
            });
        }

        // Render sub-sections
        renderFindingsList();
        renderTreatmentPlanRows();
        if (activeTabId === 'tab-diagnostics') initXrayCanvas();
        if (activeTabId === 'tab-notes') renderNotesTimeline();
        if (activeTabId === 'tab-history') renderHistoryTab();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Render Clinical Notes History
    function renderNotesTimeline() {
        const notesWrapper = container.querySelector('#patient-notes-container');
        if (!notesWrapper) return;

        notesWrapper.innerHTML = '';
        if (selectedPatient.notes.length === 0) {
            notesWrapper.innerHTML = `<div style="text-align:center; font-size:0.8rem; color:var(--text-muted); padding:20px;">No notes recorded.</div>`;
            return;
        }

        selectedPatient.notes.forEach(note => {
            const item = document.createElement('div');
            item.style.backgroundColor = 'var(--bg-tertiary)';
            item.style.borderRadius = '8px';
            item.style.padding = '10px';
            item.style.fontSize = '0.8rem';
            item.style.lineHeight = '1.35';
            item.style.position = 'relative';
            
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-weight:700; color:var(--text-primary);">${note.provider}</span>
                    <span style="font-size:0.65rem; color:var(--text-muted);">${note.date}</span>
                </div>
                <p style="color:var(--text-secondary); margin-right:24px;">${note.text}</p>
                <button class="btn-delete-note" data-note-id="${note.id}" style="position:absolute; right:8px; top:8px; color:var(--color-danger); cursor:pointer; opacity:0.6;" title="Delete Note">
                    <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
                </button>
            `;

            // Delete Note listener
            item.querySelector('.btn-delete-note').addEventListener('click', () => {
                if (confirm("Delete clinical note?")) {
                    store.deletePatientNote(selectedPatient.id, note.id);
                    renderNotesTimeline();
                }
            });

            notesWrapper.appendChild(item);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Render Treatment history timelines
    function renderHistoryTab() {
        const historyTimeline = container.querySelector('#treatment-history-timeline');
        const visitsWrapper = container.querySelector('#visit-history-logs');

        if (historyTimeline) {
            historyTimeline.innerHTML = '';
            if (!selectedPatient.treatmentHistory || selectedPatient.treatmentHistory.length === 0) {
                historyTimeline.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">No completed history records found.</p>`;
            } else {
                selectedPatient.treatmentHistory.forEach(h => {
                    const item = document.createElement('div');
                    item.style.display = 'flex';
                    item.style.justifyContent = 'space-between';
                    item.style.alignItems = 'center';
                    item.style.paddingBottom = '8px';
                    item.style.borderBottom = '1px solid var(--border-light)';
                    item.style.fontSize = '0.8rem';
                    item.innerHTML = `
                        <div>
                            <span style="font-weight:700; color:var(--text-primary);">${h.procedure}</span>
                            <span style="font-size:0.7rem; color:var(--color-primary); font-weight:600; margin-left:6px;">Tooth ${h.tooth}</span>
                            <div style="font-size:0.7rem; color:var(--text-muted);">Completed by ${h.dentist} on ${h.date}</div>
                        </div>
                        <span style="font-weight:700; color:var(--color-success);">$${h.cost}</span>
                    `;
                    historyTimeline.appendChild(item);
                });
            }
        }

        if (visitsWrapper) {
            visitsWrapper.innerHTML = '';
            // Render Visit history timeline
            // Mock dynamic logs
            const visits = [
                { title: "Standard Hygiene cleaning & exam", dentist: "Dr. Sarah Mercer", date: selectedPatient.lastVisit, desc: "Bite-wing digital x-rays taken. Prophylaxis completed. Patient instructed on flossing." },
                { title: "Restorative Consult", dentist: "Dr. Sarah Mercer", date: "2025-05-12", desc: "Reviewed visual caries. Patient approved composite restorations for next visit." }
            ];

            visits.forEach((v, idx) => {
                const item = document.createElement('div');
                item.style.borderLeft = `2px solid ${idx === 0 ? 'var(--color-primary)' : 'var(--text-muted)'}`;
                item.style.paddingLeft = '12px';
                item.style.fontSize = '0.8rem';
                item.style.marginBottom = '12px';
                item.innerHTML = `
                    <div style="font-weight:700; color:var(--text-primary);">${v.title}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:4px;">${v.date} • ${v.dentist}</div>
                    <p style="font-size:0.75rem; color:var(--text-secondary); line-height:1.3;">${v.desc}</p>
                `;
                visitsWrapper.appendChild(item);
            });
        }
    }

    // Render findings list items
    function renderFindingsList() {
        const listWrapper = container.querySelector('#findings-list-wrapper');
        const descBox = container.querySelector('#finding-description-detail');
        if (!listWrapper) return;

        listWrapper.innerHTML = '';
        if (!selectedPatient.findings || selectedPatient.findings.length === 0) {
            listWrapper.innerHTML = `<p style="color:var(--text-muted); font-size:0.8rem;">No active pathologies detected.</p>`;
            return;
        }

        selectedPatient.findings.forEach(f => {
            const isHighlighted = f.id === selectedFindingId;
            const item = document.createElement('div');
            item.className = `finding-item ${isHighlighted ? 'active-highlight' : ''} ${f.severity}-severity`;
            item.innerHTML = `
                <div class="finding-title-group">
                    <span class="finding-tooth">Tooth #${f.tooth} | ${f.type}</span>
                    <span class="finding-desc">${f.severity.toUpperCase()} Priority</span>
                </div>
                <span class="finding-conf">${f.confidence}% AI match</span>
            `;

            item.addEventListener('click', () => {
                selectedFindingId = f.id;
                renderFindingsList();
                initXrayCanvas();
                
                descBox.innerHTML = `
                    <h4 style="font-size:0.8rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">
                        Tooth #${f.tooth} - ${f.type} Details:
                    </h4>
                    <p style="color:var(--text-primary); margin-bottom:6px;">${f.desc}</p>
                    <span style="font-size:0.7rem; color:var(--text-muted);">Confidence level: ${f.confidence}% | Clinically review before coding treatment.</span>
                `;
            });

            listWrapper.appendChild(item);
        });
    }

    // Render Treatment Plan proposed rows
    function renderTreatmentPlanRows() {
        const rowsContainer = container.querySelector('#treatment-rows-container');
        if (!rowsContainer) return;

        rowsContainer.innerHTML = '';
        if (selectedPatient.treatmentPlan.length === 0) {
            rowsContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding: 20px;">No treatments planned.</div>`;
            return;
        }

        selectedPatient.treatmentPlan.forEach((tp) => {
            const row = document.createElement('div');
            row.className = 'treatment-row';
            const badgeClass = tp.status === 'completed' ? 'completed' : tp.status === 'proposed' ? 'proposed' : 'declined';
            
            row.innerHTML = `
                <span class="treatment-tooth-tag">${tp.tooth}</span>
                <span class="treatment-procedure">${tp.procedure}</span>
                <span class="treatment-cost">$${tp.cost}</span>
                <div>
                    <span class="treatment-status-badge ${badgeClass}">${tp.status}</span>
                </div>
            `;

            row.style.cursor = 'pointer';
            row.title = "Click to Toggle Status (Demo Interaction)";
            row.addEventListener('click', () => {
                const nextStatus = tp.status === 'proposed' ? 'completed' : 'proposed';
                tp.status = nextStatus;
                store.updatePatient(selectedPatient.id, { treatmentPlan: selectedPatient.treatmentPlan });
                renderDetails();
            });

            rowsContainer.appendChild(row);
        });
    }

    // Panoramic Dental Canvas Radiograph drawer
    function initXrayCanvas() {
        const canvas = container.querySelector('#xray-diagnostic-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#1a2233';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(w/2, h/2, 180, Math.PI, 0);
        ctx.stroke();

        ctx.strokeStyle = '#1a2233';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(w/2, h/2 - 20, 180, 0, Math.PI);
        ctx.stroke();

        for (let i = 0; i < 16; i++) {
            const angle = Math.PI + (Math.PI / 17) * (i + 1);
            const r = 170;
            const x = w/2 + r * Math.cos(angle);
            const y = h/2 + r * Math.sin(angle);

            ctx.fillStyle = '#26354d';
            ctx.strokeStyle = '#405675';
            ctx.lineWidth = 1.5;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + Math.PI/2);
            
            ctx.beginPath();
            ctx.moveTo(-8, -12);
            ctx.quadraticCurveTo(-12, 0, -6, 15);
            ctx.quadraticCurveTo(0, 8, 6, 15);
            ctx.quadraticCurveTo(12, 0, 8, -12);
            ctx.quadraticCurveTo(0, -15, -8, -12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#6b7280';
            ctx.font = '700 8px "Plus Jakarta Sans"';
            ctx.textAlign = 'center';
            ctx.fillText(i + 1, 0, -20);
            ctx.restore();
        }

        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI / 17) * (i + 1);
            const r = 150;
            const x = w/2 + r * Math.cos(angle);
            const y = h/2 + r * Math.sin(angle) - 20;

            ctx.fillStyle = '#26354d';
            ctx.strokeStyle = '#405675';
            ctx.lineWidth = 1.5;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + Math.PI/2);
            
            ctx.beginPath();
            ctx.moveTo(-8, 12);
            ctx.quadraticCurveTo(-12, 0, -6, -15);
            ctx.quadraticCurveTo(0, -8, 6, -15);
            ctx.quadraticCurveTo(12, 0, 8, 12);
            ctx.quadraticCurveTo(0, 15, -8, 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#6b7280';
            ctx.font = '700 8px "Plus Jakarta Sans"';
            ctx.textAlign = 'center';
            ctx.fillText(32 - i, 0, 24);
            ctx.restore();
        }

        ctx.strokeStyle = 'rgba(99, 102, 241, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        if (isAiOverlayActive && selectedPatient.findings) {
            selectedPatient.findings.forEach(f => {
                const isSelected = f.id === selectedFindingId;
                let strokeColor = 'rgba(6, 182, 212, 0.8)';
                let fillColor = 'rgba(6, 182, 212, 0.15)';
                let glowColor = 'rgba(6, 182, 212, 0.4)';

                if (f.severity === 'high') {
                    strokeColor = 'rgba(239, 68, 68, 0.85)';
                    fillColor = 'rgba(239, 68, 68, 0.2)';
                    glowColor = 'rgba(239, 68, 68, 0.5)';
                } else if (f.severity === 'low') {
                    strokeColor = 'rgba(16, 185, 129, 0.8)';
                    fillColor = 'rgba(16, 185, 129, 0.1)';
                    glowColor = 'rgba(16, 185, 129, 0.3)';
                }

                if (isSelected) {
                    ctx.shadowColor = glowColor;
                    ctx.shadowBlur = 15;
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = strokeColor;
                } else {
                    ctx.shadowBlur = 0;
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = strokeColor;
                }

                ctx.fillStyle = fillColor;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, 2*Math.PI);
                ctx.fill();
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px "Plus Jakarta Sans"';
                ctx.textAlign = 'center';
                ctx.fillText(`AI: #${f.tooth} ${f.type}`, f.x, f.y - f.r - 6);
            });
        }

        if (!canvas.dataset.hasListener) {
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = w / rect.width;
                const scaleY = h / rect.height;
                const mouseX = (e.clientX - rect.left) * scaleX;
                const mouseY = (e.clientY - rect.top) * scaleY;

                let clickedFinding = null;
                if (isAiOverlayActive && selectedPatient.findings) {
                    for (const f of selectedPatient.findings) {
                        const dist = Math.sqrt(Math.pow(mouseX - f.x, 2) + Math.pow(mouseY - f.y, 2));
                        if (dist <= f.r) {
                            clickedFinding = f;
                            break;
                        }
                    }
                }

                if (clickedFinding) {
                    selectedFindingId = clickedFinding.id;
                    renderFindingsList();
                    initXrayCanvas();
                    
                    const descBox = container.querySelector('#finding-description-detail');
                    descBox.innerHTML = `
                        <h4 style="font-size:0.8rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">
                            Tooth #${clickedFinding.tooth} - ${clickedFinding.type} Details:
                        </h4>
                        <p style="color:var(--text-primary); margin-bottom:6px;">${clickedFinding.desc}</p>
                        <span style="font-size:0.7rem; color:var(--text-muted);">Confidence level: ${clickedFinding.confidence}% | Clinically review before coding treatment.</span>
                    `;
                }
            });
            canvas.dataset.hasListener = "true";
        }
    }

    searchInput.addEventListener('input', renderList);
    riskFilter.addEventListener('change', renderList);

    renderList();
    renderDetails();
}
