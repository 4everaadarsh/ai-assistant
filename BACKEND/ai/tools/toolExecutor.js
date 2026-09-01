const appointmentService = require('../../services/appointmentService');
const patientService = require('../../services/patientService');

/**
 * DentalAI OS - Enterprise Tool Executor
 *
 * Executes verified AI actions through backend domain services.
 * Implements strict input validation, phone & date formatting, and deterministic execution.
 */

class ToolExecutor {

    async execute(aiResponse = {}, executionContext = {}) {
        const action = String(aiResponse.action || 'NONE').toUpperCase();
        const entities = aiResponse.entities || {};

        try {
            switch (action) {

                case 'NONE':
                case 'COLLECT_INFORMATION':
                case 'HUMAN_HANDOFF':
                case 'HUMAN_REVIEW':
                case 'ESCALATE_EMERGENCY':
                case 'REQUEST_MORE_DATA':
                case 'GENERATE_REPORT':
                    return {
                        executed: false,
                        action,
                        reason: 'No database write action required.'
                    };

                case 'CREATE_APPOINTMENT':
                    return await this.createAppointment(entities, executionContext);

                case 'CANCEL_APPOINTMENT':
                    return await this.cancelAppointment(entities, executionContext);

                case 'RESCHEDULE_APPOINTMENT':
                    return await this.rescheduleAppointment(entities, executionContext);

                case 'LOOKUP_PATIENT':
                    return await this.lookupPatient(entities, executionContext);

                case 'CREATE_CLINICAL_NOTE':
                    return await this.createClinicalNote(entities, executionContext);

                default:
                    console.warn(`[Tool Executor] Unsupported AI action: ${action}`);
                    return {
                        executed: false,
                        action,
                        reason: 'Unsupported action.'
                    };
            }

        } catch (error) {
            console.error(`[Tool Executor] Failed to execute ${action}:`, error.message);
            return {
                executed: false,
                action,
                error: error.message
            };
        }
    }

