from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import Dict, Any, List
from pydantic import BaseModel

from app.db.vector_store import get_qdrant
from app.services.rag_service import RAGService

from app.db.session import get_db
from app.models.user import User
from app.models.patient import PatientProfile

router = APIRouter()
prescription_router = APIRouter()

def success_response(data: Any) -> Dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "message": None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

async def get_profile(db: AsyncSession, patient_id: str):
    pid = patient_id.strip()
    # Try to find user by national_id first (case-insensitive)
    result = await db.execute(
        select(User)
        .where(func.lower(User.national_id) == func.lower(pid))
        .options(
            selectinload(User.patient_profile).selectinload(PatientProfile.conditions),
            selectinload(User.patient_profile).selectinload(PatientProfile.medications),
            selectinload(User.patient_profile).selectinload(PatientProfile.allergies),
            selectinload(User.patient_profile).selectinload(PatientProfile.lab_results),
            selectinload(User.patient_profile).selectinload(PatientProfile.vitals),
            selectinload(User.patient_profile).selectinload(PatientProfile.user) # Crucial: load user back-ref
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")
    
    if not user.patient_profile:
        raise HTTPException(status_code=404, detail=f"Patient profile not found for ID {patient_id}")
        
    return user.patient_profile

@router.get("/{patientId}")
async def get_patient_profile(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db, patientId)
    
    age = 0
    if profile.date_of_birth:
        age = (datetime.now() - profile.date_of_birth).days // 365
        
    return success_response({
        "id": patientId,
        "nameAr": profile.user.full_name_ar if profile.user else "مجهول",
        "nameEn": "Patient Name",
        "age": age,
        "gender": "male",
        "nationalId": profile.user.national_id if profile.user else "N/A",
        "bloodType": profile.blood_type or "Unknown",
        "city": "عمّان",
        "healthScore": 74,
        "hakeemSynced": True,
        "lastSyncedAt": datetime.now(timezone.utc).isoformat(),
        "conditions": [c.name_ar or c.name for c in profile.conditions],
        "allergies": [a.allergen for a in profile.allergies]
    })

@router.get("/{patientId}/health-score")
async def get_health_score(patientId: str, db: AsyncSession = Depends(get_db)):
    await get_profile(db, patientId) # Ensure patient exists
    return success_response({
        "overall": 74,
        "subMetrics": [
            { "label": "التزام الدواء", "value": 95, "color": "#22C55E" },
            { "label": "نشاط بدني", "value": 55, "color": "#F59E0B" },
            { "label": "تغذية", "value": 70, "color": "#52B788" }
        ]
    })

@router.get("/{patientId}/quick-stats")
async def get_quick_stats(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db, patientId)
    
    hba1c_val = "N/A"
    for lab in profile.lab_results:
        if lab.test_name == "HbA1c":
            hba1c_val = f"{lab.value}{lab.unit}"
            break
            
    med_count = len([m for m in profile.medications if m.is_active])
    
    return success_response({
        "hba1c": hba1c_val,
        "hba1cDelta": "0.3% تحسّن",
        "hba1cGood": True,
        "bloodPressure": "138/88",
        "bloodPressureDelta": "تحسّن",
        "bloodPressureGood": True,
        "medicationToday": f"{med_count}/{med_count}",
        "medicationDelta": "مكتمل",
        "medicationGood": True
    })

@router.get("/{patientId}/insights")
async def get_insights(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db, patientId)
    
    # We can generate dynamic insights based on the DB!
    insights = []
    
    hba1c_val = None
    for lab in profile.lab_results:
        if lab.test_name == "HbA1c":
            hba1c_val = float(lab.value)
            break
            
    if hba1c_val and hba1c_val > 7.0:
        insights.append({
            "id": 1,
            "emoji": "⚠️",
            "textAr": f"فحص السكري التراكمي الأخير ({hba1c_val}%) أعلى من المعدل. يرجى الانتباه للحمية.",
            "textEn": f"HbA1c ({hba1c_val}%) is above target.",
            "time": "اليوم",
            "tag": "سكر الدم",
            "severity": "yellow"
        })
    else:
         insights.append({
            "id": 1,
            "emoji": "🥗",
            "textAr": f"سكرك التراكمي مستقر. ممتاز!",
            "textEn": "HbA1c is stable.",
            "time": "اليوم",
            "tag": "سكر الدم",
            "severity": "green"
        })
        
    
    return success_response(insights)

@router.get("/{patientId}/medications")
async def get_medications(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db, patientId)
    
    meds = []
    colors = ["#F97316", "#3B82F6", "#52B788", "#8B5CF6"]
    timings = ["iftar", "suhoor", "morning", "night"]
    
    for i, m in enumerate(profile.medications):
        meds.append({
            "id": i+1,
            "name": f"{m.name} {m.dosage or ''}",
            "nameEn": f"{m.name} {m.dosage or ''}",
            "dose": m.frequency or "مرة يومياً",
            "doseEn": m.frequency or "Once daily",
            "ramadan": True,
            "timing": timings[i % len(timings)],
            "color": colors[i % len(colors)]
        })
        
    return success_response(meds)

@router.get("/{patientId}/labs/hba1c")
async def get_hba1c(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db, patientId)
    
    # Filter HbA1c results and map to chart format
    results = [
        {"month": lab.tested_at.strftime("%b"), "value": float(lab.value)}
        for lab in profile.lab_results
        if lab.test_name == "HbA1c"
    ]
    # Sort by date
    results.sort(key=lambda x: x['month']) # Basic sort for MVP
    return success_response(results)

@router.get("/{patientId}/labs/blood-pressure")
async def get_bp(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db, patientId)
    
    results = [
        {
            "day": v.recorded_at.strftime("%a"),
            "systolic": v.systolic_bp,
            "diastolic": v.diastolic_bp
        }
        for v in profile.vitals
    ]
    return success_response(results)

@router.get("/{patientId}/risk-flags")
async def get_risk_flags(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db, patientId)
    flags = []
    
    has_diabetes = any("Diab" in c.name or "سكر" in (c.name_ar or "") for c in profile.conditions)
    has_ckd = any("Kidney" in c.name or "كل" in (c.name_ar or "") for c in profile.conditions)
    
    if has_diabetes and has_ckd:
        flags.append({
            "id": 1,
            "level": "red",
            "icon": "⚠️",
            "titleAr": "تداخل مرضين مزمنين (سكري + كلى)",
            "titleEn": "Diabetes + CKD",
            "descAr": "انتبه لاختيار الأدوية حيث يعاني المريض من اعتلال كلوي.",
            "descEn": "Careful with meds due to CKD.",
            "drugs": []
        })
        
    return success_response(flags)

@router.get("/{patientId}/hakeem-history")
async def get_hakeem_history(patientId: str, limit: int = 10, db: AsyncSession = Depends(get_db)):
    # In a real app, we'd have a HakeemEncounter table.
    # For now, let's generate it dynamically from the conditions/labs to make it feel "real"
    profile = await get_profile(db, patientId)
    
    history = []
    # Add an entry for each condition diagnosis
    for cond in profile.conditions:
        date_str = cond.diagnosed_at.strftime("%Y-%m-%d") if cond.diagnosed_at else "2026-05-10"
        history.append({
            "date": date_str,
            "event": f"تشخيص: {cond.name_ar or cond.name}",
            "result": "مستقر",
            "doctor": "د. أحمد صبحي"
        })
        
    # Add entries for labs
    for lab in profile.lab_results:
        history.append({
            "date": lab.tested_at.strftime("%Y-%m-%d"),
            "event": f"فحص مخبري: {lab.test_name}",
            "result": f"{lab.value} {lab.unit}",
            "doctor": "مختبرات البشير"
        })
        
    # Sort by date
    history.sort(key=lambda x: x['date'], reverse=True)
    return success_response(history[:limit])

@router.get("/{patientId}/chat/history")
async def get_chat_history(patientId: str, db: AsyncSession = Depends(get_db), limit: int = 50):
    await get_profile(db, patientId)
    return success_response([
        {
            "id": 1,
            "role": "ai",
            "textAr": "أهلاً بك في رفيق! كيف يمكنني مساعدتك اليوم؟",
            "textEn": "Welcome to Rafeeq! How can I help you today?",
            "time": "09:00"
        }
    ])

@router.post("/{patientId}/chat/message")
async def post_chat_message(
    patientId: str, 
    request_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    qdrant = Depends(get_qdrant)
):
    try:
        profile = await get_profile(db, patientId)
        message = request_data.get("message", "")
        
        print(f"INFO: Generating AI response for {patientId}. Message: {message[:50]}...")
        
        rag = RAGService(qdrant)
        ai_text = await rag.generate_response(
            patient_id=patientId,
            query=message,
            session_id="ui-session"
        )
        
        return success_response({
            "id": int(datetime.now().timestamp()),
            "role": "ai",
            "textAr": ai_text,
            "textEn": ai_text,
            "time": datetime.now().strftime("%H:%M")
        })
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"ERROR in post_chat_message: {error_detail}")
        # Return a slightly more helpful error to the UI for debugging
        return success_response({
            "id": int(datetime.now().timestamp()),
            "role": "ai",
            "textAr": f"عذراً، حدث خطأ: {str(e)}",
            "textEn": f"Error: {str(e)}",
            "time": datetime.now().strftime("%H:%M")
        })

@router.get("/{patientId}/chat/suggested-prompts")
async def get_suggested_prompts(patientId: str, db: AsyncSession = Depends(get_db)):
    await get_profile(db, patientId)
    return success_response([
        { "id": 1, "textAr": "متى يجب أن آخذ الميتفورمين؟", "textEn": "When should I take Metformin?" },
        { "id": 2, "textAr": "هل جرعة الأنسولين صحيحة؟", "textEn": "Is the insulin dose correct?" }
    ])

@router.get("/{patientId}/family")
async def get_family(patientId: str, db: AsyncSession = Depends(get_db)):
    await get_profile(db, patientId)
    return success_response([
        {
            "id": "JO-FAM-01",
            "nameAr": "سارة العمري",
            "nameEn": "Sara Al-Omari",
            "role": "daughter",
            "age": 22,
            "healthScore": 95,
            "alerts": 0,
            "avatar": "س",
            "color": "#F472B6"
        }
    ])

@router.get("/doctor/recent-patients")
async def get_recent_patients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PatientProfile)
        .options(selectinload(PatientProfile.user))
        .limit(5)
    )
    profiles = result.scalars().all()
    
    patients = []
    for p in profiles:
        age = 0
        if p.date_of_birth:
            age = (datetime.now() - p.date_of_birth).days // 365
            
        patients.append({
            "id": p.user.national_id if p.user else "N/A",
            "name": p.user.full_name_ar if p.user else "مجهول",
            "age": age,
            "lastVisit": "اليوم، 08:30 ص", # Mocking visit time for now
            "status": "مراجعة أدوية",
            "initial": p.user.full_name_ar[0] if p.user and p.user.full_name_ar else "ح"
        })
        
    return success_response(patients)

@router.get("/{patientId}/family/summary")
async def get_family_summary(patientId: str, db: AsyncSession = Depends(get_db)):
    await get_profile(db, patientId)
    return success_response({
        "avgHealthScore": 95,
        "weeklyAppointments": 0,
        "activeMedications": 1,
        "pendingLabResults": 0,
        "totalMembers": 1,
        "needsAttention": 0,
        "lastUpdate": datetime.now(timezone.utc).isoformat()
    })

@prescription_router.post("/analyze")
async def analyze_prescription():
    return success_response({
        "medicationCount": 3,
        "warningCount": 1,
        "allergyCount": 0,
        "riskFlags": [],
        "extractedMedications": [
            { "drug": "Metformin", "note": "آمن للاستخدام", "ok": True }
        ]
    })