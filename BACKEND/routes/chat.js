const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { validateBody } = require('../middleware/validator');

router.post('/receptionist/chat', validateBody(['message']), chatController.handleReceptionistChat);
router.post('/copilot/chat', validateBody(['message']), chatController.handleCopilotChat);

module.exports = router;
