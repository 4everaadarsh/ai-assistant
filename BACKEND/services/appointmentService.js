const { supabase } = require('../config/supabase');
const memoryDb = require('./memoryDb');
const patientService = require('./patientService');

class AppointmentService {
    async getAllAppointments() {
        try {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase
                .from('appointments')
                .select('*');
            
            if (error) throw error;
            if (!data || data.length === 0) {
                console.log('[AppointmentService] Supabase returned empty appointments table. Seeding from fallback db.');
                const defaultAppointments = memoryDb.getAppointments();
                for (const a of defaultAppointments) {
                    await supabase.from('appointments').insert(a);
                }
                return defaultAppointments;
            }
            return data;
        } catch (e) {
            console.warn('[AppointmentService] Supabase fetch failed. Falling back to local memory database:', e.message);
            return memoryDb.getAppointments();
        }
    }

    async getAppointmentById(id) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (e) {
            console.warn(`[AppointmentService] Supabase fetch for appointment ${id} failed. Falling back to memory database:`, e.message);
            return memoryDb.getAppointment(id);
        }
    }

    async createAppointment(apptData) {
        try {
            const newAppt = {
                id: apptData.id || `appt-${Date.now()}`,
                clinic_id: apptData.clinic_id || 'bellevue',
                patientId: apptData.patientId || `pat-${Date.now()}`,
                patientName: apptData.patientName,
                dentistId: apptData.dentistId || 'mercer',
                dentistName: apptData.dentistName || 'Dr. Sarah Mercer',
                time: apptData.time,
                duration: apptData.duration || 60,
                treatment: apptData.treatment || 'General Consultation',
                status: apptData.status || 'pending',
                notes: apptData.notes || ''
            };

            const { data, error } = await supabase
                .from('appointments')
                .insert([newAppt])
                .select()
                .single();
            
            if (error) throw error;

            // Sync fallback db
            memoryDb.createAppointment(newAppt);

            // Side effect: update patient's next appointment
            await patientService.updatePatient(newAppt.patientId, { nextAppointment: newAppt.time });

            // Side effect: Add a notification
            await this.addBookingNotification(newAppt);

            return data || newAppt;
        } catch (e) {
            console.warn('[AppointmentService] Supabase create appointment failed. Executing on memory database:', e.message);
            const created = memoryDb.createAppointment(apptData);
            
            // Sync side effect on memory database
            memoryDb.addNotification({
                type: 'info',
                text: `Appointment scheduled for ${created.patientName} on ${created.time.split(' ')[0]} at ${created.time.split(' ')[1]}.`
            });

            return created;
        }
    }

    async updateAppointment(id, updatedData) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .update(updatedData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            // Sync fallback db
            memoryDb.updateAppointment(id, updatedData);
            return data || memoryDb.getAppointment(id);
        } catch (e) {
            console.warn(`[AppointmentService] Supabase update appointment ${id} failed. Executing on memory database:`, e.message);
            return memoryDb.updateAppointment(id, updatedData);
        }
    }

    async deleteAppointment(id) {
        try {
            const appt = await this.getAppointmentById(id);
            const { data, error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;

            // Sync fallback db
            memoryDb.deleteAppointment(id);

            if (appt) {
                // Clear patient next appointment
                const patient = await patientService.getPatientById(appt.patientId);
                if (patient && patient.nextAppointment === appt.time) {
                    await patientService.updatePatient(appt.patientId, { nextAppointment: 'None' });
                }
                // Add cancellation notification
                await this.addCancellationNotification(appt);
            }

            return data || { id };
        } catch (e) {
            console.warn(`[AppointmentService] Supabase delete appointment ${id} failed. Executing on memory database:`, e.message);
            return memoryDb.deleteAppointment(id);
        }
    }

    async updateAppointmentStatus(id, newStatus) {
        return this.updateAppointment(id, { status: newStatus });
    }

    async addBookingNotification(appt) {
        const notif = {
            id: `notif-${Date.now()}`,
            read: false,
            type: 'info',
            text: `Appointment scheduled for ${appt.patientName} on ${appt.time.split(' ')[0]} at ${appt.time.split(' ')[1]}.`,
            time: 'Just now'
        };
        try {
            await supabase.from('notifications').insert([notif]);
            memoryDb.addNotification(notif);
        } catch (e) {
            memoryDb.addNotification(notif);
        }
    }

    async addCancellationNotification(appt) {
        const notif = {
            id: `notif-${Date.now()}`,
            read: false,
            type: 'warning',
            text: `Appointment for ${appt.patientName} was cancelled.`,
            time: 'Just now'
        };
        try {
            await supabase.from('notifications').insert([notif]);
            memoryDb.addNotification(notif);
        } catch (e) {
            memoryDb.addNotification(notif);
        }
    }
}

module.exports = new AppointmentService();
