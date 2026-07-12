const geminiService = require('../services/geminiService');

class ChatController {
    async handleReceptionistChat(req, res, next) {
        try {
            const { message, prompt } = req.body;
            if (!message) {
                return res.status(400).json({ error: 'Message payload is required' });
            }
            const botResponse = await geminiService.getReceptionistResponse(message, prompt);
            res.json({
                response: botResponse.response,
                action: botResponse.action
            });
        } catch (e) {
            next(e);
        }
    }

    async handleCopilotChat(req, res, next) {
        try {
            const { message } = req.body;
            if (!message) {
                return res.status(400).json({ error: 'Message payload is required' });
            }
            const reply = await geminiService.getCopilotResponse(message);
            res.json({
                response: reply
            });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new ChatController();
