from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import Dict, Any

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

async def get_profile(db: AsyncSession):
    result = await db.execute(
        select(PatientProfile)
        .options(
            selectinload(PatientProfile.user),
            selectinload(PatientProfile.conditions),
            selectinload(PatientProfile.medications),
            selectinload(PatientProfile.allergies),
            selectinload(PatientProfile.lab_results),
        )
    )
    profiles = result.scalars().all()
    if not profiles:
        raise HTTPException(status_code=404, detail="No patients found in DB")
    return profiles[0]

@router.get("/{patientId}")
async def get_patient_profile(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db)
    
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
async def get_health_score(patientId: str):
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
    profile = await get_profile(db)
    
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
    profile = await get_profile(db)
    
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
        
    insights.append({
        "id": 2,
        "emoji": "🌙",
        "textAr": "بما إنه رمضان قرّب، تم تعديل أوقات أدويتك.",
        "textEn": "Ramadan timings applied.",
        "time": "قبل 5 ساعات",
        "tag": "أدوية",
        "severity": "blue"
    })
    
    return success_response(insights)

@router.get("/{patientId}/medications")
async def get_medications(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db)
    
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
async def get_hba1c(patientId: str):
    return success_response([
        { "month": "يناير", "value": 8.2 },
        { "month": "فبراير", "value": 8.0 },
        { "month": "مارس", "value": 7.8 },
        { "month": "أبريل", "value": 7.5 },
        { "month": "مايو", "value": 7.1 }
    ])

@router.get("/{patientId}/labs/blood-pressure")
async def get_bp(patientId: str):
    return success_response([
        { "day": "السبت", "systolic": 142, "diastolic": 90 },
        { "day": "الأحد", "systolic": 138, "diastolic": 88 },
        { "day": "الإثنين", "systolic": 135, "diastolic": 85 },
        { "day": "الثلاثاء", "systolic": 136, "diastolic": 86 },
        { "day": "اليوم", "systolic": 130, "diastolic": 82 }
    ])

@router.get("/{patientId}/risk-flags")
async def get_risk_flags(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db)
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
async def get_hakeem_history(patientId: str, limit: int = 10):
    return success_response([
        { "date": "2026-04-10", "event": "زيارة عيادة السكري", "result": "صرف علاج جديد", "doctor": "د. سارة الأحمد" },
        { "date": "2026-03-22", "event": "فحص مختبر شامل", "result": "انخفاض وظائف الكلى", "doctor": "مختبرات البشير" }
    ])

@router.get("/{patientId}/chat/history")
async def get_chat_history(patientId: str, limit: int = 50):
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
async def post_chat_message(patientId: str):
    return success_response({
        "id": 999,
        "role": "ai",
        "textAr": "نعم، يمكنك تناول دوائك بعد الإفطار مباشرة.",
        "textEn": "Yes, you can take your medicine right after Iftar.",
        "time": datetime.now().strftime("%H:%M")
    })

@router.get("/{patientId}/family")
async def get_family(patientId: str):
    return success_response([
        {
            "id": "JO-FAM-01",
            "nameAr": "سارة العمري",
            "nameEn": "Sara Al-Omari",
            "relation": "daughter",
            "age": 22,
            "healthScore": 95,
            "alerts": 0
        }
    ])

@router.get("/{patientId}/family/summary")
async def get_family_summary(patientId: str):
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