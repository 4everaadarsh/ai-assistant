const { genAI } = require('../config/gemini');
const appointmentService = require('./appointmentService');
const patientService = require('./patientService');

// Local fallback responses for Copilot
const COPILOT_RESPONSES = {
    "help": `<strong>Trained DentalAI Copilot Commands:</strong><br>
• Type <strong>'John Doe'</strong> or <strong>'Mark Vance'</strong>: Patient summary.<br>
• Type <strong>'roi'</strong> or <strong>'savings'</strong>: AI practice savings.<br>
• Type <strong>'pipeline'</strong> or <strong>'treatment'</strong>: Actionable opportunity queue.<br>
• Type <strong>'risks'</strong> or <strong>'alerts'</strong>: Clinical diagnostic flags.<br>
• Type <strong>'billing'</strong>: Claims and collection efficiency logs.<br>
• Type <strong>'schedule'</strong>: Load summary for Mercer & Ross chairs today.`,
    
    "john": `<strong>John Doe</strong> (34yo, M):<br>
• Insurance: Delta Dental PPO<br>
• AI Pathology Flags: Tooth #14 (Deep Caries, 94% conf) & #32 (Impacted Molar, 98% conf).<br>
• Treatment Planned: Resin Composite on #14 ($380) and surgical extraction #32 ($650). Both proposed. Let me know if you would like me to draft pre-op guidance warnings.`,
    
    "mark": `<strong>Mark Vance</strong> (52yo, M):<br>
• Insurance: Cigna PPO (Allergic to Sulfa Drugs)<br>
• Scheduled Today: Root Canal Consult #30 at 11:30 AM with Dr. Arthur Ross.<br>
• Note: Scheduled via AI emergency triage routing for severe throbbing molar pain. Fasting laboratory work completed last Thursday.`,
    
    "sarah": `<strong>Sarah Jenkins</strong> (28yo, F):<br>
• Insurance: MetLife Dental PPO<br>
• Status: Completed standard Cleaning and Prophylaxis at 2:00 PM today. AI detected zero active caries.<br>
• Pending: Custom maxillary nightguard proposed ($450) to mitigate incisal grinding attrition.`,
    
    "roi": `<strong>DentalAI OS - Active Practice ROI:</strong><br>
• Hours Saved: 235 hrs (receptionist administrative task automation)<br>
• Missed Calls Recovered: 210 out-of-hours leads ($12,600 values)<br>
• AI Generated Bookings: 340 appointments ($54,800 value generated)<br>
• Net Monthly Cost Mitigation: $4,250`,
    
    "pipeline": `<strong>Outstanding Treatment Pipeline:</strong><br>
• Total Pipeline Value: $24,500<br>
• High Actionable Queue: John Doe ($2,400 crown), Mark Vance ($4,500 implant consult), Sarah Jenkins ($350 hygiene recall)`,
    
    "risks": `<strong>Clinical AI Pathology Risks:</strong><br>
• John Doe: Tooth #14 (Deep Caries, 94% conf) & #32 (Impacted Molar, 98% conf).<br>
• Mark Vance: Tooth #30 (Periapical Abscess, 96% conf).<br>
• Sarah Jenkins: Tooth #8 (Bruxism incisal attrition wear, 72% conf).`,
    
    "billing": `<strong>Billing Operations Performance (June 2026):</strong><br>
• Billed amount: $84,210<br>
• Claims submitted: $68,450 (92.5% first-pass clean claim submission)<br>
• Collection Efficiency: 96.8% (aided by automated billing SMS reminder alerts)`,
    
    "schedule": `<strong>Today's Schedule Summary:</strong><br>
• Total appointments: 3 scheduled<br>
• Dr. Mercer chair load: John Doe (10 AM), Sarah Jenkins (2 PM)<br>
• Dr. Ross chair load: Mark Vance emergency exam (11:30 AM)<br>
• AI Auto-Confirmation Rate: 100% of outreach logs successfully booked.`
};

class GeminiService {
    async callGemini(promptText, systemInstruction = "") {
        if (!genAI) return null;
        try {
            // Get model instance (use gemini-1.5-flash as it is highly compatible and fast)
            const model = genAI.getGenerativeModel({
                model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
                systemInstruction: systemInstruction || undefined
            });
            const result = await model.generateContent(promptText);
            const response = await result.response;
            return response.text();
        } catch (e) {
            console.warn('[GeminiService] API call failed, fell back to local rules:', e.message);
            return null;
        }
    }

    async getCopilotResponse(userMessage) {
        const cleanMsg = userMessage.toLowerCase().trim();
        
        // System instruction builder for Copilot
        const systemInstruction = `You are DentalAI Copilot, an advanced clinical assistant and practice management advisor for Apex Dental.
You have access to patient databases, scheduling, billing records, and clinical logs.
Active patients include:
1. John Doe: 34yo, M. Tooth #14 has Deep Caries, #32 is an Impacted Molar. Resin Composite planned on #14 ($380).
2. Sarah Jenkins: 28yo, F. Nightguard proposed ($450) for mild attrition.
3. Mark Vance: 52yo, M. Severe pain lower right molar (#30). Periapical Abscess diagnosed. Root Canal Consult #30 scheduled today at 11:30 AM with Dr. Arthur Ross. Allergic to Sulfa.

Operations & ROI metrics:
- 235 hours saved, 210 missed calls recovered ($12,600 value), 340 appointments booked ($54,800 value), monthly savings $4,250.
- Outstanding treatment pipeline: $24,500 total value.
- June 2026 Billing: $84,210 billed, 96.8% collection efficiency.

Give concise, professional answers. If the user asks about scheduling, patient records, ROI, clinical risks, or treatment plans, give specific details based on this data.`;

        // Attempt Gemini API call
        const apiResponse = await this.callGemini(userMessage, systemInstruction);
        if (apiResponse) {
            return apiResponse;
        }

        // Rule-based local fallback
        let responseText = "I am trained on your practice databases. I can calculate ROI, list pipeline values, audit billing, or identify clinical alerts.<br>Type <strong>'help'</strong> to see all commands.";
        for (const [key, value] of Object.entries(COPILOT_RESPONSES)) {
            if (cleanMsg.includes(key)) {
                responseText = value;
                break;
            }
        }
        return responseText;
    }

