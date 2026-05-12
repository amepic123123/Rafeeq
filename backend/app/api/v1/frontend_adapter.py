from fastapi import APIRouter
from datetime import datetime, timezone
from typing import Dict, Any

router = APIRouter()

def success_response(data: Any) -> Dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "message": None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/{patientId}")
async def get_patient_profile(patientId: str):
    return success_response({
        "id": patientId,
        "nameAr": "خالد العمري",
        "nameEn": "Khalid Al-Omari",
        "age": 52,
        "gender": "male",
        "nationalId": "9****3847",
        "bloodType": "A+",
        "city": "عمّان",
        "healthScore": 74,
        "hakeemSynced": True,
        "lastSyncedAt": datetime.now(timezone.utc).isoformat(),
        "conditions": ["داء السكري من النوع 2", "ارتفاع ضغط الدم"],
        "allergies": ["البنسلين"]
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
async def get_quick_stats(patientId: str):
    return success_response({
        "hba1c": "7.1%",
        "hba1cDelta": "0.3% تحسّن",
        "hba1cGood": True,
        "bloodPressure": "138/88",
        "bloodPressureDelta": "تحسّن",
        "bloodPressureGood": True,
        "medicationToday": "4/4",
        "medicationDelta": "مكتمل",
        "medicationGood": True
    })

@router.get("/{patientId}/insights")
async def get_insights(patientId: str):
    return success_response([
        {
            "id": 1,
            "emoji": "🥗",
            "textAr": "سكرك التراكمي نزل لـ 7.1%! سحا وعافية، استمر على هالنظام.",
            "textEn": "Your HbA1c dropped to 7.1%! Great job, keep it up.",
            "time": "قبل ساعتين",
            "tag": "سكر الدم",
            "severity": "green"
        },
        {
            "id": 2,
            "emoji": "🌙",
            "textAr": "بما إنه رمضان قرّب، عدّلنا أوقات دواء الميتفورمين لتناسب الإفطار والسحور.",
            "textEn": "With Ramadan approaching, we adjusted your Metformin schedule.",
            "time": "قبل 5 ساعات",
            "tag": "أدوية",
            "severity": "blue"
        },
        {
            "id": 3,
            "emoji": "⚠️",
            "textAr": "ضغطك كان مرتفع شوي امبارح (138/88). حاول ترتاح وتقلل ملح.",
            "textEn": "BP was slightly high yesterday. Rest and reduce salt.",
            "time": "أمس",
            "tag": "ضغط الدم",
            "severity": "yellow"
        }
    ])

@router.get("/{patientId}/medications")
async def get_medications(patientId: str):
    return success_response([
        {
            "id": 101,
            "name": "ميتفورمين (Metformin) 1000mg",
            "nameEn": "Metformin 1000mg",
            "dose": "حبة واحدة بعد الإفطار",
            "doseEn": "One pill after Iftar",
            "ramadan": True,
            "timing": "iftar",
            "color": "#F97316"
        },
        {
            "id": 102,
            "name": "أملوديبين (Amlodipine) 5mg",
            "nameEn": "Amlodipine 5mg",
            "dose": "حبة واحدة بعد السحور",
            "doseEn": "One pill after Suhoor",
            "ramadan": True,
            "timing": "suhoor",
            "color": "#3B82F6"
        }
    ])

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
async def get_risk_flags(patientId: str):
    return success_response([
        {
            "id": 1,
            "level": "red",
            "icon": "⚠️",
            "titleAr": "تداخل دوائي حاد",
            "titleEn": "Severe Drug Interaction",
            "descAr": "ميتفورمين مع دواء كلوپيدوگرل قد يسبب هبوط حاد في السكر.",
            "descEn": "Metformin with Clopidogrel may cause severe hypoglycemia.",
            "drugs": ["Metformin", "Clopidogrel"]
        },
        {
            "id": 2,
            "level": "yellow",
            "icon": "⚖️",
            "titleAr": "جرعة زائدة محتملة",
            "titleEn": "Potential Overdose",
            "descAr": "المريض يتناول نوعين من خافضات الضغط. يرجى المراقبة.",
            "descEn": "Patient is taking two types of antihypertensives.",
            "drugs": ["Amlodipine", "Lisinopril"]
        }
    ])

@router.get("/{patientId}/hakeem-history")
async def get_hakeem_history(patientId: str, limit: int = 10):
    return success_response([
        { "date": "2026-04-10", "event": "زيارة عيادة السكري", "result": "صرف علاج جديد", "doctor": "د. سمير النجار" },
        { "date": "2026-03-22", "event": "فحص مختبر شامل", "result": "تحسن في وظائف الكلى", "doctor": "مختبرات البشير" },
        { "date": "2025-11-05", "event": "طوارئ - ارتفاع ضغط الدم", "result": "تم إعطاء خافض ضغط وريدي", "doctor": "د. ليلى عبدون" }
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
    # Temporary mock response
    return success_response({
        "id": 999,
        "role": "ai",
        "textAr": "هذه رسالة تجريبية من الخادم.",
        "textEn": "This is a mock response from the server.",
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
        },
        {
            "id": "JO-FAM-02",
            "nameAr": "محمد العمري",
            "nameEn": "Mohammad Al-Omari",
            "relation": "son",
            "age": 18,
            "healthScore": 88,
            "alerts": 1
        }
    ])

@router.get("/{patientId}/family/summary")
async def get_family_summary(patientId: str):
    return success_response({
        "totalMembers": 2,
        "needsAttention": 1,
        "lastUpdate": datetime.now(timezone.utc).isoformat()
    })
 
 p r e s c r i p t i o n _ r o u t e r   =   A P I R o u t e r ( )  
 @ p r e s c r i p t i o n _ r o u t e r . p o s t ( " / a n a l y z e " )  
 a s y n c   d e f   a n a l y z e _ p r e s c r i p t i o n ( ) :  
         r e t u r n   s u c c e s s _ r e s p o n s e ( {  
                 " m e d i c a t i o n C o u n t " :   3 ,  
                 " w a r n i n g C o u n t " :   1 ,  
                 " a l l e r g y C o u n t " :   0 ,  
                 " r i s k F l a g s " :   [ ] ,  
                 " e x t r a c t e d M e d i c a t i o n s " :   [  
                         {   " d r u g " :   " M e t f o r m i n " ,   " n o t e " :   " "EF  DD'3*./'E" ,   " o k " :   T r u e   }  
                 ]  
         } )  
 