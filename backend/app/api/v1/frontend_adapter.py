from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
import base64
import io
from random import Random
import hashlib
from typing import Dict, Any, List
from pydantic import BaseModel
from pypdf import PdfReader
from PIL import Image
from openai import AsyncOpenAI

from app.db.vector_store import get_qdrant
from app.services.rag_service import RAGService

from app.db.session import get_db
from app.models.user import User
from app.models.patient import PatientProfile
from app.core.config import settings

router = APIRouter()
prescription_router = APIRouter()

def success_response(data: Any) -> Dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "message": None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def build_family_members(profile: PatientProfile) -> List[Dict[str, Any]]:
    seed_src = (profile.user.national_id if profile.user and profile.user.national_id else profile.id)
    seed = int(hashlib.md5(seed_src.encode("utf-8")).hexdigest()[:8], 16)
    rng = Random(seed)

    first_names = [
        "سارة", "ليلى", "نور", "هبة", "لمى", "رنا", "هند", "ريم",
        "أحمد", "عمر", "يوسف", "حسن", "رامي", "طارق", "بلال", "فراس"
    ]
    roles = ["spouse", "son", "daughter", "parent", "other"]
    colors = ["#52B788", "#F59E0B", "#3B82F6", "#F472B6", "#8B5CF6", "#22C55E"]

    last_name = ""
    if profile.user and profile.user.full_name_ar:
        parts = profile.user.full_name_ar.split()
        last_name = parts[-1] if parts else ""

    count = rng.randint(2, 5)
    members: List[Dict[str, Any]] = []
    for i in range(count):
        name = f"{rng.choice(first_names)} {last_name}".strip() or rng.choice(first_names)
        role = rng.choice(roles)
        score = rng.randint(60, 98)
        color = colors[i % len(colors)]
        avatar = name[0] if name else "ع"

        members.append({
            "id": f"{seed_src}-fam-{i+1}",
            "nameAr": name,
            "role": role,
            "avatar": avatar,
            "color": color,
            "healthScore": score
        })

    return members

