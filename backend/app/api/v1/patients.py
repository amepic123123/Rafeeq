from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_patient
from app.db.session import get_db
from app.models.user import User
from app.models.patient import PatientProfile, Condition, Medication, Allergy, LabResult
from app.schemas.patient_data_schema import PatientProfileResponse, PatientHistoryResponse, AISummaryResponse, AIRecommendationsResponse
from app.services.patient_service import PatientAIService

router = APIRouter()

async def get_full_patient_profile(user_id: str, db: AsyncSession) -> PatientProfile:
    result = await db.execute(
        select(PatientProfile)
        .where(PatientProfile.user_id == user_id)
        .options(
            selectinload(PatientProfile.conditions),
            selectinload(PatientProfile.medications),
            selectinload(PatientProfile.allergies),
            selectinload(PatientProfile.lab_results),
        )
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return profile

@router.get("/me", response_model=PatientProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_full_patient_profile(current_user.id, db)
    return profile

@router.get("/me/history", response_model=PatientHistoryResponse)
async def get_my_history(
    current_user: User = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_full_patient_profile(current_user.id, db)
    return PatientHistoryResponse(
        conditions=profile.conditions,
        medications=profile.medications,
        allergies=profile.allergies,
        lab_results=profile.lab_results
    )

@router.get("/me/summary", response_model=AISummaryResponse)
async def get_my_ai_summary(
    current_user: User = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_full_patient_profile(current_user.id, db)
    
    # Convert profile to text block for LLM
    history_text = f"Conditions: {[c.name for c in profile.conditions]}\n"
    history_text += f"Medications: {[m.name for m in profile.medications]}\n"
    history_text += f"Labs: {[l.test_name + ' ' + l.value for l in profile.lab_results]}\n"
    
    ai_service = PatientAIService()
    summary = await ai_service.generate_health_summary(history_text)
    
    return AISummaryResponse(**summary)

@router.get("/me/recommendations", response_model=AIRecommendationsResponse)
async def get_my_recommendations(
    current_user: User = Depends(get_current_patient),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_full_patient_profile(current_user.id, db)
    
    history_text = f"Conditions: {[c.name for c in profile.conditions]}\n"
    history_text += f"Medications: {[m.name for m in profile.medications]}\n"
    
    ai_service = PatientAIService()
    recs = await ai_service.generate_recommendations(history_text)
    
    return AIRecommendationsResponse(recommendations=recs)