    async createAppointment(entities, executionContext) {
        const patientName = entities.patientName || executionContext.patientName;
        const phone = entities.phone || executionContext.phone;
        const patientId = entities.patientId || executionContext.patientId;

        const appointmentTime = entities.preferredTime || entities.time;
        const appointmentDate = entities.preferredDate || entities.date;

        const missing = [];
        if (!patientName) missing.push('patientName');
        if (!phone && !patientId) missing.push('phone');
        if (!appointmentDate) missing.push('preferredDate');
        if (!appointmentTime) missing.push('preferredTime');

        if (missing.length > 0) {
            return this.missingInformation('CREATE_APPOINTMENT', missing);
        }

        // Validate phone digits count
        const phoneDigits = String(phone || '').replace(/\D/g, '');
        if (!patientId && phoneDigits.length < 10) {
            return {
                executed: false,
                action: 'CREATE_APPOINTMENT',
                reason: 'Invalid phone number format.',
                missingFields: ['valid 10-digit phone number']
            };
        }

        // Validate Date format YYYY-MM-DD
        const dateMatch = String(appointmentDate).match(/^\d{4}-\d{2}-\d{2}$/);
        if (!dateMatch) {
            return {
                executed: false,
                action: 'CREATE_APPOINTMENT',
                reason: 'Invalid date format. Expected YYYY-MM-DD.',
                missingFields: ['preferredDate (YYYY-MM-DD)']
            };
        }

        // Validate Time format HH:mm
        const timeMatch = String(appointmentTime).match(/^\d{1,2}:\d{2}$/);
        if (!timeMatch) {
            return {
                executed: false,
                action: 'CREATE_APPOINTMENT',
                reason: 'Invalid time format. Expected HH:mm.',
                missingFields: ['preferredTime (HH:mm)']
            };
        }

        // 1. Reject past appointments
        const requestedDateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
        if (isNaN(requestedDateTime.getTime()) || requestedDateTime.getTime() < Date.now()) {
            return {
                executed: false,
                action: 'CREATE_APPOINTMENT',
                reason: 'The requested appointment date or time is in the past. Please choose a future time.',
                missingFields: ['future preferredDate and preferredTime']
            };
        }

        // 2. Respect clinic working hours (Mon-Sat, 08:00 - 18:00)
        const hour = requestedDateTime.getHours();
        const dayOfWeek = requestedDateTime.getDay(); // 0 = Sun
        if (dayOfWeek === 0 || hour < 8 || hour >= 18) {
            return {
                executed: false,
                action: 'CREATE_APPOINTMENT',
                reason: 'The clinic is closed at the requested time. Operating hours are Monday to Saturday, 8:00 AM to 6:00 PM.',
                missingFields: ['preferredTime within working hours (08:00 - 18:00, Mon-Sat)']
            };
        }

        // 3. Fetch existing appointments to check availability and conflicts
        const existingAppts = await appointmentService.getAllAppointments();
        const combinedTime = `${appointmentDate} ${appointmentTime}`;
        const targetDentist = entities.dentistName || 'Dr. Sarah Mercer';

        // Detect dentist schedule conflict
        const dentistConflict = existingAppts.find(a =>
            a.status !== 'cancelled' &&
            a.time === combinedTime &&
            (a.dentistName === targetDentist || a.dentistId === (entities.dentistId || 'mercer'))
        );
        if (dentistConflict) {
            return {
                executed: false,
                action: 'CREATE_APPOINTMENT',
                reason: `The requested time slot (${combinedTime}) is unavailable for ${targetDentist}. Please offer another time slot.`,
                conflict: true
            };
        }

        // Detect duplicate booking / patient conflict
        const patientConflict = existingAppts.find(a =>
            a.status !== 'cancelled' &&
            a.time === combinedTime &&
            (String(a.patientName).toLowerCase() === String(patientName).toLowerCase() || (phone && a.phone === phone))
        );
        if (patientConflict) {
            return {
                executed: false,
                action: 'CREATE_APPOINTMENT',
                reason: `An active appointment already exists for ${patientName} at ${combinedTime}.`,
                duplicate: true
            };
        }

        // Check if patient exists or lookup by name
        let resolvedPatientId = patientId;
        if (!resolvedPatientId && patientName) {
            const allPatients = await patientService.getAllPatients();
            const search = String(patientName).toLowerCase().trim();
            const found = allPatients.find(p => String(p.name).toLowerCase().includes(search));
            if (found) {
                resolvedPatientId = found.id;
            }
        }

        const appointment = await appointmentService.createAppointment({
            clinic_id: executionContext.clinicId || 'bellevue',
            patientId: resolvedPatientId || `pat-${Date.now()}`,
            patientName,
            dentistId: entities.dentistId || executionContext.provider || 'mercer',
            dentistName: targetDentist,
            time: combinedTime,
            duration: Number(entities.duration) || 60,
            treatment: entities.treatment || 'General Consultation',
            status: 'pending',
            notes: entities.notes || `Booked via Emma AI Receptionist (Contact: ${phone || 'N/A'})`
        });

        return {
            executed: true,
            action: 'CREATE_APPOINTMENT',
            data: appointment
        };
    }

    async cancelAppointment(entities, executionContext) {
        let appointmentId = entities.appointmentId;

        // Auto-lookup appointment if ID not explicitly provided
        if (!appointmentId) {
            const patientName = entities.patientName || executionContext.patientName;
            const patientId = entities.patientId || executionContext.patientId;
            const appointments = await appointmentService.getAllAppointments();

            const match = appointments.find(a =>
                (patientId && a.patientId === patientId) ||
                (patientName && String(a.patientName).toLowerCase().includes(String(patientName).toLowerCase()))
            );

            if (match) {
                appointmentId = match.id;
            }
        }

        if (!appointmentId) {
            return this.missingInformation('CANCEL_APPOINTMENT', ['appointmentId or patientName']);
        }

        const existing = await appointmentService.getAppointmentById(appointmentId);
        if (!existing) {
            return {
                executed: false,
                action: 'CANCEL_APPOINTMENT',
                reason: 'Appointment record not found in system.'
            };
        }

        const deleted = await appointmentService.deleteAppointment(appointmentId);
        return {
            executed: true,
            action: 'CANCEL_APPOINTMENT',
            data: deleted
        };
    }

