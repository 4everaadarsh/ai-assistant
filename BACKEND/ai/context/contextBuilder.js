const patientService = require('../../services/patientService');
const appointmentService = require('../../services/appointmentService');
const memoryDb = require('../../services/memoryDb');
const conversationMemory = require('../memory/conversationMemory');

/**
 * DentalAI OS - Enterprise Context Builder
 *
 * Constructs rich, secure application context for AI execution.
 * Provides current reference date/time, clinic operating rules, dentist roster,
 * active patient details, appointment schedules, and session entity state.
 */
class ContextBuilder {

    async build(options = {}) {
        const {
            agentType = 'receptionist',
            sessionId = null,
            patientId = null,
            clinicId = null,
            userId = null
        } = options;

        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const currentDayOfWeek = daysOfWeek[now.getDay()];

            const currentDateStr = `${year}-${month}-${day}`;
            const currentTimeStr = `${hours}:${minutes}`;

            const settings = memoryDb.getSettings();
            const activeClinicId = clinicId || settings.activeClinicId || 'bellevue';
            const activeUserId = userId || settings.activeUserId || 'mercer';

            // Accumulated entities from session memory
            const sessionEntities = sessionId ? conversationMemory.getEntities(sessionId) : {};

            const context = {
                agentType,
                referenceClock: {
                    currentDate: currentDateStr,
                    currentTime: currentTimeStr,
                    currentDayOfWeek,
                    timezone: 'PST (Pacific Standard Time)'
                },
                activeLocation: {
                    clinicId: activeClinicId,
                    name: activeClinicId === 'redmond' ? 'Apex Dental, Redmond' : 'Apex Dental, Bellevue',
                    address: activeClinicId === 'redmond'
                        ? '15600 Redmond Way, Suite 201, Redmond, WA 98052'
                        : '10500 NE 8th St, Suite 400, Bellevue, WA 98004 (near Bellevue Square)',
                    hours: activeClinicId === 'redmond'
                        ? 'Mon-Fri: 8:00 AM - 5:00 PM | Sat-Sun: Closed'
                        : 'Mon-Fri: 9:00 AM - 6:00 PM | Sat: 10:00 AM - 2:00 PM | Sun: Closed',
                    parking: 'Free validated parking is available in the medical building garage directly behind the clinic.',
                    pediatricPolicy: 'Yes, we welcome patients of all ages, including children and families for pediatric dental exams, cleanings, and fluoride treatments.',
                    walkInPolicy: 'We prioritize scheduled appointments to minimize wait times, but walk-ins are accommodated for emergency triage and pain relief based on chair availability.',
                    firstVisitInfo: 'First visits typically take about 60 minutes and include a comprehensive oral examination, low-radiation digital bitewing X-rays, periodontal gum evaluation, and a standard prophylaxis cleaning.',
                    whatToBring: 'Please bring a valid photo ID, your dental insurance card (if applicable), and a list of any current medications.',
                    cleaningDuration: 'A standard routine dental cleaning and exam takes approximately 45 to 60 minutes.',
                    dentists: [
                        { id: 'mercer', name: 'Dr. Sarah Mercer, DDS', specialty: 'General & Cosmetic Dentistry' },
                        { id: 'ross', name: 'Dr. Arthur Ross, DMD', specialty: 'Endodontics (Root Canals & Pain Specialist)' },
                        { id: 'taylor', name: 'Dr. Michael Taylor, DDS', specialty: 'General Dentist' },
                        { id: 'white', name: 'Dr. Kelly White, DDS', specialty: 'Orthodontist' }
                    ]
                },
                acceptedInsurances: [
                    'Delta Dental PPO',
                    'MetLife Dental PPO',
                    'Cigna PPO',
                    'Aetna PPO'
                ],
                nonInsuranceCashSpecial: {
                    offerName: 'New Patient Special',
                    price: '$189',
                    includes: ['Comprehensive Visual Dental Exam', 'Full Digital Bitewing X-Rays', 'Standard Prophylaxis Cleaning']
                },
                currentPatient: null,
                appointments: [],
                sessionEntities,
                generatedAt: new Date().toISOString()
            };

            // Attempt to resolve patient (from patientId parameter or sessionEntities)
            const targetPatientId = patientId || sessionEntities.patientId;
            const targetPatientName = sessionEntities.patientName;

            if (targetPatientId) {
                const patient = await patientService.getPatientById(targetPatientId);
                if (patient) {
                    context.currentPatient = this.sanitizePatient(patient);
                }
            } else if (targetPatientName) {
                const allPatients = await patientService.getAllPatients();
                const search = String(targetPatientName).toLowerCase().trim();
                const matched = allPatients.find(p => String(p.name).toLowerCase().includes(search));
                if (matched) {
                    context.currentPatient = this.sanitizePatient(matched);
                }
            }

            // Load appointments
            const appointments = await appointmentService.getAllAppointments();
            context.appointments = appointments.map(appt => ({
                id: appt.id,
                clinicId: appt.clinic_id,
                patientId: appt.patientId,
                patientName: appt.patientName,
                dentistId: appt.dentistId,
                dentistName: appt.dentistName,
                time: appt.time,
                duration: appt.duration,
                treatment: appt.treatment,
                status: appt.status
            }));

            return context;

        } catch (error) {
            console.error('[Context Builder] Failed to build context:', error.message);
            return {
                agentType,
                referenceClock: {
                    currentDate: new Date().toISOString().substring(0, 10),
                    currentTime: '09:00',
                    currentDayOfWeek: 'Wednesday',
                    timezone: 'PST'
                },
                activeLocation: { clinicId: clinicId || 'bellevue' },
                currentPatient: null,
                appointments: [],
                sessionEntities: {},
                generatedAt: new Date().toISOString(),
                contextError: true
            };
        }
    }

    /**
     * Sanitize patient details for AI prompt safety.
     */
    sanitizePatient(patient) {
        return {
            id: patient.id,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone || null,
            email: patient.email || null,
            insurance: patient.insurance || null,
            allergies: patient.allergies || [],
            medicalHistory: patient.medicalHistory || '',
            lastVisit: patient.lastVisit || null,
            nextAppointment: patient.nextAppointment || null,
            riskStatus: patient.riskStatus || null,
            riskRationale: patient.riskRationale || null,
            treatmentHistory: patient.treatmentHistory || [],
            findings: patient.findings || [],
            treatmentPlan: patient.treatmentPlan || [],
            notes: patient.notes || []
        };
    }
}

module.exports = new ContextBuilder();