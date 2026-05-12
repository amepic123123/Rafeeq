from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


from app.api.dependencies import get_current_doctor
from app.db.session import get_db
from app.models.user import User, RoleEnum
from app.models.patient import PatientProfile
from app.schemas.prescription_schema import PrescriptionAnalysisResponse
from app.schemas.doctor_schema import PatientSearchResponse, PatientSearchResult, DoctorPatientProfileResponse
from app.schemas.patient_data_schema import PatientProfileResponse, PatientHistoryResponse
from app.services.ocr_service import OCRService
from app.services.safety_engine import SafetyEngine

router = APIRouter()

@router.get("/patients/search", response_model=PatientSearchResponse)
async def search_patients(
    query: str,
    current_doctor: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db)
):
    # Search by national ID or name
    stmt = select(User).join(PatientProfile).where(
        User.role == RoleEnum.PATIENT,
        (User.national_id.ilike(f"%{query}%")) | (User.full_name_ar.ilike(f"%{query}%"))
    ).limit(10)
    
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    # Needs to fetch patient_profile_id for each user to return
    results = []
    for user in users:
        # Since we joined PatientProfile, we can fetch it. But let's do a simple query for safety
        prof_result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.id))
        profile = prof_result.scalars().first()
        if profile:
            results.append(PatientSearchResult(
                user_id=user.id,
                patient_profile_id=profile.id,
                national_id=user.national_id,
                full_name_ar=user.full_name_ar,
                date_of_birth=profile.date_of_birth
            ))
            
    return PatientSearchResponse(results=results)

@router.get("/patients/{patient_id}/profile", response_model=DoctorPatientProfileResponse)
async def get_patient_profile(
    patient_id: str,
    current_doctor: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db)
):
    # Reusing the get_full_patient_profile logic from patients router
    from app.api.v1.patients import get_full_patient_profile
    
    # We first need the user_id corresponding to this patient_profile_id, or we can just fetch the profile by ID
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(PatientProfile)
        .where(PatientProfile.id == patient_id)
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
        
    return DoctorPatientProfileResponse(
        profile=PatientProfileResponse.model_validate(profile),
        history=PatientHistoryResponse(
            conditions=profile.conditions,
            medications=profile.medications,
            allergies=profile.allergies,
            lab_results=profile.lab_results
        )
    )

@router.post("/prescriptions/analyze", response_model=PrescriptionAnalysisResponse)
async def analyze_prescription(
    patient_id: str = Form(...),
    file: UploadFile = File(...),
    current_doctor: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Read image
        file_content = await file.read()
        
        # 1. OCR processing
        ocr_service = OCRService()
        extracted_drugs = await ocr_service.process_image(file_content)
        
        # 2. Fetch patient profile — accepts EITHER the profile UUID or the patient's national_id
        result = await db.execute(select(PatientProfile).where(PatientProfile.id == patient_id))
        patient_profile = result.scalars().first()

        if not patient_profile:
            # Try looking up by national_id via the users table
            user_result = await db.execute(
                select(User).where(User.national_id == patient_id)
            )
            user = user_result.scalars().first()
            if user:
                prof_result = await db.execute(
                    select(PatientProfile).where(PatientProfile.user_id == user.id)
                )
                patient_profile = prof_result.scalars().first()
        
        # 3. Clinical Safety Analysis
        safety_engine = SafetyEngine()
        analysis_result = await safety_engine.analyze(extracted_drugs, patient_profile)
        
        return PrescriptionAnalysisResponse(
            status="ANALYZED",
            extracted_drugs=extracted_drugs,
            warnings=analysis_result["warnings"],
            risk_score=analysis_result["risk_score"],
            overall_risk=analysis_result["overall_risk"],
            summary_ar=analysis_result["summary_ar"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing prescription: {str(e)}")
