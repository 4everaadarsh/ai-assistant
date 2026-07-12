const defaultPatients = [
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
        riskStatus: "medium",
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
        allergies: [],
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

const defaultAppointments = [
    {
        id: "appt-1",
        clinic_id: "bellevue",
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
        clinic_id: "bellevue",
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
        clinic_id: "bellevue",
        patientId: "pat-003",
        patientName: "Mark Vance",
        dentistId: "ross",
        dentistName: "Dr. Arthur Ross",
        time: "2026-06-08 11:30",
        duration: 90,
        treatment: "Root Canal Consult #30",
        status: "pending",
        notes: "Scheduled via AI emergency call route."
    },
    {
        id: "appt-red-1",
        clinic_id: "redmond",
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
        clinic_id: "redmond",
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
];

const defaultNotifications = [
    { id: "notif-1", read: false, type: "alert", text: "AI Diagnostic Warning: Potential deep caries #14 on John Doe requires clinical review.", time: "10 min ago" },
    { id: "notif-2", read: false, type: "info", text: "AI Receptionist successfully booked Mark Vance for today's emergency slot (11:30 AM).", time: "1 hour ago" },
    { id: "notif-3", read: true, type: "warning", text: "Reschedule pending: Sarah Jenkins requested to move cleaning from 2 PM to 3 PM.", time: "4 hours ago" }
];

const defaultReceptionistLogs = [
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

const defaultSettings = {
    activeClinicId: "bellevue",
    activeUserId: "mercer",
    aiPrompt: `You are the AI Receptionist for Apex Dental in Bellevue and Redmond.
Bellevue Hours: Mon-Fri: 9am-6pm, Sat: 10am-2pm, Sun: Closed.
Redmond Hours: Mon-Fri: 8am-5pm, Sat: Closed.

Rules:
1. Greet patients warmly. Always identify yourself as the clinic's AI Assistant.
2. For booking: Search clinic availability, suggest up to 3 slots. Get name & phone number.
3. For emergency pain: Identify tooth number if possible, triage urgency, offer same-day slots.
4. Insurance: We are in-network with Delta Dental, MetLife, Cigna, and Aetna PPO.
5. Do NOT make definitive clinical diagnoses. Always refer to dentist evaluation.`
};

module.exports = {
    defaultPatients,
    defaultAppointments,
    defaultNotifications,
    defaultReceptionistLogs,
    defaultSettings
};
