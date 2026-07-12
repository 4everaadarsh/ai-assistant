const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/state', settingsController.getFullState);
router.post('/settings', settingsController.updateSettings);
router.put('/notifications/read-all', settingsController.markAllNotificationsRead);
router.post('/receptionist/logs', settingsController.addReceptionistLog);

module.exports = router;
