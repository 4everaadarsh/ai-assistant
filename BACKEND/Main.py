import os
import json
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes so frontend (port 8000) can communicate with backend (port 5000)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DB_FILE = os.path.join(os.path.dirname(__file__), "database.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# Database Initialization
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Patients Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            dob TEXT,
            phone TEXT,
            email TEXT,
            insurance TEXT,
            lastVisit TEXT,
            nextAppointment TEXT,
            riskStatus TEXT,
            riskRationale TEXT,
            avatar TEXT,
            allergies TEXT, -- JSON array
            medicalHistory TEXT,
            preCare TEXT, -- JSON array
            postCare TEXT, -- JSON array
            notes TEXT, -- JSON array of notes
            treatmentHistory TEXT, -- JSON array
            findings TEXT, -- JSON array
            treatmentPlan TEXT, -- JSON array
            xrayUrl TEXT
        )
    """)

    # Appointments Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            clinic_id TEXT,
            patientId TEXT,
            patientName TEXT,
            dentistId TEXT,
            dentistName TEXT,
            time TEXT,
            duration INTEGER,
            treatment TEXT,
            status TEXT,
            notes TEXT
        )
    """)

    # Notifications Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            read INTEGER DEFAULT 0,
            type TEXT,
            text TEXT,
            time TEXT
        )
    """)

    # Receptionist Logs Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS receptionist_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            callerName TEXT,
            phone TEXT,
            purpose TEXT,
            outcome TEXT,
            summary TEXT,
            transcript TEXT -- JSON array
        )
    """)

    # Settings Table (Active clinic, Active user, Prompt settings)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    
    conn.commit()
    
    # Check if we need to seed the data
    cursor.execute("SELECT COUNT(*) FROM patients")
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)
        conn.commit()
        
    conn.close()

