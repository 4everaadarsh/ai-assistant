/* ==========================================================================
   DENTALAI OS - STATE STORE & MOCK DATABASE (ENHANCED)
   Manages reactive clinic records, patient CRM logs, and AI conversation logic.
   ========================================================================== */

class ClinicStore extends EventTarget {
    constructor() {
        super();
        this.initializeData();
        this.loadStateFromBackend();
    }

    async loadStateFromBackend() {
        try {
            const res = await fetch('https://dentalai-os-backend.onrender.com/api/state');
            if (res.ok) {
                const data = await res.json();
                this.activeClinicId = data.activeClinicId;
                this.currentUser.clinicId = data.activeClinicId;
                this.aiSettings.prompt = data.aiPrompt;
                
                // Select active user based on settings
                if (data.activeUserId === 'mercer') {
                    this.currentUser.name = "Dr. Sarah Mercer, DDS";
                    this.currentUser.role = "Lead Clinician";
                    this.currentUser.avatar = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100";
                } else if (data.activeUserId === 'ross') {
                    this.currentUser.name = "Dr. Arthur Ross, DMD";
                    this.currentUser.role = "Endodontist Specialist";
                    this.currentUser.avatar = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100";
                }
                
                this.patients = data.patients;
                this.notifications = data.notifications;
                this.receptionistLogs = data.receptionistLogs;
                
                // Map appointments
                this.appointmentsByClinic = {
                    "bellevue": data.appointments.filter(a => a.clinic_id === 'bellevue'),
                    "redmond": data.appointments.filter(a => a.clinic_id === 'redmond')
                };
                
                this.notify('schedule-updated');
                this.notify('clinic-changed', this.getClinicConfig());
                this.notify('notification-added');
                this.notify('user-changed', this.currentUser);
            }
        } catch (e) {
            console.error("Failed to load state from backend, using local mock fallback:", e);
        }
    }

    notify(event, data = {}) {
        this.dispatchEvent(new CustomEvent(event, { detail: data }));
    }

