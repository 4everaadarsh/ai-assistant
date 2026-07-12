const { supabase } = require('../config/supabase');
const memoryDb = require('./memoryDb');
const patientService = require('./patientService');
const appointmentService = require('./appointmentService');

class SettingsService {
    async getFullState() {
        try {
            // Load settings
            let activeClinicId = 'bellevue';
            let activeUserId = 'mercer';
            let aiPrompt = memoryDb.getSettings().aiPrompt;

            try {
                if (!supabase) throw new Error('Supabase not configured');
                const { data: settingsData, error: settingsError } = await supabase
                    .from('settings')
                    .select('*');
                
                if (!settingsError && settingsData) {
                    settingsData.forEach(row => {
                        if (row.key === 'activeClinicId') activeClinicId = row.value;
                        if (row.key === 'activeUserId') activeUserId = row.value;
                        if (row.key === 'aiPrompt') aiPrompt = row.value;
                    });
                }
            } catch (e) {
                console.warn('[SettingsService] Failed to load settings from Supabase:', e.message);
                const memSettings = memoryDb.getSettings();
                activeClinicId = memSettings.activeClinicId || activeClinicId;
                activeUserId = memSettings.activeUserId || activeUserId;
                aiPrompt = memSettings.aiPrompt || aiPrompt;
            }

            // Load patients
            const patients = await patientService.getAllPatients();

            // Load appointments
            const appointments = await appointmentService.getAllAppointments();

            // Load notifications
            let notifications = [];
            try {
                const { data: notifData, error: notifError } = await supabase
                    .from('notifications')
                    .select('*')
                    .order('id', { ascending: false });
                
                if (!notifError && notifData) {
                    // map numeric read flag
                    notifications = notifData.map(n => ({
                        ...n,
                        read: !!n.read
                    }));
                } else {
                    notifications = memoryDb.getNotifications();
                }
            } catch (e) {
                notifications = memoryDb.getNotifications();
            }

            // Load receptionist logs
            let receptionistLogs = [];
            try {
                const { data: logsData, error: logsError } = await supabase
                    .from('receptionist_logs')
                    .select('*');
                
                if (!logsError && logsData) {
                    receptionistLogs = logsData.map(log => ({
                        ...log,
                        transcript: typeof log.transcript === 'string' ? JSON.parse(log.transcript) : log.transcript
                    }));
                } else {
                    receptionistLogs = memoryDb.getReceptionistLogs();
                }
            } catch (e) {
                receptionistLogs = memoryDb.getReceptionistLogs();
            }

            return {
                activeClinicId,
                activeUserId,
                aiPrompt,
                patients,
                appointments,
                notifications,
                receptionistLogs
            };
        } catch (e) {
            console.error('[SettingsService] Error loading full state:', e.message);
            // Complete memory fallback
            return {
                activeClinicId: memoryDb.getSettings().activeClinicId || 'bellevue',
                activeUserId: memoryDb.getSettings().activeUserId || 'mercer',
                aiPrompt: memoryDb.getSettings().aiPrompt,
                patients: memoryDb.getPatients(),
                appointments: memoryDb.getAppointments(),
                notifications: memoryDb.getNotifications(),
                receptionistLogs: memoryDb.getReceptionistLogs()
            };
        }
    }

    async updateSettings(settingsObject) {
        try {
            // settingsObject looks like { activeClinicId: '...' } or { aiPrompt: '...' }
            for (const [key, value] of Object.entries(settingsObject)) {
                await supabase
                    .from('settings')
                    .upsert({ key, value: String(value) });
            }
            memoryDb.updateSettings(settingsObject);
            return { status: 'success' };
        } catch (e) {
            console.warn('[SettingsService] Supabase update settings failed. Syncing local settings:', e.message);
            memoryDb.updateSettings(settingsObject);
            return { status: 'success' };
        }
    }

    async markAllNotificationsRead() {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .neq('id', 'placeholder'); // standard bulk update helper
            
            memoryDb.markAllNotificationsRead();
            return { status: 'success' };
        } catch (e) {
            console.warn('[SettingsService] Supabase notifications read failed. Mark read in memory:', e.message);
            memoryDb.markAllNotificationsRead();
            return { status: 'success' };
        }
    }

    async addReceptionistLog(logData) {
        try {
            const logId = logData.id || `log-${Date.now()}`;
            const newLog = {
                id: logId,
                timestamp: logData.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 16),
                callerName: logData.callerName,
                phone: logData.phone,
                purpose: logData.purpose,
                outcome: logData.outcome,
                summary: logData.summary,
                transcript: Array.isArray(logData.transcript) ? JSON.stringify(logData.transcript) : (logData.transcript || '[]')
            };

            await supabase
                .from('receptionist_logs')
                .insert([newLog]);
            
            memoryDb.createReceptionistLog({
                ...newLog,
                transcript: Array.isArray(logData.transcript) ? logData.transcript : JSON.parse(logData.transcript || '[]')
            });
            return { status: 'success', id: logId };
        } catch (e) {
            console.warn('[SettingsService] Supabase receptionist log write failed:', e.message);
            const created = memoryDb.createReceptionistLog(logData);
            return { status: 'success', id: created.id };
        }
    }
}

module.exports = new SettingsService();
