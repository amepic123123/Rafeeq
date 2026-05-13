import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

async def check():
    async with AsyncSessionLocal() as s:
        r = await s.execute(select(User))
        users = r.scalars().all()
        for u in users:
            print(f"ID: {u.national_id}")

if __name__ == "__main__":
    asyncio.run(check())
