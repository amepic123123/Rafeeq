import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.patient import PatientProfile
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def check():
    async with AsyncSessionLocal() as s:
        r = await s.execute(
            select(User)
            .where(User.national_id == '9901234567')
            .options(selectinload(User.patient_profile).selectinload(PatientProfile.vitals))
        )
        u = r.scalar_one_or_none()
        if u:
            print("FOUND_USER")
            if u.patient_profile:
                print("FOUND_PROFILE")
                # Try to access properties that might fail
                try:
                    print(f"Age check: {u.patient_profile.date_of_birth}")
                    print(f"Vitals check: {len(u.patient_profile.vitals)}")
                except Exception as e:
                    print(f"PROPERTY_ACCESS_ERROR: {e}")
            else:
                print("NO_PROFILE")
        else:
            print("USER_NOT_FOUND")

if __name__ == "__main__":
    asyncio.run(check())
