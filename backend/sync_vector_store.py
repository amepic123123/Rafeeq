import asyncio
from datetime import datetime
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as rest
from langchain_openai import OpenAIEmbeddings
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.patient import PatientProfile, Condition, Medication, LabResult, Vitals
from app.core.config import settings

# Initialize clients
qdrant = AsyncQdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=settings.OPENAI_API_KEY)

COLLECTION_NAME = "patient_medical_history"

async def ensure_collection():
    collections = await qdrant.get_collections()
    exists = any(c.name == COLLECTION_NAME for c in collections.collections)
    if not exists:
        print(f"Creating collection {COLLECTION_NAME}...")
        await qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=rest.VectorParams(size=1536, distance=rest.Distance.COSINE),
        )

def format_patient_data(user: User) -> str:
    profile = user.patient_profile
    if not profile:
        return ""
    
    text = f"Patient: {user.full_name_ar} (National ID: {user.national_id})\n"
    text += f"Blood Type: {profile.blood_type or 'Unknown'}\n\n"
    
    text += "Medical Conditions:\n"
    for cond in profile.conditions:
        date_str = cond.diagnosed_at.strftime("%Y-%m-%d") if cond.diagnosed_at else "Unknown"
        text += f"- {cond.name_ar or cond.name} (Diagnosed: {date_str})\n"
    
    text += "\nActive Medications:\n"
    for med in profile.medications:
        if med.is_active:
            text += f"- {med.name}: {med.dosage} ({med.frequency})\n"
    
    text += "\nRecent Lab Results:\n"
    for lab in profile.lab_results:
        text += f"- {lab.test_name}: {lab.value} {lab.unit} (Date: {lab.tested_at.strftime('%Y-%m-%d')})\n"
        
    text += "\nRecent Vital Signs:\n"
    for vital in profile.vitals:
        text += f"- Blood Pressure: {vital.systolic_bp}/{vital.diastolic_bp} mmHg (Date: {vital.recorded_at.strftime('%Y-%m-%d')})\n"
        
    return text

async def sync_all():
    await ensure_collection()
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User)
            .options(
                selectinload(User.patient_profile).selectinload(PatientProfile.conditions),
                selectinload(User.patient_profile).selectinload(PatientProfile.medications),
                selectinload(User.patient_profile).selectinload(PatientProfile.lab_results),
                selectinload(User.patient_profile).selectinload(PatientProfile.vitals)
            )
        )
        users = result.scalars().all()
        
        points = []
        for user in users:
            if not user.patient_profile:
                continue
                
            raw_text = format_patient_data(user)
            if not raw_text:
                continue
                
            print(f"Embedding data for {user.national_id}...")
            vector = await embeddings.aembed_query(raw_text)
            
            import uuid
            points.append(rest.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "patient_id": user.national_id,
                    "raw_text": raw_text,
                    "updated_at": datetime.now().isoformat()
                }
            ))
            
        if points:
            print(f"Upserting {len(points)} points to Qdrant...")
            await qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
            print("Sync complete.")
        else:
            print("No data to sync.")

if __name__ == "__main__":
    asyncio.run(sync_all())
