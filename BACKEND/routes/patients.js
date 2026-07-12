const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { validateBody } = require('../middleware/validator');

router.get('/', patientController.getAllPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', validateBody(['name']), patientController.createPatient);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

// Progress Notes routes
router.post('/:id/notes', validateBody(['text']), patientController.addPatientNote);
router.delete('/:id/notes/:noteId', patientController.deletePatientNote);

module.exports = router;
