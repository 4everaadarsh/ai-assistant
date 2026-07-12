const { supabase } = require('../config/supabase');
const memoryDb = require('./memoryDb');

class PatientService {
    async getAllPatients() {
        try {
            if (!supabase) throw new Error('Supabase not configured');
            const { data, error } = await supabase
                .from('patients')
                .select('*');
            
            if (error) throw error;
            if (!data || data.length === 0) {
                console.log('[PatientService] Supabase returned empty patients table. Seeding from fallback db.');
                // Seed Supabase with default patients for the user's convenience
                const defaultPatients = memoryDb.getPatients();
                for (const p of defaultPatients) {
                    await supabase.from('patients').insert(p);
                }
                return defaultPatients;
            }
            return data;
        } catch (e) {
            console.warn('[PatientService] Supabase fetch failed. Falling back to local memory database:', e.message);
            return memoryDb.getPatients();
        }
    }

    async getPatientById(id) {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (e) {
            console.warn(`[PatientService] Supabase fetch for patient ${id} failed. Falling back to memory database:`, e.message);
            return memoryDb.getPatient(id);
        }
    }

    async createPatient(patientData) {
        try {
            const newPatient = {
                id: patientData.id || `pat-${Date.now()}`,
                ...patientData
            };
            const { data, error } = await supabase
                .from('patients')
                .insert([newPatient])
                .select()
                .single();
            
            if (error) throw error;
            // Sync fallback db
            memoryDb.createPatient(newPatient);
            return data || newPatient;
        } catch (e) {
            console.warn('[PatientService] Supabase create patient failed. Executing on memory database:', e.message);
            return memoryDb.createPatient(patientData);
        }
    }

    async updatePatient(id, updatedData) {
        try {
            const { data, error } = await supabase
                .from('patients')
                .update(updatedData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            // Sync fallback db
            memoryDb.updatePatient(id, updatedData);
            return data || memoryDb.getPatient(id);
        } catch (e) {
            console.warn(`[PatientService] Supabase update patient ${id} failed. Executing on memory database:`, e.message);
            return memoryDb.updatePatient(id, updatedData);
        }
    }

    async deletePatient(id) {
        try {
            const { data, error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            // Sync fallback db
            memoryDb.deletePatient(id);
            return data || { id };
        } catch (e) {
            console.warn(`[PatientService] Supabase delete patient ${id} failed. Executing on memory database:`, e.message);
            return memoryDb.deletePatient(id);
        }
    }

    async addPatientNote(patientId, noteText, provider) {
        const patient = await this.getPatientById(patientId);
        if (!patient) throw new Error('Patient not found');

        const newNote = {
            id: `note-${Date.now()}`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            text: noteText,
            provider: provider || 'Dr. Sarah Mercer'
        };

        const notes = Array.isArray(patient.notes) ? [...patient.notes] : [];
        notes.unshift(newNote);

        await this.updatePatient(patientId, { notes });
        return newNote;
    }

    async deletePatientNote(patientId, noteId) {
        const patient = await this.getPatientById(patientId);
        if (!patient) throw new Error('Patient not found');

        const notes = Array.isArray(patient.notes) ? patient.notes.filter(n => n.id !== noteId) : [];
        await this.updatePatient(patientId, { notes });
        return true;
    }
}

module.exports = new PatientService();
