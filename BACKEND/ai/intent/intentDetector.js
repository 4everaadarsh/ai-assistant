/**
 * DentalAI OS - Enterprise Intent Detector
 *
 * Fast pre-LLM classification for routing, safety gates, and intent scoring.
 * Tolerates spelling errors, abbreviations, Hinglish, casual slang, and fragmented queries.
 */

class IntentDetector {

    detect(message = '', agentType = 'receptionist') {
        const text = String(message).toLowerCase().trim();

        if (!text) {
            return this.createResult('UNKNOWN', 0);
        }

        // 1. Explicit Flow Cancellation / Abandonment Slang
        if (this.matchesRegex(text, [
            /^(never mind|nah leave it|leave it|forget it|cancel it|nah|no thanks|stop)$/i,
            /\b(never mind|nah leave it|leave it|forget it|cancel my pending|don't book)\b/i
        ])) {
            return this.createResult('CANCEL_APPOINTMENT', 0.95);
        }

        // 2. Correction / Mind-Change Detection
        if (this.matchesRegex(text, [
            /^(no|nope|actually)\b/i,
            /\b(no make it|make it|actually|instead|rather|wrong|correction|instead of|change to)\b/i,
            /\b(friday|monday|tuesday|wednesday|thursday|saturday|sunday|tomorrow|morning|afternoon|evening)\s+instead\b/i,
            /\bactually\s+(\d{1,2}(:\d{2})?\s*(am|pm)?|morning|afternoon|evening|tomorrow|friday|monday)\b/i
        ])) {
            return this.createResult('CORRECTION', 0.95);
        }

        // 3. Dental Emergency Triage
        if (this.matchesRegex(text, [
            /\b(emergency|urgent|severe pain|extreme pain|throbbing|unbearable|hurts like crazy|killing me|can't sleep)\b/i,
            /\b(bleeding|heavy bleeding|swelling|facial swelling|swollen|pus|abscess)\b/i,
            /\b(broken tooth|chipped tooth|knocked out|lost tooth|trauma|accident|fever)\b/i,
            /\b(can't breathe|difficulty breathing|difficulty swallowing|choking)\b/i
        ])) {
            return this.createResult('DENTAL_EMERGENCY', 0.98);
        }

        // 4. Availability & Slot Inquiries
        if (this.matchesRegex(text, [
            /^(slot|slots|available|openings)\??$/i,
            /\b(what slots|any slot|slots left|what times are available|anything (after|before|tomorrow|today|friday|\d+)|any openings?|open slots?)\b/i,
            /\b(can i come (tomorrow|today|friday|monday|next week))\b/i
        ])) {
            return this.createResult('AVAILABILITY_QUERY', 0.92);
        }

        // 5. User Confirmation / Affirmation
        if (this.matchesRegex(text, [
            /^(yes|yeah|yep|sure|ok|okay|sounds good|go ahead|confirm|book it|that works|perfect|correct|same|that one)$/i,
            /\b(confirm my appointment|please book|that time works|yes please|that's correct)\b/i
        ])) {
            return this.createResult('CONFIRMATION', 0.95);
        }

        // 6. Appointment Cancellation
        if (this.matchesRegex(text, [
            /\b(cancel|cancle|call off)\b.*\b(appointment|appoitment|apmnt|booking|visit)\b/i,
            /\bneed to cancel\b/i
        ])) {
            return this.createResult('CANCEL_APPOINTMENT', 0.95);
        }

        // 7. Appointment Reschedule
        if (this.matchesRegex(text, [
            /\b(reschedule|reshedule|postpone|move|push back)\b/i,
            /\bchange\b.*\b(appointment|time|date)\b/i
        ])) {
            return this.createResult('RESCHEDULE_APPOINTMENT', 0.95);
        }

        // 8. Insurance Queries (tolerating typos: insurence, insurace, etc.)
        if (this.matchesRegex(text, [
            /\b(insurance|insurence|insurace|delta dental|metlife|cigna|aetna|ppo|hmo|in network|out of network|accept my insurance|take insurance|what insurance)\b/i
        ])) {
            return this.createResult('INSURANCE_QUERY', 0.92);
        }

        // 9. Pricing / Costs (e.g. "how much cleaning?", "cost")
        if (this.matchesRegex(text, [
            /^(how much\??|cost\??|price\??)$/i,
            /\b(price|pricing|cost|how much|treatment cost|out of pocket|special|cash price|fee)\b/i
        ])) {
            return this.createResult('PRICING_QUERY', 0.92);
        }

        // 10. Clinic Hours, Location, Parking & FAQs
        if (this.matchesRegex(text, [
            /\b(opening hours|clinic hours|working hours|what time do you open|what time do you close|are you open|are you guys open)\b/i,
            /\b(where are you located|location|address|directions|where is the clinic)\b/i,
            /\b(parking|have parking|where to park|garage)\b/i,
            /\b(take kids|children|pediatric|family)\b/i,
            /\b(walk-?ins?|accept walk-?ins?)\b/i,
            /\b(first visit|what happens during|what should i bring|how long does a cleaning take|cleaning duration)\b/i,
            /\b(who is the dentist|dentists|doctors)\b/i
        ])) {
            return this.createResult('CLINIC_HOURS', 0.92);
        }

        // 11. Booking Request (Tolerating typos: "appoitment", "apmnt", "bok", "cleanig", Hinglish: "kal dentist se milna")
        if (this.matchesRegex(text, [
            /\b(book|bok|boking|schedule|schedul|make|need|want|wanna)\b.*\b(appointment|appoitment|appointmnt|apointment|apmnt|checkup|cleaning|cleanig|consultation|dentist|dentistt)\b/i,
            /\b(see a dentist|see dentist|get a cleaning|dental checkup)\b/i,
            /\b(can i see dentist|can i book|i want to book|i wanna bok)\b/i,
            /\b(kal|aaj)\b.*\b(dentist|appointment|apmnt|milna|milna hai)\b/i,
            /\b(dentist se milna|appointment chahiye)\b/i,
            /^(tomorrow evening|tomorrow morning|tomorrow afternoon|friday morning|friday afternoon)$/i
        ])) {
            return this.createResult('BOOK_APPOINTMENT', 0.95);
        }

        // 12. Copilot Specific Intents (Dr. Atlas)
        if (agentType === 'copilot') {
            if (this.matchesRegex(text, [
                /\b(show me|what's going on with|give me.*history|summary please|summarize|lookup|find patient|patient details|patient record|patient history)\b/i,
                /^(john|mark|sarah|john doe|mark vance|sarah jenkins)$/i
            ])) {
                return this.createResult('PATIENT_LOOKUP', 0.92);
            }

            if (this.matchesRegex(text, [
                /\b(add note|create note|clinical note|progress note|treatment note|document)\b/i
            ])) {
                return this.createResult('CREATE_CLINICAL_NOTE', 0.92);
            }
        }

        // 13. Analytics Queries
        if (agentType === 'analytics' || this.matchesRegex(text, [
            /\b(revenue|conversion rate|business performance|practice performance|analytics|growth|roi|pipeline|savings)\b/i
        ])) {
            return this.createResult('ANALYTICS_QUERY', 0.88);
        }

        // 14. Greeting
        if (this.matchesRegex(text, [
            /^(hello|hi|hey|good morning|good afternoon|good evening|greetings|howdy)$/i,
            /\b(hello emma|hi emma|hey emma)\b/i
        ])) {
            return this.createResult('GREETING', 0.90);
        }

        // 15. Raw Parameters / Fragments Provided (e.g. Phone, Date, Time)
        if (this.matchesRegex(text, [
            /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
            /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
            /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|kal)\b/i,
            /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i,
            /\b(morning|afternoon|evening|after lunch)\b/i
        ])) {
            return this.createResult('PARAM_PROVIDED', 0.85);
        }

        return this.createResult('GENERAL_QUERY', 0.50);
    }

    matchesRegex(text, regexList) {
        return regexList.some(regex => regex.test(text));
    }

    createResult(intent, confidence) {
        return {
            intent,
            confidence
        };
    }
}

module.exports = new IntentDetector();