    async getReceptionistResponse(userMessage, customPrompt = "") {
        const cleanMsg = userMessage.toLowerCase().trim();
        const systemInstruction = customPrompt || `You are Alexis, the automated AI receptionist for Apex Dental.
Clinic Locations: Bellevue (Mon-Fri 9-6, Sat 10-2) and Redmond (Mon-Fri 8-5).
Dentists: Dr. Sarah Mercer (General & Cosmetic) and Dr. Arthur Ross (Endodontist).
We take Delta Dental, MetLife, Cigna, and Aetna PPO.
Be friendly, professional, and seek to book appointments, triaging pain emergencies appropriately.`;

        // Attempt Gemini API call
        const apiResponse = await this.callGemini(userMessage, systemInstruction);
        let action = null;

        if (apiResponse) {
            // Heuristic booking trigger based on AI response content
            const lowRes = apiResponse.toLowerCase();
            if (lowRes.includes("confirm") || lowRes.includes("booked") || lowRes.includes("reserve") || lowRes.includes("scheduled")) {
                if (cleanMsg.includes("mark") || cleanMsg.includes("vance")) {
                    action = {
                        type: "book",
                        booking: {
                            patientId: "pat-003",
                            patientName: "Mark Vance",
                            dentistId: "ross",
                            dentistName: "Dr. Arthur Ross",
                            time: "2026-06-08 11:30",
                            duration: 90,
                            treatment: "Emergency Consultation #30",
                            status: "ai-confirmed",
                            notes: "Autonomously booked by Alexis AI during live call chat."
                        }
                    };
                    await appointmentService.createAppointment(action.booking);
                } else if (cleanMsg.includes("jessica") || cleanMsg.includes("miller")) {
                    action = {
                        type: "book",
                        booking: {
                            patientId: "pat-new-jessica",
                            patientName: "Jessica Miller",
                            dentistId: "mercer",
                            dentistName: "Dr. Sarah Mercer",
                            time: "2026-06-12 14:00",
                            duration: 60,
                            treatment: "Routine Hygiene Cleaning",
                            status: "ai-confirmed",
                            notes: "Autonomously booked by Alexis AI during live call chat."
                        }
                    };
                    await appointmentService.createAppointment(action.booking);
                }
            }
            return { response: apiResponse, action };
        }

        // Rule-based local fallback for AI Receptionist
        let replyText = "Thank you for sharing. Could you specify if you are looking to book a routine cleaning, or if you are experiencing tooth pain?";
        
        if (cleanMsg.includes("pain") || cleanMsg.includes("hurt") || cleanMsg.includes("ache") || cleanMsg.includes("emergency") || cleanMsg.includes("throbbing")) {
            replyText = "I'm so sorry you're dealing with pain. Throbbing molar pain is often linked to localized root/nerve issues. I have open same-day emergency slots today with Dr. Ross (our endodontist) at 11:30 AM or Dr. Mercer at 3:00 PM. Would you like me to reserve one of those?";
        } else if (cleanMsg.includes("yes") && (cleanMsg.includes("11:30") || cleanMsg.includes("ross") || cleanMsg.includes("emergency") || cleanMsg.includes("book"))) {
            replyText = "Got it! I have confirmed your Emergency Consultation with Dr. Arthur Ross for today at 11:30 AM. Please avoid hot or freezing liquids and chewing on that side. We'll send the location and health history intake links via SMS.";
            action = {
                type: "book",
                booking: {
                    patientId: "pat-003",
                    patientName: "Mark Vance",
                    dentistId: "ross",
                    dentistName: "Dr. Arthur Ross",
                    time: "2026-06-08 11:30",
                    duration: 90,
                    treatment: "Emergency Consultation #30",
                    status: "ai-confirmed",
                    notes: "Autonomously booked by Alexis AI during fallback call."
                }
            };
            await appointmentService.createAppointment(action.booking);
        } else if (cleanMsg.includes("insurance") || cleanMsg.includes("metlife") || cleanMsg.includes("delta") || cleanMsg.includes("ppo")) {
            replyText = "We accept all major PPO insurance networks, including Delta Dental, MetLife, Cigna, and Aetna. We do not accept HMO or Medicaid plans. Standard diagnostics, cleanings, and exams are typically covered at 100%.";
        } else if (cleanMsg.includes("cost") || cleanMsg.includes("price") || cleanMsg.includes("cleaning") || cleanMsg.includes("cash") || cleanMsg.includes("how much")) {
            replyText = "For patients without dental insurance, we offer a New Patient Special for $189. This includes a comprehensive visual examination, full digital bitewing X-Rays, and a standard prophylaxis cleaning. Would you like to schedule that?";
        } else if (cleanMsg.includes("reschedule") || cleanMsg.includes("move") || cleanMsg.includes("change")) {
            replyText = "I can definitely help reschedule. Could you please provide your full name and the preferred day (e.g., next Tuesday or Wednesday) you'd like to shift your appointment to?";
        } else {
            replyText = "Hello! I am Alexis, your AI clinic receptionist. I can help you schedule appointments, verify insurance networks, check cleaning prices, or triage acute toothaches. What can I do for you today?";
        }

        return { response: replyText, action };
    }
}

module.exports = new GeminiService();
