import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal, engine
from app.models.base import Base
from app.models.user import User, RoleEnum
from app.models.patient import PatientProfile, Condition, Medication, Allergy, LabResult, Vitals
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

        for u_data in users_data:
            res = await session.execute(
                select(User).where(User.national_id == u_data["id"]).options(selectinload(User.patient_profile))
            )
            user = res.scalar_one_or_none()
            
            if not user:
                user = User(
                    national_id=u_data["id"],
                    full_name_ar=u_data["name"],
                    hashed_password=pwd_context.hash("patient123"),
                    role=RoleEnum.PATIENT
                )
                session.add(user)
                await session.flush()
                profile = PatientProfile(user_id=user.id, blood_type="O+", date_of_birth=datetime.now() - timedelta(days=35*365))
                session.add(profile)
                await session.flush()
            else:
                profile = user.patient_profile

            # Add Conditions
            for c_name in u_data.get("conditions", []):
                session.add(Condition(patient_id=profile.id, name=c_name, name_ar=c_name, status="active"))
            
            # Add Medications
            for m_name, dose, freq in u_data.get("medications", []):
                session.add(Medication(patient_id=profile.id, name=m_name, dosage=dose, frequency=freq, is_active=True))

            await add_history(session, profile.id, u_data["hba1c"], u_data["bp"])

        await session.commit()
        print("Done seeding conditions and medications.")

if __name__ == "__main__":
    asyncio.run(seed_more_patients())
