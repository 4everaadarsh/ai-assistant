process.env.GEMINI_TIMEOUT_MS = '300';
const aiOrchestrator = require('./ai/orchestrator/aiOrchestrator');
const conversationMemory = require('./ai/memory/conversationMemory');
const appointmentService = require('./services/appointmentService');

async function runMultiTurnTests() {
    console.log('===================================================');
    console.log('DentalAI OS - Multi-Turn Resume Production Test Suite');
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

    // --- REQUIRED TEST: Aadarsh Two-Turn Flow ---
    try {
        const sessionAadarsh = 'live-test-001-' + Date.now();
        console.log('--- AADARSH FLOW TURN 1 ---');
        const turn1 = await aiOrchestrator.process({
            message: 'Hello, I want to book a routine dental checkup tomorrow at 4 PM. My name is Aadarsh Kumar.',
            sessionId: sessionAadarsh
        });
        console.log('Turn 1 Output:', JSON.stringify({
            intent: turn1.intent,
            action: turn1.action,
            missingFields: turn1.toolResult?.missingFields,
            response: turn1.response
        }));

        assert(turn1.success && turn1.action === 'CREATE_APPOINTMENT' && turn1.toolResult?.executed === false, 'Aadarsh Flow - Turn 1 Asks For Phone');

        console.log('\n--- AADARSH FLOW TURN 2 ---');
        const turn2 = await aiOrchestrator.process({
            message: 'My phone number is 5551234567',
            sessionId: sessionAadarsh
        });
        console.log('Turn 2 Output:', JSON.stringify({
            intent: turn2.intent,
            action: turn2.action,
            entities: turn2.entities,
            executed: turn2.toolResult?.executed,
            response: turn2.response
        }));

        assert(
            turn2.success &&
            turn2.intent === 'BOOK_APPOINTMENT' &&
            turn2.action === 'CREATE_APPOINTMENT' &&
            turn2.toolResult?.executed === true &&
            Boolean(turn2.entities.patientName) &&
            Boolean(turn2.entities.phone) &&
            Boolean(turn2.entities.preferredDate) &&
            Boolean(turn2.entities.preferredTime),
            'Aadarsh Flow - Turn 2 Resumes & Executes CREATE_APPOINTMENT',
            turn2
        );
    } catch (e) {
        assert(false, 'Aadarsh Flow Exception', e.message);
    }

    // --- Scenario A: User gives phone only after booking request ---
    try {
        const sessA = 'test-sess-a-' + Date.now();
        await aiOrchestrator.process({
            message: 'I want to book an appointment for dental cleaning on 2026-09-18 at 10:00. My name is John Miller',
            sessionId: sessA
        });
        const turnA2 = await aiOrchestrator.process({
            message: '555-123-4567',
            sessionId: sessA
        });
        assert(turnA2.success && turnA2.toolResult?.executed === true, 'Scenario A: Phone Only Turn 2');
    } catch (e) {
        assert(false, 'Scenario A', e.message);
    }

    // --- Scenario B: User gives date only ---
    try {
        const sessB = 'test-sess-b-' + Date.now();
        await aiOrchestrator.process({
            message: 'Book appointment for Sarah Jenkins at 14:00, phone 555-222-3333',
            sessionId: sessB
        });
        const turnB2 = await aiOrchestrator.process({
            message: '2026-09-19',
            sessionId: sessB
        });
        assert(turnB2.success && turnB2.toolResult?.executed === true, 'Scenario B: Date Only Turn 2');
    } catch (e) {
        assert(false, 'Scenario B', e.message);
    }

    // --- Scenario C: User gives time only ---
    try {
        const sessC = 'test-sess-c-' + Date.now();
        await aiOrchestrator.process({
            message: 'Book appointment for Sarah Jenkins on 2026-09-19, phone 555-222-3333',
            sessionId: sessC
        });
        const turnC2 = await aiOrchestrator.process({
            message: '15:00',
            sessionId: sessC
        });
        assert(turnC2.success && turnC2.toolResult?.executed === true, 'Scenario C: Time Only Turn 2');
    } catch (e) {
        assert(false, 'Scenario C', e.message);
    }

    // --- Scenario D: User corrects date after providing phone ---
    try {
        const sessD = 'test-sess-d-' + Date.now();
        await aiOrchestrator.process({
            message: 'Book appointment on 2026-09-15 at 10:00 for David Ross, 555-111-2222',
            sessionId: sessD
        });
        const turnD2 = await aiOrchestrator.process({
            message: 'Actually make it 2026-09-20 at 15:00 instead',
            sessionId: sessD
        });
        assert(turnD2.success && turnD2.entities.preferredDate === '2026-09-20', 'Scenario D: Date Correction');
    } catch (e) {
        assert(false, 'Scenario D', e.message);
    }

    // --- Scenario E: User says "cancel that" during pending booking ---
    try {
        const sessE = 'test-sess-e-' + Date.now();
        await aiOrchestrator.process({
            message: 'Book appointment for Alex Turner tomorrow at 10:00',
            sessionId: sessE
        });
        const turnE2 = await aiOrchestrator.process({
            message: 'Cancel that',
            sessionId: sessE
        });
        assert(turnE2.success && turnE2.intent === 'CANCEL_APPOINTMENT' && conversationMemory.getPendingFlow(sessE) === null, 'Scenario E: Cancel Pending Flow');
    } catch (e) {
        assert(false, 'Scenario E', e.message);
    }

    // --- Scenario F: Session expiration ---
    try {
        const sessF = 'test-sess-f-' + Date.now();
        conversationMemory.setPendingFlow(sessF, { intent: 'BOOK_APPOINTMENT', action: 'CREATE_APPOINTMENT' });
        if (conversationMemory.pendingFlows.has(sessF)) {
            conversationMemory.pendingFlows.get(sessF).updatedAt = Date.now() - (50 * 60 * 1000); // expired 50 mins ago
        }
        const expiredFlow = conversationMemory.getPendingFlow(sessF);
        assert(expiredFlow === null, 'Scenario F: Expired Session Pending Flow Nullified');
    } catch (e) {
        assert(false, 'Scenario F', e.message);
    }

    // --- Scenario G: Repeating phone message does not create duplicate appointments ---
    try {
        const sessG = 'test-sess-g-' + Date.now();
        await aiOrchestrator.process({
            message: 'Book appointment for Maria Garcia on 2026-09-25 at 11:00',
            sessionId: sessG
        });
        await aiOrchestrator.process({
            message: '555-999-7777',
            sessionId: sessG
        });
        // Repeat phone number
        const turnG3 = await aiOrchestrator.process({
            message: '555-999-7777',
            sessionId: sessG
        });
        assert(turnG3.success && (turnG3.action === 'NONE' || turnG3.toolResult?.executed === false), 'Scenario G: Repeat Message Duplicate Prevention');
    } catch (e) {
        assert(false, 'Scenario G', e.message);
    }

    console.log(`\n===================================================`);
    console.log(`Test Results: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
    console.log(`===================================================`);

    process.exit(failed > 0 ? 1 : 0);
}

runMultiTurnTests();
