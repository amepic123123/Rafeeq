-- =========================================================================
-- Rafeeq AI Mock Data Seed
-- =========================================================================

-- Note: In a real environment, UUIDs would be auto-generated. 
-- For the seed, we use deterministic UUIDs or rely on variables if the SQL dialect supports it.
-- Assuming standard PostgreSQL extensions or just inserting returning ids.

-- 1. Create Sanad Identities
INSERT INTO sanad_identities (national_id, full_name_ar, full_name_en, date_of_birth, gender, blood_type, phone_number) VALUES
('JO-1980-AHM-123', 'د. أحمد صبحي', 'Dr. Ahmed Sobhi', '1980-05-14', 'MALE', 'O+', '+962790000001'),
('JO-2026-KHL-4821', 'خالد العمري', 'Khaled Al-Omari', '1952-03-22', 'MALE', 'A+', '+962790000002'),
('JO-2025-SRA-9923', 'سارة أحمد', 'Sarah Ahmed', '1984-08-10', 'FEMALE', 'B-', '+962790000003'),
('JO-2024-MHD-1102', 'محمد النجار', 'Mohammed Al-Najjar', '1968-11-05', 'MALE', 'O-', '+962790000004');

-- 2. Create Users
-- We'll use specific UUIDs to make linking easier in this mock script.
INSERT INTO users (id, national_id, password_hash) VALUES
('11111111-1111-1111-1111-111111111111', 'JO-1980-AHM-123', 'hashed_pass_mock'), -- The Doctor
('22222222-2222-2222-2222-222222222222', 'JO-2026-KHL-4821', 'hashed_pass_mock'), -- Khaled
('33333333-3333-3333-3333-333333333333', 'JO-2025-SRA-9923', 'hashed_pass_mock'), -- Sarah
('44444444-4444-4444-4444-444444444444', 'JO-2024-MHD-1102', 'hashed_pass_mock'); -- Mohammed

-- 3. Create Doctor Profile (Ahmed is a doctor AND a patient/user)
INSERT INTO doctor_profiles (id, user_id, medical_license_number, specialty, hospital_affiliation) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'MED-JO-99882', 'الباطنية والقلب (Internal Medicine & Cardiology)', 'مستشفى الملك عبدالله المؤسس');

-- 4. Create Encounters (Visits)
INSERT INTO hakeem_encounters (id, patient_user_id, doctor_profile_id, encounter_date, facility_name, diagnosis, notes) VALUES
('eeeeeeee-0001-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2026-05-10 08:30:00', 'مستشفى الملك عبدالله المؤسس', 'ارتفاع ضغط الدم ومراجعة أدوية السكري', 'المريض يشكو من دوخة خفيفة صباحاً. تم تعديل جرعة الميتفورمين.'),
('eeeeeeee-0002-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2026-05-11 10:15:00', 'مستشفى الملك عبدالله المؤسس', 'فحص دوري للحمل', 'تم طلب تحاليل دم دورية.'),
('eeeeeeee-0003-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2026-05-09 14:20:00', 'عيادات الاختصاص', 'متابعة سكري النوع الثاني', 'السكري التراكمي في تحسن. استمرار على نفس الخطة.');

-- 5. Create Vitals
INSERT INTO vitals (patient_user_id, encounter_id, heart_rate, systolic_bp, diastolic_bp, temperature, oxygen_saturation) VALUES
('22222222-2222-2222-2222-222222222222', 'eeeeeeee-0001-0000-0000-000000000000', 82, 145, 90, 36.8, 98), -- Khaled (High BP)
('33333333-3333-3333-3333-333333333333', 'eeeeeeee-0002-0000-0000-000000000000', 75, 120, 80, 37.0, 99), -- Sarah
('44444444-4444-4444-4444-444444444444', 'eeeeeeee-0003-0000-0000-000000000000', 88, 135, 85, 36.9, 97); -- Mohammed

-- 6. Create Lab Results
INSERT INTO lab_results (patient_user_id, encounter_id, test_name_en, test_name_ar, value, unit, reference_range_min, reference_range_max, is_abnormal, lab_date) VALUES
-- Khaled Labs
('22222222-2222-2222-2222-222222222222', 'eeeeeeee-0001-0000-0000-000000000000', 'HbA1c', 'السكر التراكمي', 7.2, '%', 4.0, 5.6, TRUE, '2026-05-10'),
('22222222-2222-2222-2222-222222222222', 'eeeeeeee-0001-0000-0000-000000000000', 'LDL Cholesterol', 'الكولسترول الضار', 130, 'mg/dL', 0, 100, TRUE, '2026-05-10'),
-- Sarah Labs
('33333333-3333-3333-3333-333333333333', 'eeeeeeee-0002-0000-0000-000000000000', 'Hemoglobin', 'قوة الدم (الهيموجلوبين)', 11.5, 'g/dL', 12.0, 15.5, TRUE, '2026-05-11'),
-- Mohammed Labs
('44444444-4444-4444-4444-444444444444', 'eeeeeeee-0003-0000-0000-000000000000', 'HbA1c', 'السكر التراكمي', 6.8, '%', 4.0, 5.6, TRUE, '2026-05-09');

-- 7. Create Prescriptions
INSERT INTO prescriptions (patient_user_id, doctor_profile_id, encounter_id, medication_name, dosage, frequency, duration_days, status, prescribed_date) VALUES
('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-0001-0000-0000-000000000000', 'Metformin', '1000mg', 'Twice daily', 30, 'ACTIVE', '2026-05-10'),
('22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-0001-0000-0000-000000000000', 'Amlodipine', '5mg', 'Once daily', 30, 'ACTIVE', '2026-05-10'),
('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-0002-0000-0000-000000000000', 'Iron Supplement (Ferrous Sulfate)', '325mg', 'Once daily', 60, 'ACTIVE', '2026-05-11'),
('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-0003-0000-0000-000000000000', 'Glimepiride', '2mg', 'Once daily before breakfast', 30, 'ACTIVE', '2026-05-09');

-- 8. Create Family Links (E.g., Dr. Ahmed is tracking his aging father Khaled in Family Mode)
INSERT INTO family_links (primary_user_id, dependent_user_id, relationship) VALUES
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'FATHER');
