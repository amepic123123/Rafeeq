-- =========================================================================
-- Rafeeq AI & Hakeem Integration DB Schema (PostgreSQL)
-- =========================================================================

-- 1. Sanad Identity (Centralized SSO & Civil Registry Mock)
CREATE TABLE sanad_identities (
    national_id VARCHAR(15) PRIMARY KEY,
    full_name_ar VARCHAR(255) NOT NULL,
    full_name_en VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE')),
    blood_type VARCHAR(5),
    phone_number VARCHAR(20),
    is_deceased BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Application layer)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    national_id VARCHAR(15) UNIQUE NOT NULL REFERENCES sanad_identities(national_id),
    password_hash VARCHAR(255), -- If local auth is used as fallback
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Doctor Profiles
-- A doctor is also a user. They have a Sanad identity and a User record.
CREATE TABLE doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    medical_license_number VARCHAR(50) UNIQUE NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    hospital_affiliation VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Hakeem Encounters (Visits)
CREATE TABLE hakeem_encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL REFERENCES users(id),
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id),
    encounter_date TIMESTAMP NOT NULL,
    facility_name VARCHAR(255) NOT NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Vitals (Continuous Health Data)
CREATE TABLE vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL REFERENCES users(id),
    encounter_id UUID REFERENCES hakeem_encounters(id), -- Optional, can be self-measured
    heart_rate INT, -- bpm
    systolic_bp INT,
    diastolic_bp INT,
    temperature DECIMAL(4,2), -- Celsius
    respiratory_rate INT,
    oxygen_saturation INT, -- Percentage
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Lab Results
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL REFERENCES users(id),
    encounter_id UUID REFERENCES hakeem_encounters(id),
    test_name_en VARCHAR(100) NOT NULL,
    test_name_ar VARCHAR(100) NOT NULL,
    value DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reference_range_min DECIMAL(10,3),
    reference_range_max DECIMAL(10,3),
    is_abnormal BOOLEAN DEFAULT FALSE,
    lab_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Prescriptions & Medications
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID NOT NULL REFERENCES users(id),
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id),
    encounter_id UUID REFERENCES hakeem_encounters(id),
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration_days INT,
    status VARCHAR(50) CHECK (status IN ('ACTIVE', 'COMPLETED', 'DISCONTINUED')),
    prescribed_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Family Linkage (For Family Mode)
CREATE TABLE family_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_user_id UUID NOT NULL REFERENCES users(id),
    dependent_user_id UUID NOT NULL REFERENCES users(id),
    relationship VARCHAR(50) NOT NULL, -- e.g., FATHER, MOTHER, SON, DAUGHTER
    can_view_medical_records BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(primary_user_id, dependent_user_id)
);
