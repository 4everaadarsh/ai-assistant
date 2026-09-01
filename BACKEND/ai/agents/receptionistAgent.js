const geminiService = require('../../services/geminiService');
const responseParser = require('../parser/responseParser');
const { buildReceptionistPrompt } = require('../prompts/receptionistPrompt');

class ReceptionistAgent {

    /**
     * Emma - Enterprise AI Receptionist
     */
    async process({
        message,
        intent,
        confidence,
        context,
        conversationHistory
    }) {
        try {
            const prompt = buildReceptionistPrompt({
                message,
                intent,
                confidence,
                context,
                conversationHistory
            });

            const rawResponse = await geminiService.callGemini(prompt);

            if (!rawResponse) {
                const fallbackResult = await geminiService.getReceptionistResponse(message);
                const parsedFallback = responseParser.parse(fallbackResult.response, {
                    intent,
                    confidence,
                    agent: 'receptionist'
                });
                const finalIntent = (parsedFallback.intent && parsedFallback.intent !== 'GENERAL_QUERY') ? parsedFallback.intent : intent;
                return {
                    intent: finalIntent,
                    confidence: parsedFallback.confidence ?? confidence,
                    agent: 'receptionist',
                    action: parsedFallback.action || 'NONE',
                    entities: parsedFallback.entities || {},
                    response: parsedFallback.response || "Hello! I am Emma from Apex Dental. How may I assist you today?",
                    followUpQuestions: parsedFallback.followUpQuestions || []
                };
            }

            const parsed = responseParser.parse(rawResponse, {
                intent,
                confidence,
                agent: 'receptionist'
            });

            return {
                intent: parsed.intent || intent,
                confidence: parsed.confidence ?? confidence,
                agent: 'receptionist',
                action: parsed.action || 'NONE',
                entities: parsed.entities || {},
                response: parsed.response || "How may I help you today?",
                followUpQuestions: parsed.followUpQuestions || []
            };

        } catch (error) {
            console.error('[ReceptionistAgent] Processing failed:', error);
            return {
                intent,
                confidence,
                agent: 'receptionist',
                action: 'NONE',
                entities: {},
                response: "I'm sorry, I encountered an issue. How may I help you with your appointment today?",
                followUpQuestions: []
            };
        }
    }
}

module.exports = new ReceptionistAgent();