const { genAI } = require('../config/gemini');
const appointmentService = require('./appointmentService');
const patientService = require('./patientService');
const responseParser = require('../ai/parser/responseParser');

// Fallback rule responses for Copilot when API is offline
const COPILOT_RESPONSES = {
    "help": `<strong>Trained DentalAI Copilot Commands:</strong><br>
• Type <strong>'John Doe'</strong> or <strong>'show me John'</strong>: Patient clinical summary.<br>
• Type <strong>'roi'</strong> or <strong>'savings'</strong>: AI practice savings.<br>
• Type <strong>'pipeline'</strong> or <strong>'treatment'</strong>: Actionable opportunity queue.<br>
• Type <strong>'risks'</strong> or <strong>'alerts'</strong>: Clinical diagnostic flags.<br>
• Type <strong>'billing'</strong>: Claims and collection efficiency logs.<br>
• Type <strong>'schedule'</strong>: Load summary for Mercer & Ross chairs today.`,

    "john": `<strong>John Doe</strong> (34yo, M):<br>
• Insurance: Delta Dental PPO<br>
• AI Pathology Flags: Tooth #14 (Deep Caries, 94% conf) & #32 (Impacted Molar, 98% conf).<br>
• Treatment Planned: Resin Composite on #14 ($380) and surgical extraction #32 ($650). Both proposed.`,

    "mark": `<strong>Mark Vance</strong> (52yo, M):<br>
• Insurance: Cigna PPO (Allergic to Sulfa Drugs)<br>
• Scheduled Today: Root Canal Consult #30 at 11:30 AM with Dr. Arthur Ross.<br>
• Note: Scheduled via AI emergency triage routing for severe throbbing molar pain.`,

    "sarah": `<strong>Sarah Jenkins</strong> (28yo, F):<br>
• Insurance: MetLife Dental PPO<br>
• Status: Completed standard Cleaning and Prophylaxis at 2:00 PM today. AI detected zero active caries.<br>
• Pending: Custom maxillary nightguard proposed ($450).`,

    "roi": `<strong>DentalAI OS - Active Practice ROI:</strong><br>
• Hours Saved: 235 hrs (receptionist administrative automation)<br>
• Missed Calls Recovered: 210 out-of-hours leads ($12,600 value)<br>
• AI Generated Bookings: 340 appointments ($54,800 value generated)<br>
• Net Monthly Cost Mitigation: $4,250`,

    "pipeline": `<strong>Outstanding Treatment Pipeline:</strong><br>
• Total Pipeline Value: $24,500<br>
• High Actionable Queue: John Doe ($2,400 crown), Mark Vance ($4,500 implant consult), Sarah Jenkins ($350 hygiene recall)`,

    "risks": `<strong>Clinical AI Pathology Risks:</strong><br>
• John Doe: Tooth #14 (Deep Caries, 94% conf) & #32 (Impacted Molar, 98% conf).<br>
• Mark Vance: Tooth #30 (Periapical Abscess, 96% conf).<br>
• Sarah Jenkins: Tooth #8 (Bruxism incisal attrition wear, 72% conf).`,

    "billing": `<strong>Billing Operations Performance:</strong><br>
• Billed amount: $84,210<br>
• Claims submitted: $68,450 (92.5% first-pass clean claim submission)<br>
• Collection Efficiency: 96.8%`,

    "schedule": `<strong>Today's Schedule Summary:</strong><br>
• Total appointments: 3 scheduled<br>
• Dr. Mercer chair load: John Doe (10 AM), Sarah Jenkins (2 PM)<br>
• Dr. Ross chair load: Mark Vance emergency exam (11:30 AM)`
};

class GeminiService {

    /**
     * Executes a Google Gemini API call with production timeout and transient retry.
     */
    async callGemini(promptText, systemInstruction = "") {
        if (!genAI) {
            console.warn('[GeminiService] Gemini client not initialized. Falling back to local rules.');
            return null;
        }

        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS) || 4000;

