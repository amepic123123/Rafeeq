import asyncio
from datetime import datetime, timedelta
from random import Random
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal, engine
from app.models.base import Base
from app.models.user import User, RoleEnum
from app.models.patient import PatientProfile, Condition, Medication, Allergy, LabResult, Vitals
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DEFAULT_PASSWORD = "patient123"

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables verified/created.")

async def add_history(session, profile_id, hba1c_vals, bp_vals):
    # Clear existing to avoid duplicates if re-running
    # For MVP, we just append or use a unique check. Here we append for history.
    for i, val in enumerate(hba1c_vals):
        session.add(LabResult(
            patient_id=profile_id, 
            test_name="HbA1c", 
            value=str(val), 
            unit="%", 
            tested_at=datetime.now() - timedelta(days=30*(len(hba1c_vals)-i))
        ))
    for i, (sys, dia) in enumerate(bp_vals):
        session.add(Vitals(
            patient_id=profile_id, 
            systolic_bp=sys, 
            diastolic_bp=dia, 
            recorded_at=datetime.now() - timedelta(days=7*(len(bp_vals)-i))
        ))

async def add_lab_panel(session, profile_id, rng):
    lab_templates = [
        ("HbA1c", "%", 4.8, 9.5),
        ("LDL", "mg/dL", 60, 190),
        ("HDL", "mg/dL", 30, 70),
        ("Triglycerides", "mg/dL", 60, 260),
        ("Creatinine", "mg/dL", 0.6, 2.2),
        ("eGFR", "mL/min", 30, 120),
        ("Hemoglobin", "g/dL", 10, 17),
        ("Vitamin D", "ng/mL", 10, 50),
    ]
    lab_count = rng.randint(3, 6)
    for test_name, unit, low, high in rng.sample(lab_templates, lab_count):
        value = round(rng.uniform(low, high), 2)
        session.add(LabResult(
            patient_id=profile_id,
            test_name=test_name,
            value=str(value),
            unit=unit,
            tested_at=datetime.now() - timedelta(days=rng.randint(1, 90))
        ))

def build_mock_patients(count, seed=42):
    rng = Random(seed)
    first_names = [
        "Ahmed", "Sara", "Omar", "Laila", "Hassan", "Mona", "Khaled", "Nour",
        "Yousef", "Huda", "Tariq", "Salma", "Bilal", "Aya", "Rami", "Nada"
    ]
    last_names = [
        "Al-Omari", "Al-Najjar", "Al-Hassan", "Al-Masri", "Al-Rashid", "Al-Khatib",
        "Al-Qadi", "Al-Salem", "Al-Ahmad", "Al-Abbadi", "Al-Zoubi", "Al-Hourani"
    ]
    conditions_pool = [
        "Type 2 Diabetes", "Hypertension", "Asthma", "Hyperlipidemia",
        "Chronic Kidney Disease", "Hypothyroidism", "Coronary Artery Disease",
        "GERD", "Migraine", "Osteoarthritis", "Anemia", "Vitamin D Deficiency"
    ]
    medications_pool = [
        ("Metformin", "500mg", "BID"),
        ("Lisinopril", "10mg", "QD"),
        ("Amlodipine", "5mg", "QD"),
        ("Atorvastatin", "20mg", "QD"),
        ("Levothyroxine", "50mcg", "QD"),
        ("Omeprazole", "20mg", "QD"),
        ("Albuterol", "2 puffs", "PRN"),
        ("Vitamin D3", "2000 IU", "QD"),
    ]
    allergies_pool = [
        "Penicillin", "Peanuts", "Shellfish", "Latex", "NSAIDs", "Eggs", "Dust Mites"
    ]
    severities = ["mild", "moderate", "severe"]

    patients = []
    for i in range(count):
        national_id = f"MOCK-{i+1:05d}"
        full_name = f"{rng.choice(first_names)} {rng.choice(last_names)}"
        cond_count = rng.randint(1, 3)
        med_count = rng.randint(0, 3)
        allergy_count = rng.randint(0, 2)
        hba1c_vals = [round(rng.uniform(5.0, 9.0), 1) for _ in range(rng.randint(2, 4))]
        bp_vals = [(rng.randint(105, 160), rng.randint(65, 100)) for _ in range(rng.randint(2, 4))]

        patients.append({
            "id": national_id,
            "name": full_name,
            "conditions": rng.sample(conditions_pool, cond_count),
            "medications": rng.sample(medications_pool, med_count),
            "allergies": [(rng.choice(allergies_pool), rng.choice(severities)) for _ in range(allergy_count)],
            "hba1c": hba1c_vals,
            "bp": bp_vals,
            "seed_rng": rng
        })

    return patients

