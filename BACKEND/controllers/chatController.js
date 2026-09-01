const aiOrchestrator = require('../ai/orchestrator/aiOrchestrator');

class ChatController {

    /**
     * Emma - AI Receptionist
     * POST /api/receptionist/chat
     */
    async handleReceptionistChat(req, res, next) {
        try {
            const {
                message,
                sessionId,
                patientId,
                clinicId,
                userId,
                confirmed
            } = req.body;

            if (!message || typeof message !== 'string' || !message.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Message payload is required'
                });
            }

            const result = await aiOrchestrator.process({
                message: message.trim(),
                agentType: 'receptionist',
                sessionId: sessionId || 'receptionist-session-default',
                patientId: patientId || null,
                clinicId: clinicId || null,
                userId: userId || null,
                confirmed: confirmed === true
            });

            return res.json(result);

        } catch (error) {
            console.error('[ChatController] Receptionist chat failed:', error.message);
            next(error);
        }
    }

    /**
     * Dr. Atlas - Clinical Copilot
     * POST /api/copilot/chat
     */
    async handleCopilotChat(req, res, next) {
        try {
            const {
                message,
                sessionId,
                patientId,
                clinicId,
                userId,
                confirmed
            } = req.body;

            if (!message || typeof message !== 'string' || !message.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'Message payload is required'
                });
            }

            const result = await aiOrchestrator.process({
                message: message.trim(),
                agentType: 'copilot',
                sessionId: sessionId || 'copilot-session-default',
                patientId: patientId || null,
                clinicId: clinicId || null,
                userId: userId || null,
                confirmed: confirmed === true
            });

            return res.json(result);

        } catch (error) {
            console.error('[ChatController] Copilot chat failed:', error.message);
            next(error);
        }
    }
}

module.exports = new ChatController();