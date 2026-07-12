const patientService = require('../services/patientService');

class PatientController {
    async getAllPatients(req, res, next) {
        try {
            const patients = await patientService.getAllPatients();
            res.json(patients);
        } catch (e) {
            next(e);
        }
    }

    async getPatientById(req, res, next) {
        try {
            const patient = await patientService.getPatientById(req.params.id);
            if (!patient) {
                return res.status(404).json({ error: 'Patient not found' });
            }
            res.json(patient);
        } catch (e) {
            next(e);
        }
    }

    async createPatient(req, res, next) {
        try {
            const patient = await patientService.createPatient(req.body);
            res.status(201).json(patient);
        } catch (e) {
            next(e);
        }
    }

    async updatePatient(req, res, next) {
        try {
            const patient = await patientService.updatePatient(req.params.id, req.body);
            res.json(patient);
        } catch (e) {
            next(e);
        }
    }

    async deletePatient(req, res, next) {
        try {
            const result = await patientService.deletePatient(req.params.id);
            res.json(result);
        } catch (e) {
            next(e);
        }
    }

    async addPatientNote(req, res, next) {
        try {
            const { text, provider } = req.body;
            if (!text) {
                return res.status(400).json({ error: 'Note text is required' });
            }
            const note = await patientService.addPatientNote(req.params.id, text, provider);
            res.status(201).json(note);
        } catch (e) {
            next(e);
        }
    }

    async deletePatientNote(req, res, next) {
        try {
            await patientService.deletePatientNote(req.params.id, req.params.noteId);
            res.json({ status: 'success' });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new PatientController();