    initializeData() {
        // Active session info
        this.currentUser = {
            name: "Dr. Sarah Mercer, DDS",
            role: "Lead Clinician",
            avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100",
            clinicId: "bellevue"
        };

        // Clinics database
        this.activeClinicId = "bellevue";
        this.clinics = {
            "bellevue": {
                name: "Apex Dental, Bellevue",
                timezone: "EST",
                currency: "USD",
                currencySymbol: "$",
                hours: "Mon-Fri: 9 AM - 6 PM | Sat: 10 AM - 2 PM",
                dentists: [
                    { id: "mercer", name: "Dr. Sarah Mercer, DDS", specialty: "General & Cosmetic" },
                    { id: "ross", name: "Dr. Arthur Ross, DMD", specialty: "Endodontist" }
                ]
            },
            "redmond": {
                name: "Apex Dental, Redmond",
                timezone: "EST",
                currency: "USD",
                currencySymbol: "$",
                hours: "Mon-Fri: 8 AM - 5 PM | Sat: Closed",
                dentists: [
                    { id: "taylor", name: "Dr. Michael Taylor, DDS", specialty: "General Dentist" },
                    { id: "white", name: "Dr. Kelly White, DDS", specialty: "Orthodontist" }
                ]
            }
        };

        // AI Receptionist default prompt settings
        this.aiSettings = {
            prompt: `You are the AI Receptionist for Apex Dental in Bellevue and Redmond.
Bellevue Hours: Mon-Fri: 9am-6pm, Sat: 10am-2pm, Sun: Closed.
Redmond Hours: Mon-Fri: 8am-5pm, Sat: Closed.

Rules:
1. Greet patients warmly. Always identify yourself as the clinic's AI Assistant.
2. For booking: Search clinic availability, suggest up to 3 slots. Get name & phone number.
3. For emergency pain: Identify tooth number if possible, triage urgency, offer same-day slots.
4. Insurance: We are in-network with Delta Dental, MetLife, Cigna, and Aetna PPO.
5. Do NOT make definitive clinical diagnoses. Always refer to dentist evaluation.`
        };

        // Rich Patient records (CRM)
        this.patients = [
            {
                id: "pat-001",
                name: "John Doe",
                age: 34,
                gender: "Male",
                dob: "1992-04-12",
                phone: "(206) 555-0142",
                email: "john.doe@email.com",
                insurance: "Delta Dental PPO",
                lastVisit: "2026-02-14",
                nextAppointment: "2026-06-08 10:00",
                riskStatus: "medium", // low, medium, high (AI assessed)
                riskRationale: "AI identified accelerated calculus accumulation on lower anteriors and localized pocketing (4-5mm) in #2-3 molars, indicating mild Stage I Periodontitis.",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
                allergies: ["Penicillin"],
                medicalHistory: "Type 2 Diabetes (controlled), High Blood Pressure",
                preCare: [
                    "Take prescribed pre-medication 1 hour before appointment.",
                    "Ensure you eat a light breakfast and take your normal insulin dosage."
                ],
                postCare: [
                    "Avoid eating hot or sticky foods for at least 24 hours.",
                    "Use warm saline rinse 3-4 times a day starting tomorrow."
                ],
                notes: [
                    { id: "note-1", date: "2026-02-14 11:00", text: "Patient reported slight sensitivity to cold on tooth #14. Advised monitoring. Hygiene recall scheduled.", provider: "Dr. Sarah Mercer" },
                    { id: "note-2", date: "2026-02-14 10:15", text: "Prophylaxis completed. Mild subgingival calculus noted on lower anteriors. Scaling and root planing not required at this time.", provider: "Jane Smith, RDH" }
                ],
                treatmentHistory: [
                    { id: "h-1", date: "2026-02-14", tooth: "Global", procedure: "Comprehensive Exam & X-rays", cost: 240, status: "Completed", dentist: "Dr. Sarah Mercer" },
                    { id: "h-2", date: "2025-08-10", tooth: "#3", procedure: "Resin-Based Composite - 2 Surfaces", cost: 280, status: "Completed", dentist: "Dr. Sarah Mercer" }
                ],
                findings: [
                    { id: "find-1", tooth: 14, type: "Deep Caries", confidence: 94, severity: "high", desc: "Radiolucency extending into the middle third of dentin. Risk of pulpal exposure. Recommend immediate composite restoration or inlay.", x: 260, y: 140, r: 24 },
                    { id: "find-2", tooth: 19, type: "Interproximal Decay", confidence: 81, severity: "medium", desc: "Incipient enamel lesion on distal aspect. Recommended monitoring and topical fluoride application.", x: 380, y: 220, r: 18 },
                    { id: "find-3", tooth: 32, type: "Impacted Molar", confidence: 98, severity: "high", desc: "Mesioangular impaction. Root development complete. Crowding lower arch. Refer for surgical extraction.", x: 580, y: 240, r: 32 }
                ],
                treatmentPlan: [
                    { id: "tp-1", phase: "Phase 1: Restorative", tooth: "#14", procedure: "Resin-Based Composite - 3 Surfaces", cost: 380, status: "proposed" },
                    { id: "tp-2", phase: "Phase 1: Restorative", tooth: "#19", procedure: "Topical Fluoride Treatment & Sealant", cost: 120, status: "completed" },
                    { id: "tp-3", phase: "Phase 2: Surgical", tooth: "#32", procedure: "Surgical Extraction - Impacted Molar", cost: 650, status: "proposed" }
                ],
                xrayUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600"
            },
            {
                id: "pat-002",
                name: "Sarah Jenkins",
                age: 28,
                gender: "Female",
                dob: "1998-08-25",
                phone: "(206) 555-0189",
                email: "sarah.j@email.com",
                insurance: "MetLife Dental PPO",
                lastVisit: "2025-11-20",
                nextAppointment: "2026-06-08 14:00",
                riskStatus: "low",
                riskRationale: "Excellent hygiene. Enamel density high. AI detected zero active caries. Pocket depths 1-3mm globally.",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
                allergies: ["None"],
                medicalHistory: "Asthma",
                preCare: [
                    "Bring rescue inhaler to the office."
                ],
                postCare: [
                    "Continue brushing twice daily with fluoride toothpaste and flossing nightly."
                ],
                notes: [
                    { id: "note-3", date: "2025-11-20 14:30", text: "Standard prophylaxis and bite-wing radiographs completed. Restorations intact.", provider: "Dr. Sarah Mercer" }
                ],
                treatmentHistory: [
                    { id: "h-3", date: "2025-11-20", tooth: "Global", procedure: "Prophylaxis - Adult Cleaning", cost: 150, status: "Completed", dentist: "Dr. Sarah Mercer" },
                    { id: "h-4", date: "2025-05-15", tooth: "#8", procedure: "Incisal Composite bonding", cost: 310, status: "Completed", dentist: "Dr. Sarah Mercer" }
                ],
                findings: [
                    { id: "find-4", tooth: 8, type: "Subtle Incisal Wear", confidence: 72, severity: "low", desc: "Mild attrition due to nocturnal bruxism. Recommend custom nightguard.", x: 180, y: 120, r: 15 }
                ],
                treatmentPlan: [
                    { id: "tp-4", phase: "Phase 1: Preventative", tooth: "Global", procedure: "Prophylaxis - Adult Cleaning", cost: 150, status: "completed" },
                    { id: "tp-5", phase: "Phase 2: Appliance", tooth: "Arch", procedure: "Custom Maxillary Nightguard", cost: 450, status: "proposed" }
                ],
                xrayUrl: ""
            },
            {
                id: "pat-003",
                name: "Mark Vance",
                age: 52,
                gender: "Male",
                dob: "1974-01-05",
                phone: "(425) 555-0291",
                email: "mvance74@email.com",
                insurance: "Cigna PPO",
                lastVisit: "2024-05-10",
                nextAppointment: "None (Awaiting Callback)",
                riskStatus: "high",
                riskRationale: "Patient has not visited in 2 years. Severe molar pain self-reported. AI analysis of historic panoramas and current intake notes indicates high risk of pulpal necrosis #30.",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100",
                allergies: ["Sulfa Drugs"],
                medicalHistory: "Heart murmur",
                preCare: [
                    "Pre-medicate with Amoxicillin (2g) 1 hour prior to appointment."
                ],
                postCare: [
                    "Take Ibuprofen (600mg) every 6 hours for pain control.",
                    "If swelling increases or breathing becomes difficult, contact clinic emergency line immediately."
                ],
                notes: [
                    { id: "note-4", date: "2024-05-10 09:30", text: "Patient reports history of heart murmur. Requires antibiotic pre-medication for future invasive procedures.", provider: "Dr. Sarah Mercer" }
                ],
                treatmentHistory: [
                    { id: "h-5", date: "2024-05-10", tooth: "Global", procedure: "Comprehensive Exam & Prophylaxis", cost: 290, status: "Completed", dentist: "Dr. Sarah Mercer" }
                ],
                findings: [
                    { id: "find-5", tooth: 30, type: "Periapical Abscess", confidence: 96, severity: "high", desc: "Dark radiolucency around distal root apex. Widened periodontal ligament. Patient symptomatic to percussion and thermal testing. Arthur Ross consultation scheduled.", x: 420, y: 230, r: 28 }
                ],
                treatmentPlan: [
                    { id: "tp-6", phase: "Phase 1: Endodontic", tooth: "#30", procedure: "Root Canal Therapy (Molar)", cost: 1100, status: "proposed" },
                    { id: "tp-7", phase: "Phase 2: Restorative", tooth: "#30", procedure: "Porcelain-Fused-to-Metal Crown", cost: 1250, status: "proposed" }
                ],
                xrayUrl: ""
            }
        ];

        // Appointments Database split by Clinic
        this.appointmentsByClinic = {
            "bellevue": [
                {
                    id: "appt-1",
                    patientId: "pat-001",
                    patientName: "John Doe",
                    dentistId: "mercer",
                    dentistName: "Dr. Sarah Mercer",
                    time: "2026-06-08 10:00",
                    duration: 60,
                    treatment: "Composite Restoration #14",
                    status: "ai-confirmed",
                    notes: "AI confirmed via automated SMS outreach yesterday."
                },
                {
                    id: "appt-2",
                    patientId: "pat-002",
                    patientName: "Sarah Jenkins",
                    dentistId: "mercer",
                    dentistName: "Dr. Sarah Mercer",
                    time: "2026-06-08 14:00",
                    duration: 60,
                    treatment: "Standard Clean & Exam",
                    status: "ai-confirmed",
                    notes: "Confirmed by AI Receptionist call flow."
                },
                {
                    id: "appt-4",
                    patientId: "pat-003",
                    patientName: "Mark Vance",
                    dentistId: "ross",
                    dentistName: "Dr. Arthur Ross",
                    time: "2026-06-08 11:30",
                    duration: 90,
                    treatment: "Root Canal Consult #30",
                    status: "pending",
                    notes: "Scheduled via AI emergency call route."
                }
            ],
            "redmond": [
                {
                    id: "appt-red-1",
                    patientId: "pat-001",
                    patientName: "John Doe",
                    dentistId: "taylor",
                    dentistName: "Dr. Michael Taylor",
                    time: "2026-06-09 09:30",
                    duration: 60,
                    treatment: "New Patient Consultation",
                    status: "ai-confirmed",
                    notes: "Redmond location intake form submitted."
                },
                {
                    id: "appt-red-2",
                    patientId: "pat-002",
                    patientName: "Sarah Jenkins",
                    dentistId: "white",
                    dentistName: "Dr. Kelly White",
                    time: "2026-06-11 11:00",
                    duration: 60,
                    treatment: "Orthodontic Aligners Check",
                    status: "pending",
                    notes: "Awaiting retainer scan confirmation."
                }
            ]
        };

        // Automated AI Receptionist Call Logs
        this.receptionistLogs = [
            {
                id: "log-1",
                timestamp: "2026-06-08 09:12",
                callerName: "Jessica Miller",
                phone: "(206) 555-0211",
                purpose: "Routine Cleaning Scheduling",
                outcome: "booked",
                summary: "Patient called requesting a cleaning. AI confirmed details, verified insurance (Delta Dental PPO), and booked appointment for June 12th at 2:00 PM.",
                transcript: [
                    { sender: "ai", text: "Thank you for calling Apex Dental. This is Alexis, the AI receptionist. How can I help you today?" },
                    { sender: "patient", text: "Hi, I need to schedule my regular 6-month cleaning. I think I am due." },
                    { sender: "ai", text: "I can absolutely check that for you. What is your full name and date of birth?" },
                    { sender: "patient", text: "Jessica Miller, birthdate is March 5th, 1995." },
                    { sender: "ai", text: "Thank you, Jessica. Yes, you are due for your cleaning. I have Dr. Mercer available on Friday, June 12th at 2:00 PM, or Monday, June 15th at 10:00 AM. Do either of those work?" },
                    { sender: "patient", text: "The Friday one at 2:00 PM is perfect." },
                    { sender: "ai", text: "Great. I have reserved that slot. We have your insurance down as Delta Dental PPO, is that still correct?" },
                    { sender: "patient", text: "Yes, that's correct." },
                    { sender: "ai", text: "Excellent! Your appointment is confirmed for Friday, June 12th at 2:00 PM. We will send a calendar link to your phone shortly." }
                ]
            },
            {
                id: "log-2",
                timestamp: "2026-06-07 16:40",
                callerName: "Mark Vance",
                phone: "(425) 555-0291",
                purpose: "Severe Molar pain triage",
                outcome: "booked",
                summary: "Patient reported severe throbbing pain in lower right molar (#30). AI assessed high urgency, offered same-day emergency slot with Dr. Ross (Endodontist), and completed booking.",
                transcript: [
                    { sender: "ai", text: "Thank you for calling Apex Dental. This is Alexis, the AI receptionist. How can I help you today?" },
                    { sender: "patient", text: "Hi... I've had this terrible toothache since last night. It's pounding and I can't sleep. Can I see a doctor today?" },
                    { sender: "ai", text: "I'm so sorry to hear you are in pain, Mark. We take dental emergencies very seriously. Is the pain in a specific area, and are you experiencing any facial swelling?" },
                    { sender: "patient", text: "It's on my lower right side, one of the big molars. No swelling yet, but it hurts to drink cold water or bite down." },
                    { sender: "ai", text: "Got it. That sounds like it could be a nerve inflammation or an abscess. I have an emergency slot open with our specialist, Dr. Ross, today at 11:30 AM. Can you make it in?" },
                    { sender: "patient", text: "Yes, please! I will leave work now." },
                    { sender: "ai", text: "Perfect. I have booked you for today at 11:30 AM. Please do not eat or drink anything extremely hot or cold, and avoid chewing on that side. We look forward to helping you." }
                ]
            }
        ];

        // Active Notifications feed
        this.notifications = [
            { id: "notif-1", read: false, type: "alert", text: "AI Diagnostic Warning: Potential deep caries #14 on John Doe requires clinical review.", time: "10 min ago" },
            { id: "notif-2", read: false, type: "info", text: "AI Receptionist successfully booked Mark Vance for today's emergency slot (11:30 AM).", time: "1 hour ago" },
            { id: "notif-3", read: true, type: "warning", text: "Reschedule pending: Sarah Jenkins requested to move cleaning from 2 PM to 3 PM.", time: "4 hours ago" }
        ];

        // Scenarios for AI Receptionist simulator
        this.simulationScenarios = [
            {
                id: "scen-pain",
                title: "Acute Toothache Emergency (Mark Vance)",
                description: "Simulate a patient calling with severe throbbing tooth pain needing immediate same-day slot.",
                steps: [
                    { delay: 1000, sender: "patient", text: "Hello? I have this awful toothache. It started yesterday and now I can't sleep. Do you have anything open today?" },
                    { delay: 3000, sender: "ai", text: "I'm so sorry you're dealing with that, Mark. Tooth pain can be extremely disruptive. To help me triage this, is the pain sharp, throbbing, or sensitive to temperature, and do you notice any swelling?" },
                    { delay: 2500, sender: "patient", text: "It's a constant throb in my lower right molar. Cold water makes it shoot pain. No swelling, but I can't bite down." },
                    { delay: 3500, sender: "ai", text: "Based on those symptoms, you may have pulpal inflammation or a periapical issue on tooth #30. Dr. Ross, our root canal specialist, has a same-day emergency opening today at 11:30 AM. Does that work for you?" },
                    { delay: 2000, sender: "patient", text: "Yes, absolutely. I'll take it. What should I do until then?" },
                    { delay: 4000, sender: "ai", text: "Excellent, I've booked you in for 11:30 AM today. Please avoid biting on that side, and avoid very hot or cold liquids. If you have amoxicillin prescribed, remember to take it. We will see you soon, Mark." }
                ],
                targetBooking: {
                    patientId: "pat-003",
                    patientName: "Mark Vance",
                    dentistId: "ross",
                    dentistName: "Dr. Arthur Ross",
                    time: "2026-06-08 11:30",
                    duration: 90,
                    treatment: "Emergency Exam #30",
                    status: "ai-confirmed",
                    notes: "Booked via emergency simulation call"
                }
            },
            {
                id: "scen-clean",
                title: "Routine Hygiene Checkup (Jessica Miller)",
                description: "Simulate booking a routine 6-month cleaning, checking insurance details.",
                steps: [
                    { delay: 1000, sender: "patient", text: "Hi, I'd like to book a regular cleaning and checkup. I haven't been in for about 6 months." },
                    { delay: 3000, sender: "ai", text: "Hello! I can definitely help with that. Could you please provide your full name and date of birth so I can locate your record?" },
                    { delay: 2000, sender: "patient", text: "Jessica Miller, DOB is March 5th, 1995." },
                    { delay: 3500, sender: "ai", text: "Thank you, Jessica! I see you last visited in November. I have openings for a routine cleaning with our hygienist and Dr. Mercer next Friday, June 12th at 2:00 PM, or Monday, June 15th at 10:00 AM. Do either of those work?" },
                    { delay: 2000, sender: "patient", text: "Let's do the Friday one at 2:00 PM. Do you still have my insurance?" },
                    { delay: 3000, sender: "ai", text: "Perfect, I have booked you for Friday, June 12th at 2:00 PM. Yes, we still have your Delta Dental PPO plan on file. We will text you a digital pre-check link a day before. See you then!" }
                ],
                targetBooking: {
                    patientId: "new-pat-2",
                    patientName: "Jessica Miller",
                    dentistId: "mercer",
                    dentistName: "Dr. Sarah Mercer",
                    time: "2026-06-12 14:00",
                    duration: 60,
                    treatment: "Hygiene Clean & Exam",
                    status: "ai-confirmed",
                    notes: "Booked via routine checkup simulation"
                }
            }
        ];
    }

