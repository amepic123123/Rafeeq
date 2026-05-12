import asyncio
from datetime import datetime, timezone, timedelta
from app.db.session import async_sessionmaker, engine
from app.models.user import User, RoleEnum
from app.models.patient import PatientProfile, Condition, Medication, Allergy, LabResult
from app.core.security import get_password_hash

from app.models.base import Base

async def seed_data():
    # Automatically create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as db:
        print("Starting database seeding...")
        
        # Idempotency check — skip if already seeded
        from sqlalchemy import select
        existing = await db.execute(select(User).where(User.national_id == "0000000000"))
        if existing.scalars().first():
            print("Database already seeded. Skipping.")
            print("\n--- Test Accounts ---")
            print("👨‍💼 Admin:   National ID: 0000000000 | Pass: admin123")
            print("👩‍⚕️ Doctor:  National ID: 1111111111 | Pass: doctor123")
            print("🤒 Patient: National ID: 9901234567 | Pass: patient123")
            return
        
        # 1. Create Admin
        admin_pass = get_password_hash("admin123")
        admin = User(
            national_id="0000000000",
            email="admin@hakeem.jo",
            hashed_password=admin_pass,
            full_name_ar="مدير النظام",
            role=RoleEnum.ADMIN
        )
        db.add(admin)

        # 2. Create Doctor
        doctor_pass = get_password_hash("doctor123")
        doctor = User(
            national_id="1111111111",
            email="dr.sara@hakeem.jo",
            hashed_password=doctor_pass,
            full_name_ar="د. سارة الأحمد",
            role=RoleEnum.DOCTOR
        )
        db.add(doctor)

        # 3. Create Patient (Matches our Hackathon Demo Scenario)
        patient_pass = get_password_hash("patient123")
        patient = User(
            national_id="9901234567",
            email="ahmad@example.com",
            hashed_password=patient_pass,
            full_name_ar="أحمد محمد العبدالله",
            role=RoleEnum.PATIENT
        )
        db.add(patient)
        
        await db.commit()
        await db.refresh(patient)

        # 4. Create Patient Profile
        profile = PatientProfile(
            user_id=patient.id,
            blood_type="O+",
            date_of_birth=datetime(1959, 5, 12)
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

        # 5. Add Conditions
        conditions = [
            Condition(patient_id=profile.id, name="Type 2 Diabetes", name_ar="السكري من النوع الثاني", is_chronic=True, status="active"),
            Condition(patient_id=profile.id, name="Hypertension", name_ar="ارتفاع ضغط الدم", is_chronic=True, status="active"),
            Condition(patient_id=profile.id, name="Chronic Kidney Disease Stage 3", name_ar="مرض الكلى المزمن - المرحلة 3", is_chronic=True, status="active")
        ]
        db.add_all(conditions)

        # 6. Add Medications
        medications = [
            Medication(patient_id=profile.id, name="Metformin", dosage="1000mg", frequency="BID (Twice a day)", is_active=True),
            Medication(patient_id=profile.id, name="Lisinopril", dosage="20mg", frequency="QD (Once a day)", is_active=True)
        ]
        db.add_all(medications)

        # 7. Add Allergies
        allergies = [
            Allergy(patient_id=profile.id, allergen="Penicillin", severity="life-threatening"),
            Allergy(patient_id=profile.id, allergen="Peanuts", severity="moderate")
        ]
        db.add_all(allergies)

        # 8. Add Lab Results
        labs = [
            LabResult(patient_id=profile.id, test_name="HbA1c", value="8.2", unit="%", tested_at=datetime.now() - timedelta(days=5)),
            LabResult(patient_id=profile.id, test_name="eGFR", value="38", unit="mL/min", tested_at=datetime.now() - timedelta(days=2)),
            LabResult(patient_id=profile.id, test_name="Creatinine", value="1.8", unit="mg/dL", tested_at=datetime.now() - timedelta(days=2))
        ]
        db.add_all(labs)

        await db.commit()
        print("Database seeded successfully! 🎉")
        print("\n--- Test Accounts ---")
        print("👨‍💼 Admin:   National ID: 0000000000 | Pass: admin123")
        print("👩‍⚕️ Doctor:  National ID: 1111111111 | Pass: doctor123")
        print("🤒 Patient: National ID: 9901234567 | Pass: patient123")

if __name__ == "__main__":
    asyncio.run(seed_data())
