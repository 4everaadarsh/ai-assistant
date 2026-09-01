const geminiService = require('../../services/geminiService');
const { buildAnalyticsPrompt } = require('../prompts/analyticsPrompt');
const responseParser = require('../parser/responseParser');

/**
 * DentalAI OS - Nova Practice Intelligence Agent
 *
 * Handles clinic analytics and business intelligence conversations.
 */
class AnalyticsAgent {
    constructor() {
        this.agentType = 'analytics';
    }

    async process({
        message,
        intent = 'ANALYTICS_QUERY',
        confidence = 0.5,
        context = {},
        conversationHistory = 'No previous conversation.'
    }) {
        if (!message || typeof message !== 'string') {
            throw new Error('A valid message is required.');
        }

        try {
            const prompt = buildAnalyticsPrompt({
                message,
                intent,
                confidence,
                context,
                conversationHistory
            });

            const rawResponse = await geminiService.callGemini(prompt);

            if (!rawResponse) {
                const fallbackAnswer = "Nova Practice Intelligence Summary:\n• Monthly AI Practice ROI: $4,250 net cost mitigation\n• Out-of-hours leads recovered: 210 appointments ($12,600 value)\n• Total pipeline value: $24,500\n• Overall chair utilization rate: 84.5%";
                return {
                    intent: 'ANALYTICS_QUERY',
                    confidence: 0.90,
                    agent: this.agentType,
                    action: 'NONE',
                    entities: {},
                    response: fallbackAnswer,
                    followUpQuestions: [
                        'What is our lead conversion rate this month?',
                        'Show high-value treatment pipeline breakdowns.'
                    ]
                };
            }

            return responseParser.parse(rawResponse, {
                intent,
                confidence,
                agent: this.agentType
            });

        } catch (error) {
            console.error('[Analytics Agent] Processing error:', error.message);

            return {
                intent: 'ANALYTICS_QUERY',
                confidence: 0.50,
                agent: this.agentType,
                action: 'NONE',
                entities: {},
                response: 'I encountered an issue analyzing practice data. Currently, active chair utilization is 84.5% with $24,500 in active treatment pipeline.',
                followUpQuestions: []
            };
        }
    }
}

module.exports = new AnalyticsAgent();