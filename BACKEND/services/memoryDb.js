const {
    defaultPatients,
    defaultAppointments,
    defaultNotifications,
    defaultReceptionistLogs,
    defaultSettings
} = require('../utils/seedData');

// Stateful in-memory database fallback to ensure full local demo functionality
class MemoryDb {
    constructor() {
        this.patients = JSON.parse(JSON.stringify(defaultPatients));
        this.appointments = JSON.parse(JSON.stringify(defaultAppointments));
        this.notifications = JSON.parse(JSON.stringify(defaultNotifications));
        this.receptionistLogs = JSON.parse(JSON.stringify(defaultReceptionistLogs));
        this.settings = JSON.parse(JSON.stringify(defaultSettings));
    }

    // Patients CRUD
    getPatients() {
        return this.patients;
    }

    getPatient(id) {
        return this.patients.find(p => p.id === id);
    }

    createPatient(patient) {
        const newPatient = {
            id: patient.id || `pat-${Date.now()}`,
            ...patient,
            allergies: patient.allergies || [],
            preCare: patient.preCare || [],
            postCare: patient.postCare || [],
            notes: patient.notes || [],
            treatmentHistory: patient.treatmentHistory || [],
            findings: patient.findings || [],
            treatmentPlan: patient.treatmentPlan || []
        };
        this.patients.push(newPatient);
        return newPatient;
    }

    updatePatient(id, updatedData) {
        const index = this.patients.findIndex(p => p.id === id);
        if (index !== -1) {
            this.patients[index] = {
                ...this.patients[index],
                ...updatedData
            };
            return this.patients[index];
        }
        return null;
    }

    deletePatient(id) {
        const index = this.patients.findIndex(p => p.id === id);
        if (index !== -1) {
            const deleted = this.patients.splice(index, 1)[0];
            return deleted;
        }
        return null;
    }

    // Appointments CRUD
    getAppointments() {
        return this.appointments;
    }

    getAppointment(id) {
        return this.appointments.find(a => a.id === id);
    }

    createAppointment(appt) {
        const newAppt = {
            id: appt.id || `appt-${Date.now()}`,
            clinic_id: appt.clinic_id || 'bellevue',
            patientId: appt.patientId || `pat-${Date.now()}`,
            patientName: appt.patientName,
            dentistId: appt.dentistId || 'mercer',
            dentistName: appt.dentistName || 'Dr. Sarah Mercer',
            time: appt.time,
            duration: appt.duration || 60,
            treatment: appt.treatment || 'General Consultation',
            status: appt.status || 'pending',
            notes: appt.notes || ''
        };
        this.appointments.push(newAppt);

        // Update patient's nextAppointment info
        this.updatePatient(newAppt.patientId, { nextAppointment: newAppt.time });

        return newAppt;
    }

    updateAppointment(id, updatedData) {
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            this.appointments[index] = {
                ...this.appointments[index],
                ...updatedData
            };
            return this.appointments[index];
        }
        return null;
    }

    deleteAppointment(id) {
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            const deleted = this.appointments.splice(index, 1)[0];
            
            // Clear patient nextAppointment if matching
            const patient = this.getPatient(deleted.patientId);
            if (patient && patient.nextAppointment === deleted.time) {
                this.updatePatient(deleted.patientId, { nextAppointment: 'None' });
            }
            return deleted;
        }
        return null;
    }

    // Settings
    getSettings() {
        return this.settings;
    }

    updateSettings(updatedData) {
        this.settings = {
            ...this.settings,
            ...updatedData
        };
        return this.settings;
    }

    // Notifications
    getNotifications() {
        return this.notifications;
    }

    addNotification(notif) {
        const newNotif = {
            id: notif.id || `notif-${Date.now()}`,
            read: false,
            type: notif.type || 'info',
            text: notif.text,
            time: notif.time || 'Just now'
        };
        this.notifications.unshift(newNotif);
        return newNotif;
    }

    markAllNotificationsRead() {
        this.notifications.forEach(n => n.read = true);
        return true;
    }

    // Receptionist Logs
    getReceptionistLogs() {
        return this.receptionistLogs;
    }

    createReceptionistLog(log) {
        const newLog = {
            id: log.id || `log-${Date.now()}`,
            timestamp: log.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16),
            callerName: log.callerName,
            phone: log.phone,
            purpose: log.purpose,
            outcome: log.outcome,
            summary: log.summary,
            transcript: log.transcript || []
        };
        this.receptionistLogs.push(newLog);
        return newLog;
    }
}

const memoryDb = new MemoryDb();

module.exports = memoryDb;