def seed_data(cursor):
    # Default Patients
    patients = [
        {
            "id": "pat-001",
            "name": "John Doe",
            "age": 34,
            "gender": "Male",
            "dob": "1992-04-12",
            "phone": "(206) 555-0142",
            "email": "john.doe@email.com",
            "insurance": "Delta Dental PPO",
            "lastVisit": "2026-02-14",
            "nextAppointment": "2026-06-08 10:00",
            "riskStatus": "medium",
            "riskRationale": "AI identified accelerated calculus accumulation on lower anteriors and localized pocketing (4-5mm) in #2-3 molars, indicating mild Stage I Periodontitis.",
            "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
            "allergies": ["Penicillin"],
            "medicalHistory": "Type 2 Diabetes (controlled), High Blood Pressure",
            "preCare": [
                "Take prescribed pre-medication 1 hour before appointment.",
                "Ensure you eat a light breakfast and take your normal insulin dosage."
            ],
            "postCare": [
                "Avoid eating hot or sticky foods for at least 24 hours.",
                "Use warm saline rinse 3-4 times a day starting tomorrow."
            ],
            "notes": [
                { "id": "note-1", "date": "2026-02-14 11:00", "text": "Patient reported slight sensitivity to cold on tooth #14. Advised monitoring. Hygiene recall scheduled.", "provider": "Dr. Sarah Mercer" },
                { "id": "note-2", "date": "2026-02-14 10:15", "text": "Prophylaxis completed. Mild subgingival calculus noted on lower anteriors. Scaling and root planing not required at this time.", "provider": "Jane Smith, RDH" }
            ],
            "treatmentHistory": [
                { "id": "h-1", "date": "2026-02-14", "tooth": "Global", "procedure": "Comprehensive Exam & X-rays", "cost": 240, "status": "Completed", "dentist": "Dr. Sarah Mercer" },
                { "id": "h-2", "date": "2025-08-10", "tooth": "#3", "procedure": "Resin-Based Composite - 2 Surfaces", "cost": 280, "status": "Completed", "dentist": "Dr. Sarah Mercer" }
            ],
            "findings": [
                { "id": "find-1", "tooth": 14, "type": "Deep Caries", "confidence": 94, "severity": "high", "desc": "Radiolucency extending into the middle third of dentin. Risk of pulpal exposure. Recommend immediate composite restoration or inlay.", "x": 260, "y": 140, "r": 24 },
                { "id": "find-2", "tooth": 19, "type": "Interproximal Decay", "confidence": 81, "severity": "medium", "desc": "Incipient enamel lesion on distal aspect. Recommended monitoring and topical fluoride application.", "x": 380, "y": 220, "r": 18 },
                { "id": "find-3", "tooth": 32, "type": "Impacted Molar", "confidence": 98, "severity": "high", "desc": "Mesioangular impaction. Root development complete. Crowding lower arch. Refer for surgical extraction.", "x": 580, "y": 240, "r": 32 }
            ],
            "treatmentPlan": [
                { "id": "tp-1", "phase": "Phase 1: Restorative", "tooth": "#14", "procedure": "Resin-Based Composite - 3 Surfaces", "cost": 380, "status": "proposed" },
                { "id": "tp-2", "phase": "Phase 1: Restorative", "tooth": "#19", "procedure": "Topical Fluoride Treatment & Sealant", "cost": 120, "status": "completed" },
                { "id": "tp-3", "phase": "Phase 2: Surgical", "tooth": "#32", "procedure": "Surgical Extraction - Impacted Molar", "cost": 650, "status": "proposed" }
            ],
            "xrayUrl": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600"
        },
        {
            "id": "pat-002",
            "name": "Sarah Jenkins",
            "age": 28,
            "gender": "Female",
            "dob": "1998-08-25",
            "phone": "(206) 555-0189",
            "email": "sarah.j@email.com",
            "insurance": "MetLife Dental PPO",
            "lastVisit": "2025-11-20",
            "nextAppointment": "2026-06-08 14:00",
            "riskStatus": "low",
            "riskRationale": "Excellent hygiene. Enamel density high. AI detected zero active caries. Pocket depths 1-3mm globally.",
            "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
            "allergies": [],
            "medicalHistory": "Asthma",
            "preCare": [
                "Bring rescue inhaler to the office."
            ],
            "postCare": [
                "Continue brushing twice daily with fluoride toothpaste and flossing nightly."
            ],
            "notes": [
                { "id": "note-3", "date": "2025-11-20 14:30", "text": "Standard prophylaxis and bite-wing radiographs completed. Restorations intact.", "provider": "Dr. Sarah Mercer" }
            ],
            "treatmentHistory": [
                { "id": "h-3", "date": "2025-11-20", "tooth": "Global", "procedure": "Prophylaxis - Adult Cleaning", "cost": 150, "status": "Completed", "dentist": "Dr. Sarah Mercer" },
                { "id": "h-4", "date": "2025-05-15", "tooth": "#8", "procedure": "Incisal Composite bonding", "cost": 310, "status": "Completed", "dentist": "Dr. Sarah Mercer" }
            ],
            "findings": [
                { "id": "find-4", "tooth": 8, "type": "Subtle Incisal Wear", "confidence": 72, "severity": "low", "desc": "Mild attrition due to nocturnal bruxism. Recommend custom nightguard.", "x": 180, "y": 120, "r": 15 }
            ],
            "treatmentPlan": [
                { "id": "tp-4", "phase": "Phase 1: Preventative", "tooth": "Global", "procedure": "Prophylaxis - Adult Cleaning", "cost": 150, "status": "completed" },
                { "id": "tp-5", "phase": "Phase 2: Appliance", "tooth": "Arch", "procedure": "Custom Maxillary Nightguard", "cost": 450, "status": "proposed" }
            ],
            "xrayUrl": ""
        },
        {
            "id": "pat-003",
            "name": "Mark Vance",
            "age": 52,
            "gender": "Male",
            "dob": "1974-01-05",
            "phone": "(425) 555-0291",
            "email": "mvance74@email.com",
            "insurance": "Cigna PPO",
            "lastVisit": "2024-05-10",
            "nextAppointment": "None (Awaiting Callback)",
            "riskStatus": "high",
            "riskRationale": "Patient has not visited in 2 years. Severe molar pain self-reported. AI analysis of historic panoramas and current intake notes indicates high risk of pulpal necrosis #30.",
            "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100",
            "allergies": ["Sulfa Drugs"],
            "medicalHistory": "Heart murmur",
            "preCare": [
                "Pre-medicate with Amoxicillin (2g) 1 hour prior to appointment."
            ],
            "postCare": [
                "Take Ibuprofen (600mg) every 6 hours for pain control.",
                "If swelling increases or breathing becomes difficult, contact clinic emergency line immediately."
            ],
            "notes": [
                { "id": "note-4", "date": "2024-05-10 09:30", "text": "Patient reports history of heart murmur. Requires antibiotic pre-medication for future invasive procedures.", "provider": "Dr. Sarah Mercer" }
            ],
            "treatmentHistory": [
                { "id": "h-5", "date": "2024-05-10", "tooth": "Global", "procedure": "Comprehensive Exam & Prophylaxis", "cost": 290, "status": "Completed", "dentist": "Dr. Sarah Mercer" }
            ],
            "findings": [
                { "id": "find-5", "tooth": 30, "type": "Periapical Abscess", "confidence": 96, "severity": "high", "desc": "Dark radiolucency around distal root apex. Widened periodontal ligament. Patient symptomatic to percussion and thermal testing. Arthur Ross consultation scheduled.", "x": 420, "y": 230, "r": 28 }
            ],
            "treatmentPlan": [
                { "id": "tp-6", "phase": "Phase 1: Endodontic", "tooth": "#30", "procedure": "Root Canal Therapy (Molar)", "cost": 1100, "status": "proposed" },
                { "id": "tp-7", "phase": "Phase 2: Restorative", "tooth": "#30", "procedure": "Porcelain-Fused-to-Metal Crown", "cost": 1250, "status": "proposed" }
            ],
            "xrayUrl": ""
        }
    ]

    for p in patients:
        cursor.execute("""
            INSERT INTO patients (id, name, age, gender, dob, phone, email, insurance, lastVisit, nextAppointment, riskStatus, riskRationale, avatar, allergies, medicalHistory, preCare, postCare, notes, treatmentHistory, findings, treatmentPlan, xrayUrl)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p["id"], p["name"], p["age"], p["gender"], p["dob"], p["phone"], p["email"], p["insurance"],
            p["lastVisit"], p["nextAppointment"], p["riskStatus"], p["riskRationale"], p["avatar"],
            json.dumps(p["allergies"]), p["medicalHistory"], json.dumps(p["preCare"]), json.dumps(p["postCare"]),
            json.dumps(p["notes"]), json.dumps(p["treatmentHistory"]), json.dumps(p["findings"]),
            json.dumps(p["treatmentPlan"]), p["xrayUrl"]
        ))

    # Default Appointments
    appointments = [
        {
            "id": "appt-1",
            "clinic_id": "bellevue",
            "patientId": "pat-001",
            "patientName": "John Doe",
            "dentistId": "mercer",
            "dentistName": "Dr. Sarah Mercer",
            "time": "2026-06-08 10:00",
            "duration": 60,
            "treatment": "Composite Restoration #14",
            "status": "ai-confirmed",
            "notes": "AI confirmed via automated SMS outreach yesterday."
        },
        {
            "id": "appt-2",
            "clinic_id": "bellevue",
            "patientId": "pat-002",
            "patientName": "Sarah Jenkins",
            "dentistId": "mercer",
            "dentistName": "Dr. Sarah Mercer",
            "time": "2026-06-08 14:00",
            "duration": 60,
            "treatment": "Standard Clean & Exam",
            "status": "ai-confirmed",
            "notes": "Confirmed by AI Receptionist call flow."
        },
        {
            "id": "appt-4",
            "clinic_id": "bellevue",
            "patientId": "pat-003",
            "patientName": "Mark Vance",
            "dentistId": "ross",
            "dentistName": "Dr. Arthur Ross",
            "time": "2026-06-08 11:30",
            "duration": 90,
            "treatment": "Root Canal Consult #30",
            "status": "pending",
            "notes": "Scheduled via AI emergency call route."
        },
        {
            "id": "appt-red-1",
            "clinic_id": "redmond",
            "patientId": "pat-001",
            "patientName": "John Doe",
            "dentistId": "taylor",
            "dentistName": "Dr. Michael Taylor",
            "time": "2026-06-09 09:30",
            "duration": 60,
            "treatment": "New Patient Consultation",
            "status": "ai-confirmed",
            "notes": "Redmond location intake form submitted."
        },
        {
            "id": "appt-red-2",
            "clinic_id": "redmond",
            "patientId": "pat-002",
            "patientName": "Sarah Jenkins",
            "dentistId": "white",
            "dentistName": "Dr. Kelly White",
            "time": "2026-06-11 11:00",
            "duration": 60,
            "treatment": "Orthodontic Aligners Check",
            "status": "pending",
            "notes": "Awaiting retainer scan confirmation."
        }
    ]

    for appt in appointments:
        cursor.execute("""
            INSERT INTO appointments (id, clinic_id, patientId, patientName, dentistId, dentistName, time, duration, treatment, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            appt["id"], appt["clinic_id"], appt["patientId"], appt["patientName"],
            appt["dentistId"], appt["dentistName"], appt["time"], appt["duration"],
            appt["treatment"], appt["status"], appt["notes"]
        ))

    # Default Notifications
    notifications = [
        { "id": "notif-1", "read": 0, "type": "alert", "text": "AI Diagnostic Warning: Potential deep caries #14 on John Doe requires clinical review.", "time": "10 min ago" },
        { "id": "notif-2", "read": 0, "type": "info", "text": "AI Receptionist successfully booked Mark Vance for today's emergency slot (11:30 AM).", "time": "1 hour ago" },
        { "id": "notif-3", "read": 1, "type": "warning", "text": "Reschedule pending: Sarah Jenkins requested to move cleaning from 2 PM to 3 PM.", "time": "4 hours ago" }
    ]

    for n in notifications:
        cursor.execute("""
            INSERT INTO notifications (id, read, type, text, time)
            VALUES (?, ?, ?, ?, ?)
        """, (n["id"], n["read"], n["type"], n["text"], n["time"]))

    # Default Receptionist Logs
    receptionist_logs = [
        {
            "id": "log-1",
            "timestamp": "2026-06-08 09:12",
            "callerName": "Jessica Miller",
            "phone": "(206) 555-0211",
            "purpose": "Routine Cleaning Scheduling",
            "outcome": "booked",
            "summary": "Patient called requesting a cleaning. AI confirmed details, verified insurance (Delta Dental PPO), and booked appointment for June 12th at 2:00 PM.",
            "transcript": [
                { "sender": "ai", "text": "Thank you for calling Apex Dental. This is Alexis, the AI receptionist. How can I help you today?" },
                { "sender": "patient", "text": "Hi, I need to schedule my regular 6-month cleaning. I think I am due." },
                { "sender": "ai", "text": "I can absolutely check that for you. What is your full name and date of birth?" },
                { "sender": "patient", "text": "Jessica Miller, birthdate is March 5th, 1995." },
                { "sender": "ai", "text": "Thank you, Jessica. Yes, you are due for your cleaning. I have Dr. Mercer available on Friday, June 12th at 2:00 PM, or Monday, June 15th at 10:00 AM. Do either of those work?" },
                { "sender": "patient", "text": "The Friday one at 2:00 PM is perfect." },
                { "sender": "ai", "text": "Great. I have reserved that slot. We have your insurance down as Delta Dental PPO, is that still correct?" },
                { "sender": "patient", "text": "Yes, that's correct." },
                { "sender": "ai", "text": "Excellent! Your appointment is confirmed for Friday, June 12th at 2:00 PM. We will send a calendar link to your phone shortly." }
            ]
        },
        {
            "id": "log-2",
            "timestamp": "2026-06-07 16:40",
            "callerName": "Mark Vance",
            "phone": "(425) 555-0291",
            "purpose": "Severe Molar pain triage",
            "outcome": "booked",
            "summary": "Patient reported severe throbbing pain in lower right molar (#30). AI assessed high urgency, offered same-day emergency slot with Dr. Ross (Endodontist), and completed booking.",
            "transcript": [
                { "sender": "ai", "text": "Thank you for calling Apex Dental. This is Alexis, the AI receptionist. How can I help you today?" },
                { "sender": "patient", "text": "Hi... I've had this terrible toothache since last night. It's pounding and I can't sleep. Can I see a doctor today?" },
                { "sender": "ai", "text": "I'm so sorry to hear you are in pain, Mark. We take dental emergencies very seriously. Is the pain in a specific area, and are you experiencing any facial swelling?" },
                { "sender": "patient", "text": "It's on my lower right side, one of the big molars. No swelling yet, but it hurts to drink cold water or bite down." },
                { "sender": "ai", "text": "Got it. That sounds like it could be a nerve inflammation or an abscess. I have an emergency slot open with our specialist, Dr. Ross, today at 11:30 AM. Can you make it in?" },
                { "sender": "patient", "text": "Yes, please! I will leave work now." },
                { "sender": "ai", "text": "Perfect. I have booked you for today at 11:30 AM. Please do not eat or drink anything extremely hot or cold, and avoid chewing on that side. We look forward to helping you." }
            ]
        }
    ]

    for log in receptionist_logs:
        cursor.execute("""
            INSERT INTO receptionist_logs (id, timestamp, callerName, phone, purpose, outcome, summary, transcript)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log["id"], log["timestamp"], log["callerName"], log["phone"],
            log["purpose"], log["outcome"], log["summary"], json.dumps(log["transcript"])
        ))

    # Default Settings
    settings = {
        "activeClinicId": "bellevue",
        "activeUserId": "mercer",
        "aiPrompt": """You are the AI Receptionist for Apex Dental in Bellevue and Redmond.
Bellevue Hours: Mon-Fri: 9am-6pm, Sat: 10am-2pm, Sun: Closed.
Redmond Hours: Mon-Fri: 8am-5pm, Sat: Closed.

Rules:
1. Greet patients warmly. Always identify yourself as the clinic's AI Assistant.
2. For booking: Search clinic availability, suggest up to 3 slots. Get name & phone number.
3. For emergency pain: Identify tooth number if possible, triage urgency, offer same-day slots.
4. Insurance: We are in-network with Delta Dental, MetLife, Cigna, and Aetna PPO.
5. Do NOT make definitive clinical diagnoses. Always refer to dentist evaluation."""
    }

    for k, v in settings.items():
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, v))

# Helper to load all data for state sync
def get_full_state_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Load settings
    cursor.execute("SELECT * FROM settings")
    settings_rows = cursor.fetchall()
    settings = {row["key"]: row["value"] for row in settings_rows}
    
    # Load patients
    cursor.execute("SELECT * FROM patients")
    patient_rows = cursor.fetchall()
    patients = []
    for r in patient_rows:
        patients.append({
            "id": r["id"],
            "name": r["name"],
            "age": r["age"],
            "gender": r["gender"],
            "dob": r["dob"],
            "phone": r["phone"],
            "email": r["email"],
            "insurance": r["insurance"],
            "lastVisit": r["lastVisit"],
            "nextAppointment": r["nextAppointment"],
            "riskStatus": r["riskStatus"],
            "riskRationale": r["riskRationale"],
            "avatar": r["avatar"],
            "allergies": json.loads(r["allergies"] or "[]"),
            "medicalHistory": r["medicalHistory"],
            "preCare": json.loads(r["preCare"] or "[]"),
            "postCare": json.loads(r["postCare"] or "[]"),
            "notes": json.loads(r["notes"] or "[]"),
            "treatmentHistory": json.loads(r["treatmentHistory"] or "[]"),
            "findings": json.loads(r["findings"] or "[]"),
            "treatmentPlan": json.loads(r["treatmentPlan"] or "[]"),
            "xrayUrl": r["xrayUrl"]
        })
        
    # Load appointments
    cursor.execute("SELECT * FROM appointments")
    appt_rows = cursor.fetchall()
    appointments = []
    for r in appt_rows:
        appointments.append({
            "id": r["id"],
            "clinic_id": r["clinic_id"],
            "patientId": r["patientId"],
            "patientName": r["patientName"],
            "dentistId": r["dentistId"],
            "dentistName": r["dentistName"],
            "time": r["time"],
            "duration": r["duration"],
            "treatment": r["treatment"],
            "status": r["status"],
            "notes": r["notes"]
        })
        
    # Load notifications
    cursor.execute("SELECT * FROM notifications")
    notif_rows = cursor.fetchall()
    notifications = []
    for r in notif_rows:
        notifications.append({
            "id": r["id"],
            "read": bool(r["read"]),
            "type": r["type"],
            "text": r["text"],
            "time": r["time"]
        })

    # Load receptionist logs
    cursor.execute("SELECT * FROM receptionist_logs")
    log_rows = cursor.fetchall()
    receptionist_logs = []
    for r in log_rows:
        receptionist_logs.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "callerName": r["callerName"],
            "phone": r["phone"],
            "purpose": r["purpose"],
            "outcome": r["outcome"],
            "summary": r["summary"],
            "transcript": json.loads(r["transcript"] or "[]")
        })

    conn.close()
    
    return {
        "activeClinicId": settings.get("activeClinicId", "bellevue"),
        "activeUserId": settings.get("activeUserId", "mercer"),
        "aiPrompt": settings.get("aiPrompt", ""),
        "patients": patients,
        "appointments": appointments,
        "notifications": notifications,
        "receptionistLogs": receptionist_logs
    }

# API Endpoint: GET full state
@app.route('/api/state', methods=['GET'])
def get_state():
    try:
        state = get_full_state_data()
        return jsonify(state)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Endpoint: POST update settings
@app.route('/api/settings', methods=['POST'])
def update_settings():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        for k, v in data.items():
            cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (k, str(v)))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Endpoint: Patients Note add
@app.route('/api/patients/<patient_id>/notes', methods=['POST'])
def add_note(patient_id):
    try:
        data = request.json
        note_text = data.get('text')
        provider = data.get('provider', 'Dr. Sarah Mercer')
        note_id = data.get('id', f"note-{int(request.host_url.replace('.', '').replace(':', '').replace('/', '')[-5:])}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT notes FROM patients WHERE id = ?", (patient_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return jsonify({"error": "Patient not found"}), 404
            
        notes = json.loads(row["notes"] or "[]")
        import datetime
        date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        
        new_note = {
            "id": f"note-{int(datetime.datetime.now().timestamp() * 1000)}",
            "date": date_str,
            "text": note_text,
            "provider": provider
        }
        notes.insert(0, new_note)
        
        cursor.execute("UPDATE patients SET notes = ? WHERE id = ?", (json.dumps(notes), patient_id))
        conn.commit()
        conn.close()
        return jsonify(new_note)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Endpoint: Patients Note delete
@app.route('/api/patients/<patient_id>/notes/<note_id>', methods=['DELETE'])
def delete_note(patient_id, note_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT notes FROM patients WHERE id = ?", (patient_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return jsonify({"error": "Patient not found"}), 404
            
        notes = json.loads(row["notes"] or "[]")
        filtered_notes = [n for n in notes if n["id"] != note_id]
        
        cursor.execute("UPDATE patients SET notes = ? WHERE id = ?", (json.dumps(filtered_notes), patient_id))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Endpoint: POST Create Appointment
@app.route('/api/appointments', methods=['POST'])
def create_appt():
    try:
        data = request.json
        appt_id = data.get('id', f"appt-{int(datetime_to_timestamp_placeholder())}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO appointments (id, clinic_id, patientId, patientName, dentistId, dentistName, time, duration, treatment, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            appt_id, data.get('clinic_id', 'bellevue'), data.get('patientId'), data.get('patientName'),
            data.get('dentistId'), data.get('dentistName'), data.get('time'), data.get('duration', 60),
            data.get('treatment', 'General Consultation'), data.get('status', 'pending'), data.get('notes', '')
        ))
        
        # Update patient next appointment
        cursor.execute("UPDATE patients SET nextAppointment = ? WHERE id = ?", (data.get('time'), data.get('patientId')))
        
        # Add notification
        import datetime
        notif_id = f"notif-{int(datetime.datetime.now().timestamp() * 1000)}"
        cursor.execute("""
            INSERT INTO notifications (id, read, type, text, time)
            VALUES (?, 0, 'info', ?, 'Just now')
        """, (notif_id, f"Appointment scheduled for {data.get('patientName')} on {data.get('time').split(' ')[0]}."))
        
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "id": appt_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def datetime_to_timestamp_placeholder():
    import datetime
    return datetime.datetime.now().timestamp() * 1000

# API Endpoint: DELETE Appointment
@app.route('/api/appointments/<appt_id>', methods=['DELETE'])
def delete_appt(appt_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get patientId for reference
        cursor.execute("SELECT patientId, patientName, time FROM appointments WHERE id = ?", (appt_id,))
        row = cursor.fetchone()
        if row:
            patient_id = row["patientId"]
            patient_name = row["patientName"]
            appt_time = row["time"]
            
            cursor.execute("DELETE FROM appointments WHERE id = ?", (appt_id,))
            cursor.execute("UPDATE patients SET nextAppointment = 'None' WHERE id = ? AND nextAppointment = ?", (patient_id, appt_time))
            
            # Add notification
            import datetime
            notif_id = f"notif-{int(datetime.datetime.now().timestamp() * 1000)}"
            cursor.execute("""
                INSERT INTO notifications (id, read, type, text, time)
                VALUES (?, 0, 'warning', ?, 'Just now')
            """, (notif_id, f"Appointment for {patient_name} was cancelled."))
            
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Endpoint: PUT Update Appointment Status
@app.route('/api/appointments/<appt_id>', methods=['PUT'])
def update_appt_status(appt_id):
    try:
        data = request.json
        status = data.get('status')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE appointments SET status = ? WHERE id = ?", (status, appt_id))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Endpoint: PUT Update Patient Details (e.g. treatment plan accept/proposed)
@app.route('/api/patients/<patient_id>', methods=['PUT'])
def update_patient_details(patient_id):
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Dynamically build UPDATE query for key fields, handle JSON serializing if needed
        for k, v in data.items():
            if k in ['allergies', 'preCare', 'postCare', 'notes', 'treatmentHistory', 'findings', 'treatmentPlan']:
                cursor.execute(f"UPDATE patients SET {k} = ? WHERE id = ?", (json.dumps(v), patient_id))
            elif k in ['name', 'age', 'gender', 'dob', 'phone', 'email', 'insurance', 'lastVisit', 'nextAppointment', 'riskStatus', 'riskRationale', 'avatar', 'xrayUrl']:
                cursor.execute(f"UPDATE patients SET {k} = ? WHERE id = ?", (v, patient_id))
                
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Endpoint: PUT Mark all notifications read
@app.route('/api/notifications/read-all', methods=['PUT'])
def read_all_notifications():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET read = 1")
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API Endpoint: POST Receptionist Call log
@app.route('/api/receptionist/logs', methods=['POST'])
def add_call_log():
    try:
        data = request.json
        log_id = data.get('id', f"log-{int(datetime_to_timestamp_placeholder())}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO receptionist_logs (id, timestamp, callerName, phone, purpose, outcome, summary, transcript)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id, data.get('timestamp'), data.get('callerName'), data.get('phone'),
            data.get('purpose'), data.get('outcome'), data.get('summary'), json.dumps(data.get('transcript', []))
        ))
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "id": log_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- AI ENGINES: Copilot & Receptionist ---

def call_gemini_api(prompt_text, system_instruction=""):
    api_key = os.getenv('gemini_api_key')
    
    # Check key format
    if not api_key or api_key.startswith("AQ.") or "UNAUTHENTICATED" in api_key:
        # Key is invalid or restricted, trigger local NLP fallback
        print("Gemini API key is missing or restricted. Falling back to local NLP engine.")
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    
    # Build content structure with optional system instruction
    contents = {
        "contents": [{
            "parts": [{"text": prompt_text}]
        }]
    }
    if system_instruction:
        contents["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }
        
    try:
        response = requests.post(url, headers=headers, json=contents, timeout=10)
        if response.status_code == 200:
            res_json = response.json()
            # Extract content text
            text = res_json['candidates'][0]['content']['parts'][0]['text']
            return text
        else:
            print(f"Gemini API returned status code {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"Failed to connect to Gemini API: {e}")
        return None

# Local Fallback response dictionary for Copilot
COPILOT_RESPONSES = {
    "help": """<strong>Trained DentalAI Copilot Commands:</strong><br>
• Type <strong>'John Doe'</strong> or <strong>'Mark Vance'</strong>: Patient summary.<br>
• Type <strong>'roi'</strong> or <strong>'savings'</strong>: AI practice savings.<br>
• Type <strong>'pipeline'</strong> or <strong>'treatment'</strong>: Actionable opportunity queue.<br>
• Type <strong>'risks'</strong> or <strong>'alerts'</strong>: Clinical diagnostic flags.<br>
• Type <strong>'billing'</strong>: Claims and collection efficiency logs.<br>
• Type <strong>'schedule'</strong>: Load summary for Mercer & Ross chairs today.""",
    
    "john": """<strong>John Doe</strong> (34yo, M):<br>
• Insurance: Delta Dental PPO<br>
• AI Pathology Flags: Tooth #14 (Deep Caries, 94% conf) & #32 (Impacted Molar, 98% conf).<br>
• Treatment Planned: Resin Composite on #14 ($380) and surgical extraction #32 ($650). Both proposed. Let me know if you would like me to draft pre-op guidance warnings.""",
    
    "mark": """<strong>Mark Vance</strong> (52yo, M):<br>
• Insurance: Cigna PPO (Allergic to Sulfa Drugs)<br>
• Scheduled Today: Root Canal Consult #30 at 11:30 AM with Dr. Arthur Ross.<br>
• Note: Scheduled via AI emergency triage routing for severe throbbing molar pain. Fasting laboratory work completed last Thursday.""",
    
    "sarah": """<strong>Sarah Jenkins</strong> (28yo, F):<br>
• Insurance: MetLife Dental PPO<br>
• Status: Completed standard Cleaning and Prophylaxis at 2:00 PM today. AI detected zero active caries.<br>
• Pending: Custom maxillary nightguard proposed ($450) to mitigate incisal grinding attrition.""",
    
    "roi": """<strong>DentalAI OS - Active Practice ROI:</strong><br>
• Hours Saved: 235 hrs (receptionist administrative task automation)<br>
• Missed Calls Recovered: 210 out-of-hours leads ($12,600 values)<br>
• AI Generated Bookings: 340 appointments ($54,800 value generated)<br>
• Net Monthly Cost Mitigation: $4,250""",
    
    "pipeline": """<strong>Outstanding Treatment Pipeline:</strong><br>
• Total Pipeline Value: $24,500<br>
• High Actionable Queue: John Doe ($2,400 crown), Mark Vance ($4,500 implant consult), Sarah Jenkins ($350 hygiene recall)""",
    
    "risks": """<strong>Clinical AI Pathology Risks:</strong><br>
• John Doe: Tooth #14 (Deep Caries, 94% conf) & #32 (Impacted Molar, 98% conf).<br>
• Mark Vance: Tooth #30 (Periapical Abscess, 96% conf).<br>
• Sarah Jenkins: Tooth #8 (Bruxism incisal attrition wear, 72% conf).""",
    
    "billing": """<strong>Billing Operations Performance (June 2026):</strong><br>
• Billed amount: $84,210<br>
• Claims submitted: $68,450 (92.5% first-pass clean claim submission)<br>
• Collection Efficiency: 96.8% (aided by automated billing SMS reminder alerts)""",
    
    "schedule": """<strong>Today's Schedule Summary:</strong><br>
• Total appointments: 3 scheduled<br>
• Dr. Mercer chair load: John Doe (10 AM), Sarah Jenkins (2 PM)<br>
• Dr. Ross chair load: Mark Vance emergency exam (11:30 AM)<br>
• AI Auto-Confirmation Rate: 100% of outreach logs successfully booked."""
}