async def seed_more_patients():
    await create_tables()
    async with AsyncSessionLocal() as session:
        users_data = [
            {
                "id": "JO-2026-KHL-4821",
                "name": "Khaled Al-Omari",
                "conditions": ["سكري النوع الثاني", "ارتفاع ضغط الدم"],
                "medications": [("ميتفورمين", "500 ملغ", "مرتين يومياً"), ("ليسينوبريل", "10 ملغ", "مرة يومياً")],
                "hba1c": [8.2, 7.2],
                "bp": [(145, 92), (138, 88)]
            },
            {
                "id": "9901234567",
                "name": "Khaled Al-Omari (Legacy)",
                "conditions": ["سكري النوع الثاني"],
                "medications": [("ميتفورمين", "500 ملغ", "مرتين يومياً")],
                "hba1c": [7.2, 6.8],
                "bp": [(130, 82), (122, 75)]
            },
            {
                "id": "JO-2027-LAI-1122",
                "name": "Laila Mansour",
                "conditions": ["ما قبل السكري"],
                "medications": [],
                "hba1c": [5.8, 5.4],
                "bp": [(110, 70), (108, 68)]
            }
        ]

        users_data.extend(build_mock_patients(120))

        for u_data in users_data:
            res = await session.execute(
                select(User).where(User.national_id == u_data["id"]).options(selectinload(User.patient_profile))
            )
            user = res.scalar_one_or_none()
            
            if not user:
                user = User(
                    national_id=u_data["id"],
                    full_name_ar=u_data["name"],
                    hashed_password=pwd_context.hash(DEFAULT_PASSWORD),
                    role=RoleEnum.PATIENT
                )
                session.add(user)
                await session.flush()
                profile = PatientProfile(
                    user_id=user.id,
                    blood_type="O+",
                    date_of_birth=datetime.now() - timedelta(days=35*365)
                )
                session.add(profile)
                await session.flush()
            else:
                profile = user.patient_profile

            if profile is None:
                profile = PatientProfile(
                    user_id=user.id,
                    blood_type="O+",
                    date_of_birth=datetime.now() - timedelta(days=35*365)
                )
                session.add(profile)
                await session.flush()

            existing_condition = await session.execute(
                select(Condition.id).where(Condition.patient_id == profile.id).limit(1)
            )
            if existing_condition.scalar_one_or_none():
                continue

            # Add Conditions
            for c_name in u_data.get("conditions", []):
                session.add(Condition(patient_id=profile.id, name=c_name, name_ar=c_name, status="active"))
            
            # Add Medications
            for m_name, dose, freq in u_data.get("medications", []):
                session.add(Medication(patient_id=profile.id, name=m_name, dosage=dose, frequency=freq, is_active=True))

            # Add Allergies
            for allergen, severity in u_data.get("allergies", []):
                session.add(Allergy(patient_id=profile.id, allergen=allergen, severity=severity))

            await add_history(session, profile.id, u_data["hba1c"], u_data["bp"])
            await add_lab_panel(session, profile.id, u_data.get("seed_rng", Random(42)))

        await session.commit()
        print("Done seeding conditions, medications, allergies, labs, and vitals.")

if __name__ == "__main__":
    asyncio.run(seed_more_patients())