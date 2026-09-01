const geminiService = require('../../services/geminiService');
const { buildCopilotPrompt } = require('../prompts/copilotPrompt');
const responseParser = require('../parser/responseParser');

/**
 * DentalAI OS - Dr. Atlas Clinical Copilot Agent
 *
 * Handles clinician-facing AI conversations with structured output and fallback support.
 */
class CopilotAgent {
    constructor() {
        this.agentType = 'copilot';
    }

    async process({
        message,
        intent = 'GENERAL_QUERY',
        confidence = 0.5,
        context = {},
        conversationHistory = 'No previous conversation.'
    }) {
        if (!message || typeof message !== 'string') {
            throw new Error('A valid message is required.');
        }

        try {
            const prompt = buildCopilotPrompt({
                message,
                intent,
                confidence,
                context,
                conversationHistory
            });

            const rawResponse = await geminiService.callGemini(prompt);

            if (!rawResponse) {
                // Fall back to rule-based copilot response
                const fallbackJson = await geminiService.getCopilotResponse(message);
                return responseParser.parse(fallbackJson, {
                    intent,
                    confidence,
                    agent: this.agentType
                });
            }

            return responseParser.parse(rawResponse, {
                intent,
                confidence,
                agent: this.agentType
            });

        } catch (error) {
            console.error('[Copilot Agent] Processing error:', error.message);

            const fallbackJson = await geminiService.getCopilotResponse(message);
            return responseParser.parse(fallbackJson, {
                intent,
                confidence,
                agent: this.agentType
            });
        }
    }
}

module.exports = new CopilotAgent();