@app.route('/api/copilot/chat', methods=['POST'])
def copilot_chat():
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({"response": "No message provided."})
            
        clean_msg = user_message.lower().strip()
        
        # Build prompt injection context to give Gemini rich dental OS knowledge
        system_instruction = """You are DentalAI Copilot, an advanced clinical assistant and practice management advisor for Apex Dental.
You have access to patient databases, scheduling, billing records, and clinical logs.
Active patients include:
1. John Doe: 34yo, M. Tooth #14 has Deep Caries, #32 is an Impacted Molar. Resin Composite planned on #14 ($380).
2. Sarah Jenkins: 28yo, F. Nightguard proposed ($450) for mild attrition.
3. Mark Vance: 52yo, M. Severe pain lower right molar (#30). Periapical Abscess diagnosed. Root Canal Consult #30 scheduled today at 11:30 AM with Dr. Arthur Ross. Allergic to Sulfa.

Operations & ROI metrics:
- 235 hours saved, 210 missed calls recovered ($12,600 value), 340 appointments booked ($54,800 value), monthly savings $4,250.
- Outstanding treatment pipeline: $24,500 total value.
- June 2026 Billing: $84,210 billed, 96.8% collection efficiency.

Give concise, professional answers. If the user asks about scheduling, patient records, ROI, clinical risks, or treatment plans, give specific details based on this data."""

        # Attempt to call Gemini API
        ai_response = call_gemini_api(user_message, system_instruction=system_instruction)
        
        if ai_response:
            return jsonify({"response": ai_response})
            
        # If Gemini fails, trigger local rule-based NLP fallback
        response_text = "I am trained on your practice databases. I can calculate ROI, list pipeline values, audit billing, or identify clinical alerts.<br>Type <strong>'help'</strong> to see all commands."
        for key, val in COPILOT_RESPONSES.items():
            if key in clean_msg:
                response_text = val
                break
                
        return jsonify({"response": response_text})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Local Fallback responses for AI Receptionist Alexis
