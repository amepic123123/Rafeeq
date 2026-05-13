import asyncio
from app.db.session import engine
from sqlalchemy import text

async def run():
    async with engine.connect() as conn:
        r = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'"))
        print(f"Users columns: {r.fetchall()}")
        
        r = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patient_profiles'"))
        print(f"Profiles columns: {r.fetchall()}")

if __name__ == "__main__":
    asyncio.run(run())
