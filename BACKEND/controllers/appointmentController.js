const appointmentService = require('../services/appointmentService');

class AppointmentController {
    async getAllAppointments(req, res, next) {
        try {
            const appointments = await appointmentService.getAllAppointments();
            res.json(appointments);
        } catch (e) {
            next(e);
        }
    }

    async getAppointmentById(req, res, next) {
        try {
            const appointment = await appointmentService.getAppointmentById(req.params.id);
            if (!appointment) {
                return res.status(404).json({ error: 'Appointment not found' });
            }
            res.json(appointment);
        } catch (e) {
            next(e);
        }
    }

    async createAppointment(req, res, next) {
        try {
            const appointment = await appointmentService.createAppointment(req.body);
            res.status(201).json(appointment);
        } catch (e) {
            next(e);
        }
    }

    async updateAppointment(req, res, next) {
        try {
            const appointment = await appointmentService.updateAppointment(req.params.id, req.body);
            res.json(appointment);
        } catch (e) {
            next(e);
        }
    }

    async deleteAppointment(req, res, next) {
        try {
            const result = await appointmentService.deleteAppointment(req.params.id);
            res.json(result);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new AppointmentController();