@app.route('/api/receptionist/chat', methods=['POST'])
def receptionist_chat():
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        system_prompt = data.get('prompt', '').strip()
        
        if not user_message:
            return jsonify({"response": "No message provided."})
            
        clean_msg = user_message.lower().strip()
        
        # System instructions setup for Gemini
        system_instruction = system_prompt or """You are Alexis, the automated AI receptionist for Apex Dental.
Clinic Locations: Bellevue (Mon-Fri 9-6, Sat 10-2) and Redmond (Mon-Fri 8-5).
Dentists: Dr. Sarah Mercer (General & Cosmetic) and Dr. Arthur Ross (Endodontist).
We take Delta Dental, MetLife, Cigna, and Aetna PPO.
Be friendly, professional, and seek to book appointments, triaging pain emergencies appropriately."""

        # Call Gemini
        ai_response = call_gemini_api(user_message, system_instruction=system_instruction)
        
        if ai_response:
            # Simple heuristic in backend to detect if booking should trigger
            action = None
            if "confirm" in ai_response.lower() or "book" in ai_response.lower() or "reserve" in ai_response.lower():
                # Check who is talking
                if "mark" in clean_msg or "vance" in clean_msg:
                    action = {
                        "type": "book",
                        "booking": {
                            "patientId": "pat-003",
                            "patientName": "Mark Vance",
                            "dentistId": "ross",
                            "dentistName": "Dr. Arthur Ross",
                            "time": "2026-06-08 11:30",
                            "duration": 90,
                            "treatment": "Emergency Consultation #30",
                            "status": "ai-confirmed",
                            "notes": "Autonomously booked by Alexis AI during live call chat."
                        }
                    }
            return jsonify({"response": ai_response, "action": action})
            
        # Local NLP Fallback for Receptionist
        reply_text = "Thank you for sharing. Could you specify if you are looking to book a routine cleaning, or if you are experiencing tooth pain?"
        action = None
        
        if any(w in clean_msg for w in ["pain", "hurt", "ache", "emergency", "throbbing"]):
            reply_text = "I'm so sorry you're dealing with pain. Severe throbbing molar pain is often linked to localized root/nerve issues. I have open same-day emergency slots today with Dr. Ross (our endodontist) at 11:30 AM or Dr. Mercer at 3:00 PM. Would you like me to reserve one of those?"
        elif any(w in clean_msg for w in ["yes", "11:30", "ross", "emergency consult"]):
            reply_text = "Got it! I have confirmed your Emergency Consultation with Dr. Arthur Ross for today at 11:30 AM. Please avoid hot or freezing liquids and chewing on that side. We'll send the location and health history intake links via SMS."
            action = {
                "type": "book",
                "booking": {
                    "patientId": "pat-003",
                    "patientName": "Mark Vance",
                    "dentistId": "ross",
                    "dentistName": "Dr. Arthur Ross",
                    "time": "2026-06-08 11:30",
                    "duration": 90,
                    "treatment": "Emergency Consultation #30",
                    "status": "ai-confirmed",
                    "notes": "Autonomously booked by Alexis AI during fallback call."
                }
            }
        elif any(w in clean_msg for w in ["insurance", "metlife", "delta", "ppo"]):
            reply_text = "We accept all major PPO insurance networks, including Delta Dental, MetLife, Cigna, and Aetna. We do not accept HMO or Medicaid plans. Standard diagnostics, cleanings, and exams are typically covered at 100%."
        elif any(w in clean_msg for w in ["cost", "price", "cleaning", "cash", "how much"]):
            reply_text = "For out-of-pocket patients, our standard hygiene clean and exam is $150. For complex procedures, we provide a full diagnostic printout with transparent pricing before scheduling."
            
        return jsonify({"response": reply_text, "action": action})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    print("DentalAI OS SQLite DB Initialized and Seeded.")
    # Run server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
