process.env.GEMINI_TIMEOUT_MS = '300';
const aiOrchestrator = require('./ai/orchestrator/aiOrchestrator');
const appointmentService = require('./services/appointmentService');
const patientService = require('./services/patientService');

async function runProductionTests() {
    console.log('===================================================');
    console.log('DentalAI OS - Production Verification Test Suite');
    console.log('===================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, testName, details = '') {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${testName} - ${typeof details === 'object' ? JSON.stringify(details) : details}`);
            failed++;
        }
    }

    // A. Greeting
    try {
        const resA = await aiOrchestrator.process({
            message: 'Hello, good morning!',
            sessionId: 'test-session-a'
        });
        assert(resA.success && resA.intent === 'GREETING', 'Test A: Greeting');
    } catch (e) {
        assert(false, 'Test A: Greeting', e.message);
    }

    // B. New appointment with complete information
    try {
        const resB = await aiOrchestrator.process({
            message: 'I want to book an appointment for dental cleaning on 2026-09-15 at 10:00. My name is Alex Turner, phone 555-888-9999',
            sessionId: 'test-session-b'
        });
        assert(resB.success && (resB.action === 'CREATE_APPOINTMENT' || resB.toolResult?.executed === true), 'Test B: Complete Booking Request', resB);
    } catch (e) {
        assert(false, 'Test B: Complete Booking Request', e.message);
    }

    // C. Multi-turn appointment booking
    try {
        const sessionIdC = 'test-session-c-' + Date.now();
        await aiOrchestrator.process({ message: 'I need to book a checkup appointment.', sessionId: sessionIdC });
        await aiOrchestrator.process({ message: 'My name is Clara Barton.', sessionId: sessionIdC });
        await aiOrchestrator.process({ message: 'My phone is 555-444-3333.', sessionId: sessionIdC });
        const resC4 = await aiOrchestrator.process({ message: 'On 2026-09-16 at 14:00.', sessionId: sessionIdC });
        
        assert(resC4.success && (resC4.entities.patientName === 'Clara Barton' || resC4.entities.phone === '(555) 444-3333'), 'Test C: Multi-turn Booking Memory');
    } catch (e) {
        assert(false, 'Test C: Multi-turn Booking Memory', e.message);
    }

    // D. Appointment correction
    try {
        const sessionIdD = 'test-session-d-' + Date.now();
        await aiOrchestrator.process({ message: 'Book appointment for 2026-09-18 at 11:00 for David Ross, 555-111-2222', sessionId: sessionIdD });
        const resD2 = await aiOrchestrator.process({ message: 'Actually, make it 2026-09-20 at 15:00 instead', sessionId: sessionIdD });
        assert(resD2.success && (resD2.entities.preferredDate === '2026-09-20' || resD2.entities.preferredTime === '15:00'), 'Test D: Appointment Correction');
    } catch (e) {
        assert(false, 'Test D: Appointment Correction', e.message);
    }

    // E. Appointment conflict & Invalid date/time
    try {
        // Book initial slot
        await aiOrchestrator.process({
            message: 'Book appointment on 2026-09-22 at 09:00 for Emma Stone, 555-999-0000',
            sessionId: 'test-session-e1'
        });
        // Try booking overlapping slot for same dentist & time
        const resE2 = await aiOrchestrator.process({
            message: 'Book appointment on 2026-09-22 at 09:00 for Frank Wright, 555-999-1111',
            sessionId: 'test-session-e2'
        });
        assert(resE2.success && (resE2.toolResult?.executed === false || resE2.toolResult?.reason?.includes('unavailable') || resE2.response.includes('unavailable')), 'Test E: Conflict Detection');
    } catch (e) {
        assert(false, 'Test E: Conflict Detection', e.message);
    }

    // F. Cancellation confirmation requirement
    try {
        const resF1 = await aiOrchestrator.process({
            message: 'Cancel my appointment',
            sessionId: 'test-session-f',
            confirmed: false
        });
        assert(resF1.success && resF1.toolResult?.confirmationRequired === true, 'Test F: Cancellation Gate Check', resF1);
    } catch (e) {
        assert(false, 'Test F: Cancellation Gate Check', e.message);
    }

    // G. Reschedule confirmation requirement
    try {
        const resG = await aiOrchestrator.process({
            message: 'Reschedule my appointment to 2026-09-25 at 11:00',
            sessionId: 'test-session-g',
            confirmed: false
        });
        assert(resG.success && resG.toolResult?.confirmationRequired === true, 'Test G: Reschedule Gate Check', resG);
    } catch (e) {
        assert(false, 'Test G: Reschedule Gate Check', e.message);
    }

    // H. Patient lookup
    try {
        const resH = await aiOrchestrator.process({
            message: 'Summarize John Doe',
            agentType: 'copilot',
            sessionId: 'test-session-h'
        });
        assert(resH.success && resH.response.length > 0, 'Test H: Patient Lookup via Copilot', resH);
    } catch (e) {
        assert(false, 'Test H: Patient Lookup via Copilot', e.message);
    }

    // K. Past date rejection
    try {
        const resK = await aiOrchestrator.process({
            message: 'Book appointment for John Miller on 2020-01-01 at 10:00, phone 555-000-1111',
            sessionId: 'test-session-k'
        });
        assert(resK.success && resK.toolResult?.executed === false && resK.response.toLowerCase().includes('past'), 'Test K: Reject Past Appointment', resK);
    } catch (e) {
        assert(false, 'Test K: Reject Past Appointment', e.message);
    }

    // L. Closed hours rejection (Sunday)
    try {
        const resL = await aiOrchestrator.process({
            message: 'Book appointment for Grace Hopper on 2026-09-20 at 10:00, phone 555-222-3333', // 2026-09-20 is Sunday
            sessionId: 'test-session-l'
        });
        assert(resL.success && resL.toolResult?.executed === false && (resL.response.toLowerCase().includes('closed') || resL.response.toLowerCase().includes('hours')), 'Test L: Reject Closed Clinic Hours', resL);
    } catch (e) {
        assert(false, 'Test L: Reject Closed Clinic Hours', e.message);
    }

    console.log(`\n===================================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
    console.log(`===================================================`);
    
    process.exit(failed > 0 ? 1 : 0);
}

runProductionTests();