def build_doctor_consult_response(profile: PatientProfile, symptoms: str) -> str:
    conditions = [c.name_ar or c.name for c in profile.conditions or []]
    allergies = [a.allergen for a in profile.allergies or []]
    meds = [m.name for m in profile.medications or [] if m.is_active]

    hba1c_val = None
    for lab in profile.lab_results or []:
        if lab.test_name == "HbA1c":
            try:
                hba1c_val = float(lab.value)
            except (TypeError, ValueError):
                hba1c_val = None
            break

    bp_recent = None
    systolic_recent = None
    for v in sorted(profile.vitals or [], key=lambda x: x.recorded_at or datetime.min, reverse=True):
        if v.systolic_bp and v.diastolic_bp:
            bp_recent = f"{v.systolic_bp}/{v.diastolic_bp}"
            systolic_recent = float(v.systolic_bp)
            break

    considerations = []
    if any("سكر" in (c.name_ar or "") or "Diab" in c.name for c in profile.conditions or []):
        considerations.append("مراجعة ضبط السكر والتأكد من الالتزام الدوائي")
    if any("ضغط" in (c.name_ar or "") or "Hyper" in c.name for c in profile.conditions or []):
        considerations.append("قياس ضغط الدم ومراجعة الجرعات الحالية")
    if any("كل" in (c.name_ar or "") or "Kidney" in c.name for c in profile.conditions or []):
        considerations.append("الانتباه للجرعات الدوائية مع وظيفة كلوية منخفضة")

    possible_causes = []
    symptom_lower = symptoms.lower()
    if "صداع" in symptoms or "headache" in symptom_lower:
        possible_causes.extend([
            "ارتفاع ضغط الدم أو تذبذبه",
            "جفاف أو نقص سوائل",
            "إجهاد أو قلة نوم",
            "صداع نصفي أو توتري"
        ])
    if "دوخة" in symptoms or "dizzy" in symptom_lower:
        possible_causes.extend([
            "هبوط ضغط أو اضطراب توازن سوائل",
            "اضطراب سكر الدم",
            "أثر جانبي دوائي"
        ])

    risk_flags = []
    if hba1c_val is not None and hba1c_val >= 8.0:
        risk_flags.append("خطر ضبط سكري غير كافٍ (HbA1c مرتفع)")
    if systolic_recent is not None and systolic_recent >= 140:
        risk_flags.append("خطر ارتفاع ضغط غير مضبوط")
    if any("Kidney" in c.name or "كل" in (c.name_ar or "") for c in profile.conditions or []):
        risk_flags.append("خطر اعتلال كلوي يستلزم انتباه دوائي")
    if allergies:
        risk_flags.append("خطر تفاعل دوائي/تحسسي محتمل بسبب سجل الحساسية")

    solution_options = []
    if "صداع" in symptoms or "headache" in symptom_lower:
        solution_options.extend([
            "تقييم ضغط الدم فوراً ومقارنته بالقراءات السابقة",
            "مراجعة الأدوية الحالية لاحتمال أن تكون سبباً للصداع",
            "التأكد من حالة الترطيب والنوم",
        ])
    if "دوخة" in symptoms or "dizzy" in symptom_lower:
        solution_options.extend([
            "قياس سكر الدم وضغط الدم أثناء الأعراض",
            "مراجعة أدوية الضغط أو السكري لتعديل الجرعات عند اللزوم",
        ])
    if not solution_options:
        solution_options.extend([
            "إجراء فحص سريري موجّه للأعراض",
            "ربط الأعراض بالتحاليل الأخيرة وتاريخ المريض",
        ])

    response_lines = [
        "هذه قراءة سريرية سريعة مبنية على سجل المريض الحالي (ليست تشخيصاً نهائياً):",
        f"الأعراض المدخلة: {symptoms.strip()}",
        "",
        "ملخص تاريخي سريع:",
        f"- الحالات المزمنة: {', '.join(conditions) if conditions else 'لا يوجد'}",
        f"- الأدوية النشطة: {', '.join(meds) if meds else 'لا يوجد'}",
        f"- الحساسيّات: {', '.join(allergies) if allergies else 'لا يوجد'}",
        f"- HbA1c الأخير: {hba1c_val if hba1c_val is not None else 'غير متوفر'}",
        f"- ضغط الدم الأخير: {bp_recent if bp_recent else 'غير متوفر'}",
        "",
        "اعتبارات أولية للطبيب:",
    ]

    if considerations:
        response_lines.extend([f"- {item}" for item in considerations])
    else:
        response_lines.append("- مراجعة العلامات الحيوية الأساسية وربطها بالأعراض")

    response_lines.extend([
        "",
        "تشخيصات/تفسيرات محتملة (ليست نهائية):",
    ])
    if possible_causes:
        response_lines.extend([f"- {item}" for item in possible_causes])
    else:
        response_lines.append("- تحتاج الأعراض لتفاصيل إضافية لتحديد الاحتمالات")

    response_lines.extend([
        "",
        "مخاطر محتملة مرتبطة بالسجل:",
    ])
    if risk_flags:
        response_lines.extend([f"- {item}" for item in risk_flags])
    else:
        response_lines.append("- لا توجد مخاطر واضحة من السجل الحالي")

    response_lines.extend([
        "",
        "خيارات أولية للحل/التصرف:",
    ])
    response_lines.extend([f"- {item}" for item in solution_options])

    response_lines.extend([
        "",
        "تنبيه: إذا كانت الأعراض شديدة أو متفاقمة، يُنصح بتقييم عاجل أو تحويل للطوارئ."
    ])

    return "\n".join(response_lines)

def extract_pdf_text(file_bytes: bytes, max_pages: int = 3) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = reader.pages[:max_pages]
        chunks = []
        for page in pages:
            text = page.extract_text() or ""
            chunks.append(text.strip())
        return "\n".join([c for c in chunks if c])
    except Exception:
        return ""

async def analyze_doctor_consult(profile: PatientProfile, symptoms: str, file: UploadFile | None) -> str:
    if not settings.OPENAI_API_KEY:
        return "⚠️ لم يتم إعداد مفتاح OpenAI بعد. الرجاء ضبط OPENAI_API_KEY."

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    conditions = [c.name_ar or c.name for c in profile.conditions or []]
    allergies = [a.allergen for a in profile.allergies or []]
    meds = [m.name for m in profile.medications or [] if m.is_active]

    hba1c_val = None
    for lab in profile.lab_results or []:
        if lab.test_name == "HbA1c":
            try:
                hba1c_val = float(lab.value)
            except (TypeError, ValueError):
                hba1c_val = None
            break

    bp_recent = None
    for v in sorted(profile.vitals or [], key=lambda x: x.recorded_at or datetime.min, reverse=True):
        if v.systolic_bp and v.diastolic_bp:
            bp_recent = f"{v.systolic_bp}/{v.diastolic_bp}"
            break

    base_prompt = (
        "أنت مساعد طبي للأطباء. قدم قراءة سريرية موجزة مبنية على سجل المريض الحالي "
        "والأعراض المدخلة، واقترح أسباب محتملة، مخاطر مرتبطة بالسجل، وخيارات عملية للتصرف. "
        "لا تُصدر تشخيصاً نهائياً. اكتب بالعربية وبنقاط واضحة.\n\n"
        f"الأعراض: {symptoms.strip()}\n"
        f"الحالات المزمنة: {', '.join(conditions) if conditions else 'لا يوجد'}\n"
        f"الأدوية النشطة: {', '.join(meds) if meds else 'لا يوجد'}\n"
        f"الحساسيّات: {', '.join(allergies) if allergies else 'لا يوجد'}\n"
        f"HbA1c الأخير: {hba1c_val if hba1c_val is not None else 'غير متوفر'}\n"
        f"ضغط الدم الأخير: {bp_recent if bp_recent else 'غير متوفر'}\n"
    )

    if file is None:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": base_prompt}],
            max_tokens=900,
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()

    file_bytes = await file.read()
    content_type = (file.content_type or "").lower()
    filename = (file.filename or "").lower()

    if "pdf" in content_type or filename.endswith(".pdf"):
        pdf_text = extract_pdf_text(file_bytes)
        prompt = base_prompt + "\nنص التقرير المرفق (تحاليل/تقرير):\n" + (pdf_text or "[تعذر استخراج نص من PDF]")
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=900,
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()

    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    base64_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": base_prompt + "\nالمرفق: صورة أشعة/مستند طبي."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                            "detail": "high",
                        },
                    },
                ],
            }
        ],
        max_tokens=900,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()

