const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { validateBody } = require('../middleware/validator');

router.get('/', appointmentController.getAllAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', validateBody(['patientName', 'time']), appointmentController.createAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