    async rescheduleAppointment(entities, executionContext) {
        let appointmentId = entities.appointmentId;
        const newDate = entities.newDate || entities.preferredDate;
        const newTime = entities.newTime || entities.preferredTime;

        if (!newDate || !newTime) {
            const missing = [];
            if (!newDate) missing.push('newDate');
            if (!newTime) missing.push('newTime');
            return this.missingInformation('RESCHEDULE_APPOINTMENT', missing);
        }

        // Auto-lookup appointment if ID not provided
        if (!appointmentId) {
            const patientName = entities.patientName || executionContext.patientName;
            const patientId = entities.patientId || executionContext.patientId;
            const appointments = await appointmentService.getAllAppointments();

            const match = appointments.find(a =>
                (patientId && a.patientId === patientId) ||
                (patientName && String(a.patientName).toLowerCase().includes(String(patientName).toLowerCase()))
            );

            if (match) {
                appointmentId = match.id;
            }
        }

        if (!appointmentId) {
            return this.missingInformation('RESCHEDULE_APPOINTMENT', ['appointmentId or patientName']);
        }

        const existing = await appointmentService.getAppointmentById(appointmentId);
        if (!existing) {
            return {
                executed: false,
                action: 'RESCHEDULE_APPOINTMENT',
                reason: 'Appointment record not found.'
            };
        }

        const updated = await appointmentService.updateAppointment(appointmentId, {
            time: `${newDate} ${newTime}`
        });

        return {
            executed: true,
            action: 'RESCHEDULE_APPOINTMENT',
            data: updated
        };
    }

    async lookupPatient(entities, executionContext) {
        const patientId = entities.patientId || executionContext.patientId;
        const patientName = entities.patientName || executionContext.patientName;

        if (patientId) {
            const patient = await patientService.getPatientById(patientId);
            return {
                executed: Boolean(patient),
                action: 'LOOKUP_PATIENT',
                data: patient || null,
                reason: patient ? undefined : 'Patient not found.'
            };
        }

        if (patientName) {
            const allPatients = await patientService.getAllPatients();
            const search = String(patientName).toLowerCase().trim();
            const matches = allPatients.filter(p => String(p.name).toLowerCase().includes(search));
            return {
                executed: matches.length > 0,
                action: 'LOOKUP_PATIENT',
                data: matches,
                reason: matches.length ? undefined : 'No matching patient found.'
            };
        }

        return this.missingInformation('LOOKUP_PATIENT', ['patientId or patientName']);
    }

    async createClinicalNote(entities, executionContext) {
        let patientId = entities.patientId || executionContext.patientId;
        const patientName = entities.patientName || executionContext.patientName;
        const noteText = entities.noteText || entities.text;
        const provider = entities.provider || executionContext.provider || 'Dr. Sarah Mercer';

        if (!patientId && patientName) {
            const allPatients = await patientService.getAllPatients();
            const search = String(patientName).toLowerCase().trim();
            const matched = allPatients.find(p => String(p.name).toLowerCase().includes(search));
            if (matched) {
                patientId = matched.id;
            }
        }

        if (!patientId) {
            return this.missingInformation('CREATE_CLINICAL_NOTE', ['patientId or patientName']);
        }

        if (!noteText) {
            return this.missingInformation('CREATE_CLINICAL_NOTE', ['noteText']);
        }

        const note = await patientService.addPatientNote(patientId, noteText, provider);
        return {
            executed: true,
            action: 'CREATE_CLINICAL_NOTE',
            data: note
        };
    }

    missingInformation(action, fields) {
        return {
            executed: false,
            action,
            reason: 'Missing required fields.',
            missingFields: fields
        };
    }
}

module.exports = new ToolExecutor();