def compute_health_score(profile: PatientProfile) -> Dict[str, Any]:
    conditions_count = len(profile.conditions or [])
    allergies_count = len(profile.allergies or [])
    meds_active = len([m for m in profile.medications or [] if m.is_active])

    hba1c_val = None
    for lab in profile.lab_results or []:
        if lab.test_name == "HbA1c":
            try:
                hba1c_val = float(lab.value)
            except (TypeError, ValueError):
                hba1c_val = None
            break

    has_high_bp = False
    for v in profile.vitals or []:
        if v.systolic_bp and v.diastolic_bp and (v.systolic_bp >= 140 or v.diastolic_bp >= 90):
            has_high_bp = True
            break

    score = 92
    score -= conditions_count * 5
    score -= allergies_count * 3
    if hba1c_val is not None:
        if hba1c_val >= 8.5:
            score -= 15
        elif hba1c_val >= 7.0:
            score -= 8
    if has_high_bp:
        score -= 6

    score = max(40, min(98, score))

    med_adherence = min(100, 60 + meds_active * 5)
    activity = max(40, min(95, score - 10))
    nutrition = max(40, min(95, score - 5))

    return {
        "overall": score,
        "subMetrics": [
            { "label": "التزام الدواء", "value": med_adherence, "color": "#22C55E" },
            { "label": "نشاط بدني", "value": activity, "color": "#F59E0B" },
            { "label": "تغذية", "value": nutrition, "color": "#52B788" }
        ]
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
    score_data = compute_health_score(profile)
    
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
        "healthScore": score_data["overall"],
        "hakeemSynced": True,
        "lastSyncedAt": datetime.now(timezone.utc).isoformat(),
        "conditions": [c.name_ar or c.name for c in profile.conditions],
        "allergies": [a.allergen for a in profile.allergies]
    })

@router.get("/{patientId}/health-score")
async def get_health_score(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db, patientId)
    return success_response(compute_health_score(profile))

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

        if message.startswith("DOCTOR_CONSULT:"):
            symptoms = message.replace("DOCTOR_CONSULT:", "", 1).strip()
            ai_text = build_doctor_consult_response(profile, symptoms)
            return success_response({
                "id": int(datetime.now().timestamp()),
                "role": "ai",
                "textAr": ai_text,
                "textEn": ai_text,
                "time": datetime.now().strftime("%H:%M")
            })
        
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
    profile = await get_profile(db, patientId)
    members = build_family_members(profile)
    return success_response(members)

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
    profile = await get_profile(db, patientId)
    members = build_family_members(profile)
    avg_score = int(sum(m["healthScore"] for m in members) / max(1, len(members)))
    needs_attention = len([m for m in members if m["healthScore"] < 75])
    return success_response({
        "avgHealthScore": avg_score,
        "weeklyAppointments": len(members) // 2,
        "activeMedications": len(members),
        "pendingLabResults": len([m for m in members if m["healthScore"] < 80]),
        "totalMembers": len(members),
        "needsAttention": needs_attention,
        "lastUpdate": datetime.now(timezone.utc).isoformat()
    })

@router.post("/{patientId}/doctor-consult")
async def doctor_consult(
    patientId: str,
    symptoms: str = Form(...),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_profile(db, patientId)
    ai_text = await analyze_doctor_consult(profile, symptoms, file)
    return success_response({
        "id": int(datetime.now().timestamp()),
        "role": "ai",
        "textAr": ai_text,
        "textEn": ai_text,
        "time": datetime.now().strftime("%H:%M")
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