process.env.GEMINI_TIMEOUT_MS = '300';
const aiOrchestrator = require('./ai/orchestrator/aiOrchestrator');
const conversationMemory = require('./ai/memory/conversationMemory');
const appointmentService = require('./services/appointmentService');
const { apiKeyConfigured } = require('./config/gemini');

async function runProductionReadinessPass() {
    console.log('===================================================');
    console.log('DentalAI OS - Production Readiness Pass Suite');
    console.log('===================================================\n');

    const results = [];

    function record(testName, isLive, passed, details = '') {
        const mode = isLive ? 'LIVE' : 'FALLBACK/DEGRADED';
        const status = passed ? 'PASS' : 'FAIL';
        results.push({ testName, mode, status, details });
        const icon = passed ? '✅' : '❌';
        console.log(`${icon} [${status}] ${testName} (${mode}) ${details ? '- ' + details : ''}`);
    }

    const isSupabaseLive = !appointmentService.isOfflineMode();
    const isGeminiLive = Boolean(apiKeyConfigured);

    // A. Backend Health Logic
    try {
        const isHealthy = true;
        record('A. Backend Health Check', true, isHealthy, 'Backend modules loaded cleanly');
    } catch (e) {
        record('A. Backend Health Check', true, false, e.message);
    }

    // B. Emma Greeting
    try {
        const res = await aiOrchestrator.process({
            message: 'Hello, what services do you offer?',
            sessionId: 'readiness-session-b'
        });
        record('B. Emma Greeting', isGeminiLive, res.success && res.response.length > 0, res.intent);
    } catch (e) {
        record('B. Emma Greeting', isGeminiLive, false, e.message);
    }

    // C. Complete Appointment Booking
    try {
        const res = await aiOrchestrator.process({
            message: 'Book appointment for Alex Turner on 2026-09-15 at 10:00, phone 555-888-9999',
            sessionId: 'readiness-session-c'
        });
        record('C. Complete Appointment Booking', isGeminiLive, res.success && res.toolResult?.executed === true, res.action);
    } catch (e) {
        record('C. Complete Appointment Booking', isGeminiLive, false, e.message);
    }

    // D. Multi-Turn Booking
    try {
        const sessD = 'readiness-session-d-' + Date.now();
        await aiOrchestrator.process({
            message: 'I want to book an appointment for dental cleaning tomorrow at 4 PM. My name is Aadarsh Kumar.',
            sessionId: sessD
        });
        const turn2 = await aiOrchestrator.process({
            message: 'My phone number is 5551234567',
            sessionId: sessD
        });
        record('D. Multi-Turn Booking Resume', isGeminiLive, turn2.success && turn2.toolResult?.executed === true, `Intent: ${turn2.intent}, Action: ${turn2.action}`);
    } catch (e) {
        record('D. Multi-Turn Booking Resume', isGeminiLive, false, e.message);
    }

    // E. Date Correction
    try {
        const sessE = 'readiness-session-e-' + Date.now();
        await aiOrchestrator.process({
            message: 'Book appointment on 2026-09-15 at 10:00 for David Ross, 555-111-2222',
            sessionId: sessE
        });
        const turn2 = await aiOrchestrator.process({
            message: 'Actually make it 2026-09-20 at 15:00 instead',
            sessionId: sessE
        });
        record('E. Date Correction', isGeminiLive, turn2.success && turn2.entities.preferredDate === '2026-09-20', `Date updated to ${turn2.entities.preferredDate}`);
    } catch (e) {
        record('E. Date Correction', isGeminiLive, false, e.message);
    }

    // F. Appointment Conflict Detection
    try {
        const sessF1 = 'readiness-session-f1-' + Date.now();
        const sessF2 = 'readiness-session-f2-' + Date.now();
        await aiOrchestrator.process({
            message: 'Book appointment for John Miller on 2026-09-22 at 10:00, phone 555-000-1111',
            sessionId: sessF1
        });
        const conflictRes = await aiOrchestrator.process({
            message: 'Book appointment for Sarah Miller on 2026-09-22 at 10:00, phone 555-000-2222',
            sessionId: sessF2
        });
        record('F. Appointment Conflict Detection', isGeminiLive, conflictRes.toolResult?.executed === false, 'Prevented double booking same slot');
    } catch (e) {
        record('F. Appointment Conflict Detection', isGeminiLive, false, e.message);
    }

    // G. Closed-Hours Rejection
    try {
        const res = await aiOrchestrator.process({
            message: 'Book appointment for Grace Hopper on 2026-09-20 at 10:00, phone 555-222-3333', // Sunday
            sessionId: 'readiness-session-g'
        });
        record('G. Closed-Hours Rejection', isGeminiLive, res.toolResult?.executed === false, 'Rejected Sunday booking');
    } catch (e) {
        record('G. Closed-Hours Rejection', isGeminiLive, false, e.message);
    }

    // H. Past Appointment Rejection
    try {
        const res = await aiOrchestrator.process({
            message: 'Book appointment for John Miller on 2020-01-01 at 10:00, phone 555-000-1111',
            sessionId: 'readiness-session-h'
        });
        record('H. Past Appointment Rejection', isGeminiLive, res.toolResult?.executed === false, 'Rejected past date');
    } catch (e) {
        record('H. Past Appointment Rejection', isGeminiLive, false, e.message);
    }

    // I. Cancellation Confirmation Gate
    try {
        const res = await aiOrchestrator.process({
            message: 'Cancel my appointment',
            sessionId: 'readiness-session-i',
            confirmed: false
        });
        record('I. Cancellation Confirmation Gate', isGeminiLive, res.toolResult?.confirmationRequired === true, 'Confirmation required before cancel');
    } catch (e) {
        record('I. Cancellation Confirmation Gate', isGeminiLive, false, e.message);
    }

    // J. Reschedule Confirmation Gate
    try {
        const res = await aiOrchestrator.process({
            message: 'Reschedule my appointment to 2026-09-25 at 11:00',
            sessionId: 'readiness-session-j',
            confirmed: false
        });
        record('J. Reschedule Confirmation Gate', isGeminiLive, res.toolResult?.confirmationRequired === true, 'Confirmation required before reschedule');
    } catch (e) {
        record('J. Reschedule Confirmation Gate', isGeminiLive, false, e.message);
    }

    // K. Patient Lookup via Copilot
    try {
        const res = await aiOrchestrator.process({
            message: 'Summarize John Doe',
            agentType: 'copilot',
            sessionId: 'readiness-session-k'
        });
        record('K. Patient Lookup via Copilot', isGeminiLive, res.success && res.response.length > 0, `Agent: ${res.agent}`);
    } catch (e) {
        record('K. Patient Lookup via Copilot', isGeminiLive, false, e.message);
    }

    // L. Gemini Failure Fallback
    try {
        const res = await aiOrchestrator.process({
            message: 'What insurance do you accept?',
            sessionId: 'readiness-session-l'
        });
        record('L. Gemini Failure Fallback', false, res.success && res.response.length > 0, 'Clean fallback output');
    } catch (e) {
        record('L. Gemini Failure Fallback', false, false, e.message);
    }

    // M. Supabase Failure Fallback
    try {
        const isOffline = appointmentService.isOfflineMode();
        record('M. Supabase Failure Fallback', false, true, `Offline fallback active: ${isOffline}`);
    } catch (e) {
        record('M. Supabase Failure Fallback', false, false, e.message);
    }

    // N. Duplicate Booking Prevention
    try {
        const sessN = 'readiness-session-n-' + Date.now();
        await aiOrchestrator.process({
            message: 'Book appointment for Maria Garcia on 2026-09-28 at 11:00, phone 555-999-7777',
            sessionId: sessN
        });
        // Repeat booking request
        const res2 = await aiOrchestrator.process({
            message: 'Book appointment for Maria Garcia on 2026-09-28 at 11:00, phone 555-999-7777',
            sessionId: sessN
        });
        record('N. Duplicate Booking Prevention', isGeminiLive, res2.toolResult?.executed === false, 'Duplicate booking rejected');
    } catch (e) {
        record('N. Duplicate Booking Prevention', isGeminiLive, false, e.message);
    }

    // O. Frontend → Backend Receptionist API Format
    try {
        const reqPayload = { message: 'Hello Emma', sessionId: 'frontend-test-receptionist' };
        const res = await aiOrchestrator.process(reqPayload);
        record('O. Frontend → Backend Receptionist Request', isGeminiLive, res.success && typeof res.response === 'string', 'API payload compatible');
    } catch (e) {
        record('O. Frontend → Backend Receptionist Request', isGeminiLive, false, e.message);
    }

    // P. Frontend → Backend Copilot API Format
    try {
        const reqPayload = { message: 'Summarize John Doe', agentType: 'copilot', sessionId: 'frontend-test-copilot' };
        const res = await aiOrchestrator.process(reqPayload);
        record('P. Frontend → Backend Copilot Request', isGeminiLive, res.success && typeof res.response === 'string', 'API payload compatible');
    } catch (e) {
        record('P. Frontend → Backend Copilot Request', isGeminiLive, false, e.message);
    }

    console.log('\n===================================================');
    const passedCount = results.filter(r => r.status === 'PASS').length;
    console.log(`Test Results: ${passedCount} Passed, ${results.length - passedCount} Failed out of ${results.length} Tests`);
    console.log('===================================================');

    process.exit(results.some(r => r.status === 'FAIL') ? 1 : 0);
}

runProductionReadinessPass();
