import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.patient import PatientProfile
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def check():
    id_to_check = 'JO-2026-KHL-4821'
    async with AsyncSessionLocal() as s:
        r = await s.execute(
            select(User)
            .where(User.national_id == id_to_check)
            .options(selectinload(User.patient_profile).selectinload(PatientProfile.vitals))
        )
        u = r.scalar_one_or_none()
        if u:
            print(f"FOUND_USER: {u.national_id}")
            if u.patient_profile:
                print(f"FOUND_PROFILE: {u.patient_profile.id}")
            else:
                print("NO_PROFILE")
        else:
            print(f"USER_NOT_FOUND: {id_to_check}")
            # List some IDs to see what's there
            all_r = await s.execute(select(User.national_id).limit(10))
            print(f"Actual IDs in DB: {all_r.scalars().all()}")

if __name__ == "__main__":
    asyncio.run(check())
