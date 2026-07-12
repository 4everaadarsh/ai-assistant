-- DentalAI OS - Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor before deploying.

CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    dob TEXT,
    phone TEXT,
    email TEXT,
    insurance TEXT,
    "lastVisit" TEXT,
    "nextAppointment" TEXT,
    "riskStatus" TEXT,
    "riskRationale" TEXT,
    avatar TEXT,
    allergies JSONB DEFAULT '[]'::jsonb,
    "medicalHistory" TEXT,
    "preCare" JSONB DEFAULT '[]'::jsonb,
    "postCare" JSONB DEFAULT '[]'::jsonb,
    notes JSONB DEFAULT '[]'::jsonb,
    "treatmentHistory" JSONB DEFAULT '[]'::jsonb,
    findings JSONB DEFAULT '[]'::jsonb,
    "treatmentPlan" JSONB DEFAULT '[]'::jsonb,
    "xrayUrl" TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    clinic_id TEXT DEFAULT 'bellevue',
    "patientId" TEXT,
    "patientName" TEXT,
    "dentistId" TEXT,
    "dentistName" TEXT,
    time TEXT,
    duration INTEGER DEFAULT 60,
    treatment TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    read BOOLEAN DEFAULT false,
    type TEXT,
    text TEXT,
    time TEXT
);

CREATE TABLE IF NOT EXISTS receptionist_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    "callerName" TEXT,
    phone TEXT,
    purpose TEXT,
    outcome TEXT,
    summary TEXT,
    transcript JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Row Level Security (demo-friendly policies; tighten for production)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptionist_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on patients" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on receptionist_logs" ON receptionist_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