    // --- State Methods ---

    // Active Clinic Switch
    getClinicConfig() {
        return this.clinics[this.activeClinicId];
    }

    switchClinic(clinicId) {
        if (this.clinics[clinicId]) {
            this.activeClinicId = clinicId;
            this.currentUser.clinicId = clinicId;

            // Sync setting to backend in background
            fetch('https://dentalai-os-backend.onrender.com/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeClinicId: clinicId })
            }).catch(err => console.error("Failed to sync clinic switch to backend:", err));

            this.notify('clinic-changed', this.getClinicConfig());
            return true;
        }
        return false;
    }

    switchUser(userId) {
        if (userId === 'mercer') {
            this.currentUser = {
                name: "Dr. Sarah Mercer, DDS",
                role: "Lead Clinician",
                avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100",
                clinicId: this.activeClinicId
            };
        } else if (userId === 'ross') {
            this.currentUser = {
                name: "Dr. Arthur Ross, DMD",
                role: "Endodontist Specialist",
                avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=100",
                clinicId: this.activeClinicId
            };
        }

        // Sync setting to backend in background
        fetch('https://dentalai-os-backend.onrender.com/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activeUserId: userId })
        }).catch(err => console.error("Failed to sync user switch to backend:", err));

        this.notify('user-changed', this.currentUser);
        return this.currentUser;
    }

    // Patients CRUD & search
    getPatients() {
        return this.patients;
    }

    getPatientById(id) {
        return this.patients.find(p => p.id === id);
    }

    updatePatient(patientId, updatedData) {
        const index = this.patients.findIndex(p => p.id === patientId);
        if (index !== -1) {
            this.patients[index] = { ...this.patients[index], ...updatedData };

            // Sync update to backend in background
            fetch(`https://dentalai-os-backend.onrender.com/api/patients/${patientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            }).catch(err => console.error("Failed to sync patient update to backend:", err));

            this.notify('patient-updated', this.patients[index]);
            return true;
        }
        return false;
    }

    // Clinical Notes CRUD
    addPatientNote(patientId, noteText, provider = "Dr. Sarah Mercer") {
        const patient = this.getPatientById(patientId);
        if (patient) {
            const newNote = {
                id: `note-${Date.now()}`,
                date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                text: noteText,
                provider: provider
            };
            patient.notes.unshift(newNote);

            // Sync note to backend
            fetch(`https://dentalai-os-backend.onrender.com/api/patients/${patientId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: noteText, provider: provider, id: newNote.id })
            }).then(async res => {
                if (res.ok) {
                    const serverNote = await res.json();
                    newNote.id = serverNote.id;
                    newNote.date = serverNote.date;
                }
            }).catch(err => console.error("Failed to sync new patient note to backend:", err));

            this.notify('patient-notes-updated', patient);
            return newNote;
        }
        return null;
    }

    deletePatientNote(patientId, noteId) {
        const patient = this.getPatientById(patientId);
        if (patient) {
            patient.notes = patient.notes.filter(n => n.id !== noteId);

            // Sync note delete to backend
            fetch(`https://dentalai-os-backend.onrender.com/api/patients/${patientId}/notes/${noteId}`, {
                method: 'DELETE'
            }).catch(err => console.error("Failed to sync note delete to backend:", err));

            this.notify('patient-notes-updated', patient);
            return true;
        }
        return false;
    }

    // Appointments CRUD
    getAppointments() {
        return this.appointmentsByClinic[this.activeClinicId] || [];
    }

    addAppointment(appt) {
        const newAppt = {
            id: appt.id || `appt-${Date.now()}`,
            patientId: appt.patientId || `pat-${Date.now()}`,
            patientName: appt.patientName,
            dentistId: appt.dentistId || "mercer",
            dentistName: appt.dentistName || "Dr. Sarah Mercer",
            time: appt.time,
            duration: appt.duration || 60,
            treatment: appt.treatment || "General Consultation",
            status: appt.status || "pending",
            notes: appt.notes || ""
        };

        if (!this.appointmentsByClinic[this.activeClinicId]) {
            this.appointmentsByClinic[this.activeClinicId] = [];
        }
        this.appointmentsByClinic[this.activeClinicId].push(newAppt);

        // Also update patient profile nextAppointment if they exist
        const patient = this.patients.find(p => p.id === newAppt.patientId);
        if (patient) {
            patient.nextAppointment = newAppt.time;
        }

        // Add a notification about new booking
        this.addNotification({
            type: "info",
            text: `Appointment scheduled for ${newAppt.patientName} on ${newAppt.time.split(' ')[0]} at ${newAppt.time.split(' ')[1]}.`
        });

        // Sync to backend
        fetch('https://dentalai-os-backend.onrender.com/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newAppt, clinic_id: this.activeClinicId })
        }).catch(err => console.error("Failed to sync new appointment to backend:", err));

        this.notify('appointment-added', newAppt);
        this.notify('schedule-updated');
        return newAppt;
    }

    removeAppointment(apptId) {
        const appts = this.appointmentsByClinic[this.activeClinicId] || [];
        const index = appts.findIndex(a => a.id === apptId);
        if (index !== -1) {
            const removed = appts.splice(index, 1)[0];

            // Remove patient next appointment reference
            const patient = this.patients.find(p => p.id === removed.patientId);
            if (patient && patient.nextAppointment === removed.time) {
                patient.nextAppointment = "None";
            }

            this.addNotification({
                type: "warning",
                text: `Appointment for ${removed.patientName} was cancelled.`
            });

            // Sync to backend
            fetch(`https://dentalai-os-backend.onrender.com/api/appointments/${apptId}`, {
                method: 'DELETE'
            }).catch(err => console.error("Failed to sync appointment cancel to backend:", err));

            this.notify('appointment-removed', removed);
            this.notify('schedule-updated');
            return true;
        }
        return false;
    }

    updateAppointmentStatus(apptId, newStatus) {
        const appts = this.appointmentsByClinic[this.activeClinicId] || [];
        const appt = appts.find(a => a.id === apptId);
        if (appt) {
            appt.status = newStatus;

            // Sync to backend
            fetch(`https://dentalai-os-backend.onrender.com/api/appointments/${apptId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            }).catch(err => console.error("Failed to sync appointment status to backend:", err));

            this.notify('appointment-updated', appt);
            this.notify('schedule-updated');
            return true;
        }
        return false;
    }

    // Notifications manager
    getNotifications() {
        return this.notifications;
    }

    addNotification(notif) {
        const newNotif = {
            id: `notif-${Date.now()}`,
            read: false,
            type: notif.type || "info",
            text: notif.text,
            time: "Just now"
        };
        this.notifications.unshift(newNotif);
        this.notify('notification-added', newNotif);
    }

    markAllNotificationsRead() {
        this.notifications.forEach(n => n.read = true);

        // Sync to backend
        fetch('https://dentalai-os-backend.onrender.com/api/notifications/read-all', {
            method: 'PUT'
        }).catch(err => console.error("Failed to sync read-all notifications to backend:", err));

        this.notify('notifications-read');
    }

    // AI Receptionist prompt modifier
    updateAiPrompt(newPrompt) {
        this.aiSettings.prompt = newPrompt;
        this.addNotification({
            type: "info",
            text: "AI Receptionist Prompt instructions successfully updated."
        });

        // Sync to backend
        fetch('https://dentalai-os-backend.onrender.com/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aiPrompt: newPrompt })
        }).catch(err => console.error("Failed to sync prompt update to backend:", err));

        this.notify('ai-prompt-updated', newPrompt);
    }

    // Smart scheduling slots generator
    getSmartSlots(patientId, dentistId = "mercer") {
        const patient = this.getPatientById(patientId);
        const slots = [
            {
                time: "2026-06-09 10:00",
                score: "98% Fit",
                rationale: "Aligns with patient's historical morning preference. Fills a 1-hour schedule gap for Dr. Mercer, maximizing chair utilization."
            },
            {
                time: "2026-06-10 14:30",
                score: "92% Fit",
                rationale: "Immediately follows Dr. Ross's root canal review. Minimizes overall in-clinic waiting time for patient."
            },
            {
                time: "2026-06-12 11:00",
                score: "87% Fit",
                rationale: "Ensures necessary 24-hour buffer after patient's scheduled fasting lab test on Thursday."
            }
        ];
        return slots;
    }

    // NLP Conversational chatbot simulator engine
    async simulateChatReply(userMessage) {
        try {
            const res = await fetch('https://dentalai-os-backend.onrender.com/api/receptionist/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage, prompt: this.aiSettings.prompt })
            });
            if (res.ok) {
                const data = await res.json();
                return { reply: data.response, action: data.action };
            }
        } catch (e) {
            console.error("AI receptionist backend failed, falling back to local NLP:", e);
        }

        const cleanMsg = userMessage.toLowerCase().trim();
        let replyText = "";
        let actionTrigger = null; // Callback or booking data if scheduled

        if (cleanMsg.includes("pain") || cleanMsg.includes("hurt") || cleanMsg.includes("ache") || cleanMsg.includes("emergency")) {
            replyText = "I'm so sorry you're dealing with pain. Throbbing molar pain is often linked to localized root/nerve issues. I have open same-day emergency slots today with Dr. Ross (our endodontist) at 11:30 AM or Dr. Mercer at 3:00 PM. Would you like me to reserve one of those?";
        } else if (cleanMsg.includes("yes") && (cleanMsg.includes("11:30") || cleanMsg.includes("ross") || cleanMsg.includes("emergency") || cleanMsg.includes("book"))) {
            replyText = "Got it! I have confirmed your Emergency Consultation with Dr. Arthur Ross for today at 11:30 AM. Please avoid hot or freezing liquids and chewing on that side. We'll send the location and health history intake links via SMS.";
            actionTrigger = {
                type: "book",
                booking: {
                    patientId: "pat-003",
                    patientName: "Mark Vance",
                    dentistId: "ross",
                    dentistName: "Dr. Arthur Ross",
                    time: "2026-06-08 11:30",
                    duration: 90,
                    treatment: "Emergency Consultation #30",
                    status: "ai-confirmed",
                    notes: "Autonomously booked during live simulation chat."
                }
            };
        } else if (cleanMsg.includes("insurance") || cleanMsg.includes("metlife") || cleanMsg.includes("delta") || cleanMsg.includes("ppo")) {
            replyText = "We accept all major PPO insurance networks, including Delta Dental, MetLife, Cigna, and Aetna. We do not accept HMO or Medicaid plans. Standard diagnostics, cleanings, and exams are typically covered at 100%.";
        } else if (cleanMsg.includes("cost") || cleanMsg.includes("price") || cleanMsg.includes("cleaning") || cleanMsg.includes("cash")) {
            replyText = "For patients without dental insurance, we offer a New Patient Special for $189. This includes a comprehensive visual examination, full digital bitewing X-Rays, and a standard prophylaxis cleaning. Would you like to schedule that?";
        } else if (cleanMsg.includes("reschedule") || cleanMsg.includes("move") || cleanMsg.includes("change")) {
            replyText = "I can definitely help reschedule. Could you please provide your full name and the preferred day (e.g., next Tuesday or Wednesday) you'd like to shift your appointment to?";
        } else {
            replyText = "Hello! I am Alexis, your AI clinic receptionist. I can help you schedule appointments, verify insurance networks, check cleaning prices, or triage acute toothaches. What can I do for you today?";
        }

        return { reply: replyText, action: actionTrigger };
    }
}

// Global single instance of the store
export const store = new ClinicStore();
window.__clinicStore = store;
