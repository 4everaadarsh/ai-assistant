process.env.GEMINI_TIMEOUT_MS = '300'; // test mode with timeout fallback
const aiOrchestrator = require('./ai/orchestrator/aiOrchestrator');
const conversationMemory = require('./ai/memory/conversationMemory');
const { apiKeyConfigured } = require('./config/gemini');

async function runNluSuite() {
    console.log('===================================================');
    console.log('DentalAI OS - Advanced NLU Verification Suite');
    console.log('===================================================\n');

    const isGeminiLive = Boolean(apiKeyConfigured && process.env.GEMINI_API_KEY && process.env.GEMINI_TIMEOUT_MS !== '300');
    const mode = isGeminiLive ? 'LIVE GEMINI' : 'FALLBACK/DEGRADED';
    console.log(`Execution Mode: [${mode}]\n`);

    const results = [];

    function record(id, query, intent, passed, details = '') {
        const status = passed ? 'PASS' : 'FAIL';
        results.push({ id, query, intent, mode, status, details });
        const icon = passed ? '✅' : '❌';
        console.log(`${icon} [${status}] Test ${id}: "${query}" -> Intent: ${intent} | ${details}`);
    }

    // 1. "i want to book an appoitment"
    try {
        const res = await aiOrchestrator.process({
            message: 'i want to book an appoitment',
            sessionId: 'nlu-test-1'
        });
        const passed = res.intent === 'BOOK_APPOINTMENT' && res.action === 'CREATE_APPOINTMENT';
        record(1, 'i want to book an appoitment', res.intent, passed, `Action: ${res.action}`);
    } catch (e) {
        record(1, 'i want to book an appoitment', 'ERROR', false, e.message);
    }

    // 2. "i wanna bok a dentist apmnt tmrw"
    try {
        const res = await aiOrchestrator.process({
            message: 'i wanna bok a dentist apmnt tmrw',
            sessionId: 'nlu-test-2'
        });
        const passed = res.intent === 'BOOK_APPOINTMENT' && Boolean(res.entities.preferredDate);
        record(2, 'i wanna bok a dentist apmnt tmrw', res.intent, passed, `Date: ${res.entities.preferredDate}`);
    } catch (e) {
        record(2, 'i wanna bok a dentist apmnt tmrw', 'ERROR', false, e.message);
    }

    // 3. "kal dentist se milna hai" (Hinglish)
    try {
        const res = await aiOrchestrator.process({
            message: 'kal dentist se milna hai',
            sessionId: 'nlu-test-3'
        });
        const passed = res.intent === 'BOOK_APPOINTMENT' && Boolean(res.entities.preferredDate);
        record(3, 'kal dentist se milna hai', res.intent, passed, `Date: ${res.entities.preferredDate}`);
    } catch (e) {
        record(3, 'kal dentist se milna hai', 'ERROR', false, e.message);
    }

    // 4. "tomorrow evening"
    try {
        const res = await aiOrchestrator.process({
            message: 'tomorrow evening',
            sessionId: 'nlu-test-4'
        });
        const passed = Boolean(res.entities.preferredDate) && res.entities.timePreference === 'evening';
        record(4, 'tomorrow evening', res.intent, passed, `Date: ${res.entities.preferredDate}, Pref: ${res.entities.timePreference}`);
    } catch (e) {
        record(4, 'tomorrow evening', 'ERROR', false, e.message);
    }

    // 5. "what slots are left?"
    try {
        const res = await aiOrchestrator.process({
            message: 'what slots are left?',
            sessionId: 'nlu-test-5'
        });
        const passed = res.intent === 'AVAILABILITY_QUERY' && res.response.length > 10;
        record(5, 'what slots are left?', res.intent, passed, `Response length: ${res.response.length}`);
    } catch (e) {
        record(5, 'what slots are left?', 'ERROR', false, e.message);
    }

    // 6. "slot?"
    try {
        const res = await aiOrchestrator.process({
            message: 'slot?',
            sessionId: 'nlu-test-6'
        });
        const passed = res.intent === 'AVAILABILITY_QUERY';
        record(6, 'slot?', res.intent, passed, `Intent resolved to ${res.intent}`);
    } catch (e) {
        record(6, 'slot?', 'ERROR', false, e.message);
    }

    // 7. "anything after 2?"
    try {
        const res = await aiOrchestrator.process({
            message: 'anything after 2?',
            sessionId: 'nlu-test-7'
        });
        const passed = res.intent === 'AVAILABILITY_QUERY';
        record(7, 'anything after 2?', res.intent, passed, `Intent resolved to ${res.intent}`);
    } catch (e) {
        record(7, 'anything after 2?', 'ERROR', false, e.message);
    }

    // 8. "no friday instead"
    try {
        const sess8 = 'nlu-test-8-' + Date.now();
        await aiOrchestrator.process({
            message: 'Book appointment tomorrow for Sarah Miller, phone 555-222-3333 at 10:00',
            sessionId: sess8
        });
        const res = await aiOrchestrator.process({
            message: 'no friday instead',
            sessionId: sess8
        });
        const passed = Boolean(res.entities.preferredDate) && res.entities.patientName === 'Sarah Miller';
        record(8, 'no friday instead', res.intent, passed, `Updated Date: ${res.entities.preferredDate}, Name preserved: ${res.entities.patientName}`);
    } catch (e) {
        record(8, 'no friday instead', 'ERROR', false, e.message);
    }

    // 9. "actually 5 pm"
    try {
        const sess9 = 'nlu-test-9-' + Date.now();
        await aiOrchestrator.process({
            message: 'Book appointment tomorrow at 10:00 for Mark Vance, phone 555-111-2222',
            sessionId: sess9
        });
        const res = await aiOrchestrator.process({
            message: 'actually 5 pm',
            sessionId: sess9
        });
        const passed = res.entities.preferredTime === '17:00' && res.entities.patientName === 'Mark Vance';
        record(9, 'actually 5 pm', res.intent, passed, `Updated Time: ${res.entities.preferredTime}, Name preserved: ${res.entities.patientName}`);
    } catch (e) {
        record(9, 'actually 5 pm', 'ERROR', false, e.message);
    }

    // 10. "my phone is 7739904548"
    try {
        const res = await aiOrchestrator.process({
            message: 'my phone is 7739904548',
            sessionId: 'nlu-test-10'
        });
        const passed = res.entities.phone === '(773) 990-4548';
        record(10, 'my phone is 7739904548', res.intent, passed, `Formatted Phone: ${res.entities.phone}`);
    } catch (e) {
        record(10, 'my phone is 7739904548', 'ERROR', false, e.message);
    }

    // 11. "what insurance do you take?"
    try {
        const res = await aiOrchestrator.process({
            message: 'what insurance do you take?',
            sessionId: 'nlu-test-11'
        });
        const passed = res.intent === 'INSURANCE_QUERY' && res.response.toLowerCase().includes('delta dental');
        record(11, 'what insurance do you take?', res.intent, passed, `Mentions in-network PPO: ${passed}`);
    } catch (e) {
        record(11, 'what insurance do you take?', 'ERROR', false, e.message);
    }

    // 12. "how much is cleaning?"
    try {
        const res = await aiOrchestrator.process({
            message: 'how much is cleaning?',
            sessionId: 'nlu-test-12'
        });
        const passed = res.intent === 'PRICING_QUERY' && res.response.includes('$189');
        record(12, 'how much is cleaning?', res.intent, passed, `Mentions $189 special: ${passed}`);
    } catch (e) {
        record(12, 'how much is cleaning?', 'ERROR', false, e.message);
    }

    // 13. "my tooth is killing me"
    try {
        const res = await aiOrchestrator.process({
            message: 'my tooth is killing me',
            sessionId: 'nlu-test-13'
        });
        const passed = res.intent === 'DENTAL_EMERGENCY' && res.action === 'ESCALATE_EMERGENCY';
        record(13, 'my tooth is killing me', res.intent, passed, `Action: ${res.action}`);
    } catch (e) {
        record(13, 'my tooth is killing me', 'ERROR', false, e.message);
    }

    // 14. "face is swelling"
    try {
        const res = await aiOrchestrator.process({
            message: 'face is swelling',
            sessionId: 'nlu-test-14'
        });
        const passed = res.intent === 'DENTAL_EMERGENCY' && res.action === 'ESCALATE_EMERGENCY';
        record(14, 'face is swelling', res.intent, passed, `Action: ${res.action}`);
    } catch (e) {
        record(14, 'face is swelling', 'ERROR', false, e.message);
    }

    // 15. "do you have parking?"
    try {
        const res = await aiOrchestrator.process({
            message: 'do you have parking?',
            sessionId: 'nlu-test-15'
        });
        const passed = res.intent === 'CLINIC_HOURS' && res.response.toLowerCase().includes('parking');
        record(15, 'do you have parking?', res.intent, passed, `Answers parking inquiry: ${passed}`);
    } catch (e) {
        record(15, 'do you have parking?', 'ERROR', false, e.message);
    }

    // 16. "what happens during first visit?"
    try {
        const res = await aiOrchestrator.process({
            message: 'what happens during first visit?',
            sessionId: 'nlu-test-16'
        });
        const passed = res.intent === 'CLINIC_HOURS' && res.response.toLowerCase().includes('exam');
        record(16, 'what happens during first visit?', res.intent, passed, `Answers first visit inquiry: ${passed}`);
    } catch (e) {
        record(16, 'what happens during first visit?', 'ERROR', false, e.message);
    }

    // 17. Unclear / single word name: "asdfjk"
    try {
        const res = await aiOrchestrator.process({
            message: 'q',
            sessionId: 'nlu-test-17'
        });
        const passed = res.intent === 'GENERAL_QUERY' && res.response.length > 5;
        record(17, 'unclear/garbled text', res.intent, passed, `Clarification prompt returned`);
    } catch (e) {
        record(17, 'unclear/garbled text', 'ERROR', false, e.message);
    }

    // 18. "never mind" (Flow cancellation)
    try {
        const sess18 = 'nlu-test-18-' + Date.now();
        await aiOrchestrator.process({
            message: 'I want to book an appointment tomorrow at 10 AM',
            sessionId: sess18
        });
        const res = await aiOrchestrator.process({
            message: 'never mind',
            sessionId: sess18
        });
        const pending = conversationMemory.getPendingFlow(sess18);
        const passed = res.intent === 'CANCEL_APPOINTMENT' && !pending;
        record(18, 'never mind', res.intent, passed, `Pending flow cleared: ${!pending}`);
    } catch (e) {
        record(18, 'never mind', 'ERROR', false, e.message);
    }

    // 19. Multi-turn booking with corrections
    try {
        const sess19 = 'nlu-test-19-' + Date.now();
        // Turn 1: "Book tomorrow 4pm for Alex Turner"
        await aiOrchestrator.process({
            message: 'Book tomorrow at 4pm for Alex Turner',
            sessionId: sess19
        });
        // Turn 2: "Actually make it 5pm"
        await aiOrchestrator.process({
            message: 'Actually make it 5pm',
            sessionId: sess19
        });
        // Turn 3: "My phone is 5554443333"
        const turn3 = await aiOrchestrator.process({
            message: 'My phone is 5554443333',
            sessionId: sess19
        });
        const passed = turn3.success && turn3.toolResult?.executed === true && turn3.entities.preferredTime === '17:00';
        record(19, 'multi-turn booking with correction', turn3.intent, passed, `Final time: ${turn3.entities.preferredTime}, Tool executed: ${turn3.toolResult?.executed}`);
    } catch (e) {
        record(19, 'multi-turn booking with correction', 'ERROR', false, e.message);
    }

    // 20. Unexpected unrelated question ("what is the weather today?")
    try {
        const res = await aiOrchestrator.process({
            message: 'what is the weather today?',
            sessionId: 'nlu-test-20'
        });
        const passed = res.intent === 'GENERAL_QUERY' && res.response.toLowerCase().includes('apex dental');
        record(20, 'what is the weather today?', res.intent, passed, `Polite out-of-scope response: ${passed}`);
    } catch (e) {
        record(20, 'what is the weather today?', 'ERROR', false, e.message);
    }

    console.log('\n===================================================');
    const passedCount = results.filter(r => r.status === 'PASS').length;
    console.log(`NLU Test Results: ${passedCount} Passed, ${results.length - passedCount} Failed out of ${results.length} Tests`);
    console.log('===================================================');

    process.exit(results.some(r => r.status === 'FAIL') ? 1 : 0);
}

runNluSuite();