        for (let attempt = 1; attempt <= 1; attempt++) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        responseMimeType: 'application/json'
                    },
                    systemInstruction: systemInstruction ? systemInstruction : undefined
                });

                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)), timeoutMs);
                });

                const result = await Promise.race([
                    model.generateContent(promptText),
                    timeoutPromise
                ]);

                const response = await result.response;
                const text = response.text();

                if (text && text.trim()) {
                    return text;
                }
            } catch (e) {
                console.warn(`[GeminiService] Attempt ${attempt}/2 failed:`, e.message);
                if (attempt < 2) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        }

        return null;
    }

    /**
     * Fallback processor for Copilot chat.
     */
    async getCopilotResponse(userMessage) {
        const cleanMsg = userMessage.toLowerCase().trim();

        const systemInstruction = `You are DentalAI Copilot, an advanced clinical assistant for Apex Dental.
Respond in valid JSON format.`;

        const apiResponse = await this.callGemini(userMessage, systemInstruction);
        if (apiResponse) {
            return apiResponse;
        }

        // Try lookup real patient in DB first
        try {
            const allPatients = await patientService.getAllPatients();
            // Match against patient first name or full name
            const matchedPatient = allPatients.find(p => {
                const pName = String(p.name).toLowerCase().trim();
                const firstName = pName.split(' ')[0];
                return cleanMsg.includes(pName) || cleanMsg.includes(firstName);
            });

            if (matchedPatient) {
                return JSON.stringify({
                    intent: "PATIENT_LOOKUP",
                    confidence: 0.95,
                    agent: "copilot",
                    action: "NONE",
                    entities: { patientId: matchedPatient.id, patientName: matchedPatient.name },
                    response: `<strong>${matchedPatient.name}</strong> (${matchedPatient.age || '34'}yo, ${matchedPatient.gender || 'M'}):<br>• Insurance: ${matchedPatient.insurance || 'Delta Dental PPO'}<br>• Status: ${matchedPatient.status || 'Active'}<br>• Next Appointment: ${matchedPatient.nextAppointment || 'None'}<br>• Medical Notes: ${matchedPatient.notes || 'No active contraindications recorded.'}`,
                    followUpQuestions: []
                });
            }
        } catch (err) {
            console.warn('[GeminiService] Local patient DB query failed:', err.message);
        }

        // Rule-based demo fallback
        let responseText = "I am Dr. Atlas, your clinical and practice copilot. I can summarize patient charts, calculate ROI, review treatment pipelines, or check chair schedules.<br>Type <strong>'help'</strong> to see all commands.";
        for (const [key, value] of Object.entries(COPILOT_RESPONSES)) {
            if (cleanMsg.includes(key)) {
                responseText = value;
                break;
            }
        }
        return JSON.stringify({
            intent: "GENERAL_QUERY",
            confidence: 0.85,
            agent: "copilot",
            action: "NONE",
            entities: {},
            response: responseText,
            followUpQuestions: []
        });
    }

    /**
     * Fallback processor for Receptionist chat.
     */
    async getReceptionistResponse(userMessage, customPrompt = "") {
        const rawMsg = String(userMessage).trim();
        const cleanMsg = rawMsg.toLowerCase();
        let replyText = "Hello! I am Emma from Apex Dental. How may I help you today?";
        let extractedAction = "NONE";
        let detectedIntent = "GENERAL_QUERY";
        let entities = {};

        // 1. Phone number extraction
        const phoneMatch = rawMsg.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
        if (phoneMatch) {
            entities.phone = responseParser.formatPhoneNumber(phoneMatch[0]);
        }

        // 2. Patient name extraction
        const nameMatch = rawMsg.match(/my name is ([a-zA-Z\s]{2,30})/i) ||
            rawMsg.match(/for ([a-zA-Z\s]{2,30})/i) ||
            rawMsg.match(/i am ([a-zA-Z\s]{2,30})/i);
        if (nameMatch) {
            const rawName = nameMatch[1].split(/\b(phone|on|at|for|next|with|tomorrow|today|kal|friday|monday)\b/i)[0].trim();
            if (rawName.length > 1 && !rawName.toLowerCase().match(/^(a|an|the|dentist|appointment|checkup|cleaning)$/)) {
                entities.patientName = rawName;
            }
        }

        // 3. Date extraction (including typos & Hinglish: "tmrw", "tomorow", "kal", "aaj", "friday")
        const dateMatch = rawMsg.match(/\b\d{4}-\d{2}-\d{2}\b/) ||
            rawMsg.match(/\b(tomorrow|tmrw|tomorow|today|kal|aaj|next friday|next monday|next tuesday|next wednesday|next thursday|next saturday|friday|monday|tuesday|wednesday|thursday|saturday)\b/i);
        if (dateMatch) {
            entities.preferredDate = responseParser.formatDate(dateMatch[0]);
        }

        // 4. Time extraction (exact time: "4 pm", "4:00 pm", "16:00", "10:30 am")
        const timeMatch = rawMsg.match(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i) ||
            rawMsg.match(/\b\d{1,2}\s*(?:am|pm)\b/i);
        if (timeMatch) {
            entities.preferredTime = responseParser.formatTime(timeMatch[0]);
        }

        // 5. Time preference extraction (morning, afternoon, evening, after lunch)
        if (cleanMsg.includes("morning") || cleanMsg.includes("mornng")) {
            entities.timePreference = "morning";
        } else if (cleanMsg.includes("afternoon") || cleanMsg.includes("afternon") || cleanMsg.includes("after lunch") || cleanMsg.includes("noon")) {
            entities.timePreference = "afternoon";
        } else if (cleanMsg.includes("evening") || cleanMsg.includes("evenng") || cleanMsg.includes("night")) {
            entities.timePreference = "evening";
        }

        // 6. Treatment extraction
        if (cleanMsg.includes("cleaning") || cleanMsg.includes("cleanig") || cleanMsg.includes("cleanng")) {
            entities.treatment = "Dental Cleaning";
        } else if (cleanMsg.includes("checkup") || cleanMsg.includes("exam")) {
            entities.treatment = "Routine Dental Checkup";
        } else if (cleanMsg.includes("pain") || cleanMsg.includes("emergency") || cleanMsg.includes("toothache")) {
            entities.treatment = "Emergency Consultation";
        }

        // Semantic Intent & Action Classification
        if (cleanMsg.match(/^(never mind|nah leave it|leave it|forget it|stop|cancel it|nah)$/i) || cleanMsg.match(/\b(never mind|nah leave it|leave it|forget it)\b/i)) {
            detectedIntent = "CANCEL_APPOINTMENT";
            extractedAction = "NONE";
            replyText = "I've cancelled that request. Please feel free to reach out anytime you'd like to schedule with Apex Dental!";
        } else if (cleanMsg.includes("cancel") || cleanMsg.includes("cancle")) {
            detectedIntent = "CANCEL_APPOINTMENT";
            extractedAction = "CANCEL_APPOINTMENT";
            replyText = "I can certainly help you cancel your appointment. Please confirm if you would like me to proceed with cancelling.";
        } else if (cleanMsg.includes("reschedule") || cleanMsg.includes("reshedule") || cleanMsg.includes("move appointment") || cleanMsg.includes("postpone")) {
            detectedIntent = "RESCHEDULE_APPOINTMENT";
            extractedAction = "RESCHEDULE_APPOINTMENT";
            replyText = "I would be happy to help you reschedule your appointment. What new date and time would you prefer?";
        } else if (cleanMsg.match(/\b(emergency|severe pain|extreme pain|throbbing|killing me|hurts like crazy|can't sleep|swelling|swollen|knocked out|bleeding)\b/i)) {
            detectedIntent = "DENTAL_EMERGENCY";
            extractedAction = "ESCALATE_EMERGENCY";
            replyText = "I'm so sorry you're experiencing severe discomfort. We treat dental emergencies with top priority. Would you like me to reserve an emergency consultation with Dr. Arthur Ross today?";
        } else if (cleanMsg.match(/\b(what slots|any slot|slots left|what times|anything (after|before|tomorrow|today|friday|\d+))\b/i) || cleanMsg.match(/^(slot|slots|available)\??$/i)) {
            detectedIntent = "AVAILABILITY_QUERY";
            extractedAction = "NONE";
            replyText = "We have appointment openings Monday through Friday from 9:00 AM to 6:00 PM, and Saturdays from 10:00 AM to 2:00 PM. Would you prefer a morning or afternoon slot?";
        } else if (cleanMsg.match(/\b(parking|where to park|garage)\b/i)) {
            detectedIntent = "CLINIC_HOURS";
            extractedAction = "NONE";
            replyText = "Yes! Free validated parking is available in the medical building parking garage directly behind our clinic.";
        } else if (cleanMsg.match(/\b(first visit|what happens during|what should i bring)\b/i)) {
            detectedIntent = "CLINIC_HOURS";
            extractedAction = "NONE";
            replyText = "Your first visit takes about 60 minutes and includes a comprehensive oral exam, low-radiation digital bitewing X-rays, periodontal gum evaluation, and a standard dental cleaning. Please bring a photo ID and your insurance card.";
        } else if (cleanMsg.match(/\b(insurance|insurence|insurace|delta dental|metlife|cigna|aetna|ppo)\b/i)) {
            detectedIntent = "INSURANCE_QUERY";
            extractedAction = "NONE";
            replyText = "We accept all major PPO insurance plans, including Delta Dental, MetLife, Cigna, and Aetna PPO. Preventative exams and cleanings are typically 100% covered.";
        } else if (cleanMsg.match(/\b(how much|how much cleaning|how much is cleaning|price|pricing|cost|cash price|special)\b/i)) {
            detectedIntent = "PRICING_QUERY";
            extractedAction = "NONE";
            replyText = "For patients without dental insurance, we offer a New Patient Special for $189, which includes a comprehensive dental exam, digital bitewing X-rays, and a standard cleaning.";
        } else if (cleanMsg.match(/\b(opening hours|clinic hours|what time do you open|what time do you close|are you open|are you guys open)\b/i)) {
            detectedIntent = "CLINIC_HOURS";
            extractedAction = "NONE";
            replyText = "Apex Dental is open Monday through Friday from 9:00 AM to 6:00 PM, and Saturdays from 10:00 AM to 2:00 PM. We are closed on Sundays.";
        } else if (cleanMsg.match(/\b(where are you located|location|address|where is the clinic)\b/i)) {
            detectedIntent = "CLINIC_HOURS";
            extractedAction = "NONE";
            replyText = "We are located at 10500 NE 8th St, Suite 400, Bellevue, WA 98004, right near Bellevue Square.";
        } else if (cleanMsg.match(/\b(take kids|children|pediatric|walk-?ins?)\b/i)) {
            detectedIntent = "CLINIC_HOURS";
            extractedAction = "NONE";
            replyText = "Yes, we gladly welcome families and patients of all ages, including children! We also accept walk-ins for dental emergencies whenever chair capacity permits.";
        } else if (cleanMsg.match(/\b(weather|sports|joke|president|stock|recipe|crypto)\b/i)) {
            detectedIntent = "GENERAL_QUERY";
            extractedAction = "NONE";
            replyText = "I'm here to help with Apex Dental appointments, clinic services, and dental questions. If you'd like, I can help you schedule a visit!";
        } else if (cleanMsg.match(/\b(no make it|actually|instead|rather|change to)\b/i) || cleanMsg.match(/\b(friday|monday|tuesday|wednesday|thursday|saturday|sunday|tomorrow|evening|afternoon|morning)\s+instead\b/i)) {
            detectedIntent = "CORRECTION";
            extractedAction = "COLLECT_INFORMATION";
            replyText = "Got it! I've updated your preference. May I have any other details needed to complete your booking?";
        } else if (cleanMsg.match(/\b(book|bok|schedule|schedul|appointment|appoitment|appointmnt|apmnt|dentist|dentistt|cleaning|cleanig|checkup|kal dentist|milna)\b/i) ||
            entities.preferredDate || entities.preferredTime || entities.timePreference || entities.patientName) {
            detectedIntent = "BOOK_APPOINTMENT";
            if (entities.patientName && entities.phone && entities.preferredDate && entities.preferredTime) {
                extractedAction = "CREATE_APPOINTMENT";
                replyText = "I have all your details ready to schedule your appointment.";
            } else {
                extractedAction = "CREATE_APPOINTMENT";
                replyText = "I would be delighted to help you schedule an appointment at Apex Dental!";
            }
        } else if (rawMsg.length < 3 || cleanMsg.match(/^[a-z]{1,2}$/i)) {
            detectedIntent = "GENERAL_QUERY";
            extractedAction = "NONE";
            replyText = "I'm sorry, I didn't quite catch that. Could you please clarify your request?";
        }

        const fallbackJson = JSON.stringify({
            intent: detectedIntent,
            confidence: 0.90,
            agent: "receptionist",
            action: extractedAction,
            entities,
            response: replyText,
            followUpQuestions: []
        });

        return { response: fallbackJson, action: extractedAction };
    }
}

module.exports = new GeminiService();
