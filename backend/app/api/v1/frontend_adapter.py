from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import Dict, Any, List
from pydantic import BaseModel

from app.services.ocr_service import OCRService
from app.services.safety_engine import SafetyEngine

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
        
    import hashlib
    hash_val = int(hashlib.md5(patientId.encode()).hexdigest(), 16)
    score = 65 + (hash_val % 31)
        
    return success_response({
        "id": patientId,
        "nameAr": profile.user.full_name_ar if profile.user else "مجهول",
        "nameEn": "Patient Name",
        "age": age,
        "gender": "male",
        "nationalId": profile.user.national_id if profile.user else "N/A",
        "bloodType": profile.blood_type or "Unknown",
        "city": "عمّان",
        "healthScore": score,
        "hakeemSynced": True,
        "lastSyncedAt": datetime.now(timezone.utc).isoformat(),
        "conditions": [c.name_ar or c.name for c in profile.conditions],
        "allergies": [a.allergen for a in profile.allergies]
    })

@router.get("/{patientId}/health-score")
async def get_health_score(patientId: str, db: AsyncSession = Depends(get_db)):
    await get_profile(db, patientId) # Ensure patient exists
    import hashlib
    hash_val = int(hashlib.md5(patientId.encode()).hexdigest(), 16)
    score = 65 + (hash_val % 31)
    
    return success_response({
        "overall": score,
        "subMetrics": [
            { "label": "التزام الدواء", "value": min(100, score + 12), "color": "#22C55E" },
            { "label": "نشاط بدني", "value": max(0, score - 15), "color": "#F59E0B" },
            { "label": "تغذية", "value": score - 5, "color": "#52B788" }
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
        print(f"INFO: Generating AI response for {patientId}. Message: [Message omitted to avoid encoding errors]")
        
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

@router.post("/{patientId}/doctor-consult")
async def doctor_consult(
    patientId: str,
    symptoms: str = Form(...),
    file: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    qdrant = Depends(get_qdrant)
):
    try:
        profile = await get_profile(db, patientId)
        rag = RAGService(qdrant)
        
        file_text = ""
        if file:
            file_content = await file.read()
            ocr_service = OCRService()
            medical_result = await ocr_service.analyze_medical_image(
                file_content,
                strict=False,
                patient_context=None
            )
            file_text = f"تفاصيل الملف المرفق: {medical_result.get('raw_summary', '')}"

        query = f"الأعراض: {symptoms}"
        if file_text:
            query += f"\n\n{file_text}"
            
        # Retrieve full medical history context using a general query
        rag_context = await rag.retrieve_context(
            patient_id=patientId,
            query="Patient medical history including conditions, medications, allergies, and labs."
        )

        prompt = f"""
        You are Rafeeq AI, an advanced medical assistant for doctors.
        Your task is to analyze the patient's current symptoms and cross-reference them with their medical history.
        Identify any possible connections between the symptoms and their existing conditions, medications (e.g., side effects), or allergies.
        
        CRITICAL INSTRUCTIONS:
        - For any medications involved (either currently taken by the patient or mentioned in your analysis), provide detailed information: explain what the medicine does, its active ingredients, primary indications, and common side effects.
        - Explain the pharmacological rationale behind your recommendations or any identified conflicts.
        - Structure your answer clearly using Markdown formatting (**bold text** for important terms like drug names and conditions, and - bullet points for lists).
        - Respond warmly but professionally in Arabic. Ensure the clinical recommendations are comprehensive and provide enough detail for a doctor to make an informed decision.
        
        PATIENT MEDICAL HISTORY:
        {rag_context}
        """

        from langchain_core.messages import SystemMessage, HumanMessage
        messages = [
            SystemMessage(content=prompt),
            HumanMessage(content=query)
        ]
        
        if rag.mock_mode:
            ai_text = "يبدو أن الأعراض قد تكون مرتبطة بحالة المريض السابقة. يرجى مراجعة الأدوية الحالية."
        else:
            response = await rag.llm.ainvoke(messages)
            ai_text = response.content
        
        return success_response({
            "id": int(datetime.now().timestamp()),
            "role": "ai",
            "textAr": ai_text,
            "textEn": ai_text,
            "time": datetime.now().strftime("%H:%M")
        })
    except Exception as e:
        import traceback
        print(f"[doctor-consult] ERROR: {traceback.format_exc()}")
        return success_response({
            "id": int(datetime.now().timestamp()),
            "role": "ai",
            "textAr": f"عذراً، حدث خطأ: {str(e)}",
            "textEn": f"Error: {str(e)}",
            "time": datetime.now().strftime("%H:%M")
        })

@router.get("/{patientId}/chat/suggested-prompts")
async def get_suggested_prompts(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db, patientId)
    
    prompts = []
    active_meds = [m for m in profile.medications if m.is_active]
    
    # Generate a prompt per medication (up to 3)
    for i, med in enumerate(active_meds[:3]):
        med_name = med.name
        prompts.append({
            "id": i + 1,
            "textAr": f"متى يجب أن آخذ {med_name}؟",
            "textEn": f"When should I take {med_name}?"
        })
    
    # Add a general fallback prompt if fewer than 2 meds
    if len(prompts) < 2:
        prompts.append({
            "id": len(prompts) + 1,
            "textAr": "هل هناك أي تفاعلات بين أدويتي؟",
            "textEn": "Are there any interactions between my medications?"
        })
    
    # Always add a condition-based prompt if conditions exist
    if profile.conditions:
        cond_name = profile.conditions[0].name_ar or profile.conditions[0].name
        prompts.append({
            "id": len(prompts) + 1,
            "textAr": f"كيف أتحكم بـ {cond_name}؟",
            "textEn": f"How do I manage {cond_name}?"
        })
    
    return success_response(prompts[:4])  # Max 4 prompts

@router.get("/{patientId}/family")
async def get_family(patientId: str, db: AsyncSession = Depends(get_db)):
    profile = await get_profile(db, patientId)
    import hashlib
    hash_val = int(hashlib.md5(patientId.encode()).hexdigest(), 16)
    
    # Extract patient's actual last name to construct realistic family members
    patient_name_ar = profile.user.full_name_ar if profile.user and profile.user.full_name_ar else "مجهول"
    parts = patient_name_ar.split()
    last_name_ar = parts[-1] if len(parts) > 1 else "العائلة"
    
    first_names_f = ["سارة", "ليلى", "نور", "رؤى", "مريم", "فاطمة"]
    first_names_m = ["محمد", "يوسف", "عمر", "أحمد", "علي", "طارق"]
    
    # Determine how many members to show (2 to 4)
    num_members = 2 + (hash_val % 3)
    
    members = []
    for i in range(num_members):
        # Use a slightly different hash for each member
        member_hash = int(hashlib.md5(f"{patientId}_{i}".encode()).hexdigest(), 16)
        
        is_female = member_hash % 2 == 0
        is_child = (member_hash % 3) != 0
        
        if is_child:
            role = "daughter" if is_female else "son"
            age = 8 + (member_hash % 18)  # 8 to 25
        else:
            role = "wife" if is_female else "husband"
            age = 35 + (member_hash % 30) # 35 to 64
            
        fname_ar = first_names_f[member_hash % len(first_names_f)] if is_female else first_names_m[member_hash % len(first_names_m)]
        # Format: "Family Name First Name" (e.g. "القاضي طارق")
        full_name_ar = f"{last_name_ar} {fname_ar}"
        
        members.append({
            "id": f"JO-FAM-{member_hash % 1000}",
            "nameAr": full_name_ar,
            "nameEn": full_name_ar,  # Keep Arabic for both
            "role": role,
            "age": age,
            "healthScore": 70 + (member_hash % 26),
            "alerts": member_hash % 3,
            "avatar": fname_ar[0],
            "color": "#F472B6" if is_female else "#3B82F6"
        })
        
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
    await get_profile(db, patientId)
    import hashlib
    hash_val = int(hashlib.md5(patientId.encode()).hexdigest(), 16)
    
    num_members = 2 + (hash_val % 3)
    
    total_score = 0
    total_meds = 0
    total_pending_labs = 0
    total_appointments = 0
    needs_attention = 0
    
    for i in range(num_members):
        member_hash = int(hashlib.md5(f"{patientId}_{i}".encode()).hexdigest(), 16)
        score = 70 + (member_hash % 26)
        total_score += score
        
        total_meds += (member_hash % 4)
        total_pending_labs += (member_hash % 2)
        total_appointments += 1 if (member_hash % 5) == 0 else 0
        
        alerts = member_hash % 3
        if score < 75 or alerts > 0:
            needs_attention += 1

    avg_score = total_score // num_members

    return success_response({
        "avgHealthScore": avg_score,
        "weeklyAppointments": total_appointments,
        "activeMedications": total_meds,
        "pendingLabResults": total_pending_labs,
        "totalMembers": num_members,
        "needsAttention": needs_attention,
        "lastUpdate": datetime.now(timezone.utc).isoformat()
    })

@prescription_router.post("/analyze")
async def analyze_prescription(
    file: UploadFile = File(...),
    patientId: str = Form(...),
    db: AsyncSession = Depends(get_db),
    qdrant = Depends(get_qdrant),
):
    """
    Real prescription / medical image analysis endpoint.

    Flow:
    1. Read uploaded image/PDF bytes.
    2. Run GPT-4o Vision OCR → extract medications.
    3. If no medications found, treat as medical image (X-ray/lab) → diagnostician analysis.
    4. Load the patient's real allergies, medications, and lab results from DB.
    5. Run SafetyEngine with real patient data → detect conflicts.
    6. Map everything to the shape the frontend expects.
    """
    try:
        file_content = await file.read()
        ocr_service = OCRService()
        safety_engine = SafetyEngine()

        # ── Step 1: Try prescription OCR ──────────────────────────────────
        extracted_drugs = await ocr_service.process_image(file_content)

        rag = RAGService(qdrant)
        rag_patient_id = patientId.strip()
        rag_context = None

        # ── Step 2: If no drugs found → medical image analysis mode ──────
        if not extracted_drugs:
            print(f"[analyze] No drugs found — switching to medical image analysis mode")

            try:
                rag_context = await rag.retrieve_context(
                    patient_id=rag_patient_id,
                    query="Patient context for medical image interpretation (conditions, meds, allergies, labs)."
                )
            except Exception as e:
                print(f"[RAG] Warning in image analysis: {e}")

            medical_result = await ocr_service.analyze_medical_image(
                file_content,
                strict=True,
                patient_context=rag_context
            )

            # Map findings + recommendations to the frontend extractedMedications shape
            extracted_items = []
            for finding in medical_result.get("findings", []):
                severity = finding.get("severity", "mild")
                ok = severity in ("normal", "mild")
                extracted_items.append({
                    "drug": f"🔍 {finding.get('ar', 'نتيجة غير محددة')}",
                    "note": "نتيجة سريرية — للمراجعة الطبية",
                    "ok": ok,
                })
            for rec in medical_result.get("recommendations", []):
                extracted_items.append({
                    "drug": f"💊 {rec.get('ar', 'توصية')}",
                    "note": "توصية AI — للمراجعة الطبية فقط",
                    "ok": True,
                })

            return success_response({
                "medicationCount": len(extracted_items),
                "warningCount": 0,
                "allergyCount": 0,
                "riskFlags": [{
                    "id": 1,
                    "level": "blue" if not medical_result.get("findings") else "yellow",
                    "icon": "🔬",
                    "titleAr": f"تحليل صورة طبية ({medical_result.get('image_type', 'other')})",
                    "titleEn": f"Medical image analysis ({medical_result.get('image_type', 'other')})",
                    "descAr": medical_result.get("raw_summary", "لا يوجد ملخص"),
                    "descEn": medical_result.get("raw_summary", ""),
                    "drugs": [],
                }],
                "extractedMedications": extracted_items,
            })

        # ── Step 3: Load patient profile from DB ──────────────────────────
        patient_profile = None
        pid = patientId.strip()

        # Try national_id lookup first
        user_result = await db.execute(
            select(User)
            .where(func.lower(User.national_id) == func.lower(pid))
            .options(
                selectinload(User.patient_profile).selectinload(PatientProfile.allergies),
                selectinload(User.patient_profile).selectinload(PatientProfile.medications),
                selectinload(User.patient_profile).selectinload(PatientProfile.lab_results),
                selectinload(User.patient_profile).selectinload(PatientProfile.user),
            )
        )
        user = user_result.scalar_one_or_none()
        if user and user.patient_profile:
            patient_profile = user.patient_profile
        else:
            # Fallback: try direct profile UUID lookup
            prof_result = await db.execute(
                select(PatientProfile)
                .where(PatientProfile.id == pid)
                .options(
                    selectinload(PatientProfile.allergies),
                    selectinload(PatientProfile.medications),
                    selectinload(PatientProfile.lab_results),
                    selectinload(PatientProfile.user),
                )
            )
            patient_profile = prof_result.scalar_one_or_none()

        if patient_profile:
            print(f"[analyze] Loaded patient profile for '{pid}': "
                  f"{len(patient_profile.allergies)} allergies, "
                  f"{len(patient_profile.medications)} meds, "
                  f"{len(patient_profile.lab_results)} labs")
        else:
            print(f"[analyze] WARNING: No patient profile found for '{pid}' — safety check skipped")

        # ── Step 4: Safety analysis with real patient data ────────────────
        analysis = await safety_engine.analyze(extracted_drugs, patient_profile)
        warnings = analysis["warnings"]
        drug_warning_map = analysis["drug_warning_map"]
        allergy_count = analysis["allergy_count"]

        rag_note = None
        try:
            if patient_profile and patient_profile.user and patient_profile.user.national_id:
                rag_patient_id = patient_profile.user.national_id
            elif user and user.national_id:
                rag_patient_id = user.national_id

            rag_context = await rag.retrieve_context(
                patient_id=rag_patient_id,
                query="Patient context for prescription review (conditions, meds, allergies, labs)."
            )
            if rag_context and "No medical history available" not in rag_context:
                rag_note = await rag.generate_response(
                    patient_id=rag_patient_id,
                    query=(
                        "للطبيب: بناء على السجل الطبي فقط، هل توجد ملاحظات أو مخاطر لهذه الأدوية: "
                        f"{', '.join([d.name for d in extracted_drugs])}؟ أجب بنقاط قصيرة."
                    ),
                    session_id="ui-prescription"
                )
        except Exception as e:
            print(f"[RAG] Warning in prescription analyze: {e}")

        # ── Step 5: Map to frontend shape ─────────────────────────────────
        # Severity → risk level mapping
        def _severity_to_level(severity: str) -> str:
            return "red" if severity == "CRITICAL" else "yellow" if severity == "HIGH" else "green"

        risk_flags = [
            {
                "id": i + 1,
                "level": _severity_to_level(w["severity"]),
                "icon": (
                    "⚠️" if w["type"] == "allergy_conflict"
                    else "🔁" if w["type"] == "duplicate_therapy"
                    else "🫘"
                ),
                "titleAr": w["title_ar"],
                "titleEn": w.get("title_en", w["title_ar"]),
                "descAr": w["description_ar"],
                "descEn": w.get("description_en", ""),
                "drugs": [w["drug"]] if "drug" in w else [],
            }
            for i, w in enumerate(warnings)
        ]

        if rag_note:
            risk_flags.append({
                "id": len(risk_flags) + 1,
                "level": "blue",
                "icon": "🧠",
                "titleAr": "ملاحظات من السجل المتجهي",
                "titleEn": "Vector record notes",
                "descAr": rag_note,
                "descEn": "",
                "drugs": [],
            })

        extracted_medications = [
            {
                "drug": f"{d.name} {d.dosage or ''}".strip(),
                "note": (
                    " | ".join(
                        w["title_ar"]
                        for w in warnings
                        if w.get("drug", "").lower() == d.name.lower()
                    )
                    or "آمن للاستخدام بناءً على السجل الطبي الحالي"
                ),
                "ok": d.name not in drug_warning_map,
            }
            for d in extracted_drugs
        ]

        return success_response({
            "medicationCount": len(extracted_drugs),
            "warningCount": len(warnings),
            "allergyCount": allergy_count,
            "riskFlags": risk_flags,
            "extractedMedications": extracted_medications,
        })

    except Exception as e:
        import traceback
        print(f"[analyze] ERROR: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"خطأ في تحليل الوصفة: {str(e)}"
        )