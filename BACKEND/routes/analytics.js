const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/dashboard', analyticsController.getDashboardMetrics);
router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/patients', analyticsController.getPatientAnalytics);

module.exports = router;
