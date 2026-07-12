/* ==========================================================================
   DENTALAI OS - AI RECEPTIONIST CONSOLE (ENHANCED)
   Provides conversational custom chatbot, scenario runs, and prompt tuning.
   ========================================================================== */

import { store } from '../store.js';

export function renderReceptionist(container) {
    const logs = store.receptionistLogs;
    const scenarios = store.simulationScenarios;

    container.className = 'page-view receptionist-layout';

    // Core layout markup with chat input bar
    container.innerHTML = `
        <!-- Left: Chat simulator & Audit logs -->
        <div class="flex-column" style="display:flex; flex-direction:column; gap:24px; flex:1.8;">
            <div class="card simulator-console-card">
                <div class="page-header" style="margin-bottom: 0;">
                    <div class="page-title-area">
                        <h2 style="font-size:1.15rem; font-weight:800; display:flex; align-items:center; gap:8px;">
                            <i data-lucide="bot" style="color:var(--color-primary)"></i>
                            Interactive AI Receptionist Console
                        </h2>
                    </div>
                </div>

                <div class="receptionist-topbar">
                    <div class="sim-active-call-pulse" id="sim-call-status">
                        <span class="pulse-dot" id="sim-status-dot"></span>
                        <span id="sim-status-text">Alexis Live: Waiting for input...</span>
                    </div>

                    <div class="audio-wave-container" id="sim-audio-wave">
                        <span class="audio-wave-bar"></span>
                        <span class="audio-wave-bar"></span>
                        <span class="audio-wave-bar"></span>
                        <span class="audio-wave-bar"></span>
                        <span class="audio-wave-bar"></span>
                    </div>
                </div>

                <!-- Live Dialogue Screen -->
                <div class="simulator-screen" style="height:420px; justify-content:space-between; display:flex; flex-direction:column; background-color:#070a12;">
                    <!-- Dialog area -->
                    <div class="screen-transcript-area" id="sim-transcript-box" style="flex:1; overflow-y:auto; padding-bottom:12px;">
                        <div class="speech-bubble ai">
                            <span class="speech-sender">Alexis (AI Assistant)</span>
                            <span class="speech-text">Thank you for calling Apex Dental Group. This is Alexis, your AI clinic receptionist. How can I help you today?</span>
                        </div>
                    </div>

                    <!-- Conversation Text Input Area -->
                    <div style="display:flex; gap:10px; border-top:1px solid var(--border-color); padding-top:12px; margin-top:8px;">
                        <input type="text" id="sim-user-chat-input" class="patient-search-input" style="flex:1; font-size:0.85rem;" placeholder="Type a message to chat with Alexis (e.g. 'I have tooth pain' or 'Do you take Delta Dental?')">
                        <button class="btn btn-primary" id="btn-send-sim-chat" style="padding:10px 16px;">
                            <i data-lucide="send"></i>
                        </button>
                    </div>

                    <!-- Auto Scripted Playback controls -->
                    <div class="simulator-controls-footer" style="margin-top:12px; border-top:1px dashed var(--border-light); padding-top:10px; font-size:0.8rem;">
                        <span style="font-weight:600; color:var(--text-secondary);">Select Script Scenario:</span>
                        <select class="sim-scenario-selector" id="sim-scenario-select" style="max-width:260px; padding:6px; font-size:0.75rem;">
                            ${scenarios.map(s => `<option value="${s.id}">${s.title}</option>`).join('')}
                        </select>
                        <button class="btn btn-secondary" id="btn-trigger-simulation" style="padding:6px 12px; font-size:0.75rem;">
                            <i data-lucide="play" style="width:12px; height:12px;"></i>
                            <span>Run Script</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Audit logs -->
            <div class="card call-logs-container">
                <h3 class="call-logs-title">AI Receptionist Conversations History</h3>
                <div class="call-log-list" id="sim-logs-wrapper">
                    <!-- Loaded dynamically -->
                </div>
            </div>
        </div>

        <!-- Right: Prompt Editor settings -->
        <div class="card ai-settings-card" style="flex:1.2;">
            <div style="display:flex; align-items:center; gap:8px;">
                <i data-lucide="cpu" style="color:var(--color-primary); width:20px; height:20px;"></i>
                <h2 style="font-size:1.1rem; font-weight:700;">AI Core Parameters</h2>
            </div>
            <p class="setting-instructions-text">
                Alter the prompt parameters governing Alexis's automated conversational priorities.
            </p>
            
            <div class="form-group" style="flex:1; display:flex; flex-direction:column; margin-top:12px;">
                <label>System Prompts Prompt</label>
                <textarea class="prompt-textarea" id="sim-prompt-input" style="flex:1; min-height:300px; font-size:0.8rem;"></textarea>
            </div>

            <button class="btn btn-primary" id="btn-save-prompt" style="width:100%; margin-top:12px;">
                <i data-lucide="save"></i>
                <span>Save Prompt Configuration</span>
            </button>
        </div>
    `;

    // References
    const chatInput = container.querySelector('#sim-user-chat-input');
    const sendBtn = container.querySelector('#btn-send-sim-chat');
    const scenarioSelect = container.querySelector('#sim-scenario-select');
    const runScriptBtn = container.querySelector('#btn-trigger-simulation');
    const statusText = container.querySelector('#sim-status-text');
    const statusDot = container.querySelector('#sim-status-dot');
    const audioWave = container.querySelector('#sim-audio-wave');
    const transcriptBox = container.querySelector('#sim-transcript-box');
    const promptInput = container.querySelector('#sim-prompt-input');
    const logsWrapper = container.querySelector('#sim-logs-wrapper');

    promptInput.value = store.aiSettings.prompt;

    // Render historical logs
    function renderCallLogs() {
        logsWrapper.innerHTML = '';
        const logsList = store.receptionistLogs;
        
        logsList.forEach(log => {
            let outcomeClass = 'resolved';
            if (log.outcome === 'booked') outcomeClass = 'booked';
            if (log.outcome === 'escalated') outcomeClass = 'escalated';

            const item = document.createElement('div');
            item.className = 'call-log-item';
            item.innerHTML = `
                <span class="log-caller">${log.callerName}</span>
                <span class="log-purpose">${log.purpose}</span>
                <span class="log-outcome ${outcomeClass}">${log.outcome}</span>
            `;

            // Clicking audit log displays transcript
            item.addEventListener('click', () => {
                stopScriptSimulation();
                statusText.innerText = `Audit Log: Conversation with ${log.callerName}`;
                statusDot.style.display = 'none';
                audioWave.classList.remove('active');
                
                transcriptBox.innerHTML = '';
                log.transcript.forEach(msg => {
                    const bubble = document.createElement('div');
                    bubble.className = `speech-bubble ${msg.sender}`;
                    bubble.innerHTML = `
                        <span class="speech-sender">${msg.sender === 'ai' ? 'Alexis (AI)' : log.callerName}</span>
                        <span class="speech-text">${msg.text}</span>
                    `;
                    transcriptBox.appendChild(bubble);
                });
                
                transcriptBox.scrollTop = transcriptBox.scrollHeight;
            });

            logsWrapper.appendChild(item);
        });
    }

    // Chatbot execution engine (custom text chat)
    function handleCustomUserMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Stop scripts if running
        stopScriptSimulation();

        // 1. Append User Message Bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'speech-bubble patient';
        userBubble.innerHTML = `
            <span class="speech-sender">Patient (You)</span>
            <span class="speech-text">${text}</span>
        `;
        transcriptBox.appendChild(userBubble);
        chatInput.value = '';
        transcriptBox.scrollTop = transcriptBox.scrollHeight;

        // 2. Play audio wave (AI thinking)
        audioWave.classList.add('active');
        statusText.innerText = "Alexis is typing...";
        
        // Brief response delay
        setTimeout(async () => {
            const botResponse = await store.simulateChatReply(text);

            // 3. Append AI Response Bubble
            const botBubble = document.createElement('div');
            botBubble.className = 'speech-bubble ai';
            botBubble.innerHTML = `
                <span class="speech-sender">Alexis (AI Assistant)</span>
                <span class="speech-text">${botResponse.reply}</span>
            `;
            transcriptBox.appendChild(botBubble);
            transcriptBox.scrollTop = transcriptBox.scrollHeight;
            
            // Stop audio wave
            audioWave.classList.remove('active');
            statusText.innerText = "Alexis Live: Waiting for input...";

            // 4. Handle tool action triggers (e.g. mock booking!)
            if (botResponse.action && botResponse.action.type === 'book') {
                const booking = botResponse.action.booking;
                store.addAppointment(booking);
                alert(`AI Auto-Booking Action: Appointment scheduled for ${booking.patientName} on ${booking.time}!`);
            }
        }, 1200);
    }

    sendBtn.addEventListener('click', handleCustomUserMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCustomUserMessage();
        }
    });

    // Automated scenario script simulation
    let scriptTimers = [];

    function stopScriptSimulation() {
        scriptTimers.forEach(clearTimeout);
        scriptTimers = [];
        window.__activeSimSession = null;
        runScriptBtn.disabled = false;
        scenarioSelect.disabled = false;
        audioWave.classList.remove('active');
    }

    function playScriptedSimulation() {
        stopScriptSimulation();
        
        const scenId = scenarioSelect.value;
        const scen = scenarios.find(s => s.id === scenId);
        if (!scen) return;

        transcriptBox.innerHTML = `
            <div class="speech-bubble ai">
                <span class="speech-sender">Alexis (AI Assistant)</span>
                <span class="speech-text">Thank you for calling Apex Dental Group. This is Alexis, your AI clinic receptionist. How can I help you today?</span>
            </div>
        `;
        
        runScriptBtn.disabled = true;
        scenarioSelect.disabled = true;
        statusText.innerText = `Running Script: ${scen.title}`;
        statusDot.style.display = 'inline-block';
        audioWave.classList.add('active');

        // Sync global dashboard indicator
        const sessionState = {
            isRunning: true,
            scenarioTitle: scen.title,
            history: [{ sender: 'ai', text: 'Thank you for calling Apex Dental Group. This is Alexis, your AI clinic receptionist. How can I help you today?' }]
        };
        window.__activeSimSession = sessionState;

        let accumTime = 1500;
        scen.steps.forEach((step, idx) => {
            const timer = setTimeout(() => {
                const bubble = document.createElement('div');
                bubble.className = `speech-bubble ${step.sender}`;
                bubble.innerHTML = `
                    <span class="speech-sender">${step.sender === 'ai' ? 'Alexis (AI)' : 'Patient'}</span>
                    <span class="speech-text">${step.text}</span>
                `;
                transcriptBox.appendChild(bubble);
                transcriptBox.scrollTop = transcriptBox.scrollHeight;

                sessionState.history.push({ sender: step.sender, text: step.text });

                if (idx === scen.steps.length - 1) {
                    statusText.innerText = "Script completed. Call logged.";
                    statusDot.style.display = 'none';
                    audioWave.classList.remove('active');
                    sessionState.isRunning = false;
                    
                    runScriptBtn.disabled = false;
                    scenarioSelect.disabled = false;

                    if (scen.targetBooking) {
                        store.addAppointment(scen.targetBooking);
                        alert(`AI Auto-Booking Action: Appointment scheduled for ${scen.targetBooking.patientName} on ${scen.targetBooking.time}!`);
                    }
                }
            }, accumTime);

            scriptTimers.push(timer);
            accumTime += step.delay;
        });
    }

    runScriptBtn.addEventListener('click', playScriptedSimulation);

    // Save prompt action
    container.querySelector('#btn-save-prompt').addEventListener('click', () => {
        store.updateAiPrompt(promptInput.value);
        alert("AI Assistant prompt parameters saved successfully.");
    });

    renderCallLogs();

    // Clean timers
    container.addEventListener('DOMRemoved', stopScriptSimulation);

    if (window.lucide) {
        window.lucide.createIcons();
    }
}
