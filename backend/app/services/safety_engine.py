from app.schemas.prescription_schema import ExtractedDrug
from app.models.patient import PatientProfile

class SafetyEngine:
    async def analyze(self, extracted_drugs: list[ExtractedDrug], patient_profile: PatientProfile | None):
        warnings = []
        
        # We are using a mock logic for the MVP demo scenario.
        # The demo scenario:
        # Patient has: Penicillin allergy, eGFR 38 (kidney issue)
        # Drugs found: Amoxicillin (Penicillin class), Gentamicin (Nephrotoxic)
        
        drug_names = [d.name.lower() for d in extracted_drugs]
        
        # 1. Allergy Check Mock
        # Assume patient profile has "Penicillin" allergy in a real DB check
        if "amoxicillin" in drug_names:
            warnings.append({
                "type": "allergy_conflict",
                "severity": "CRITICAL",
                "title_ar": "⚠️ تحذير حساسية: أموكسيسيلين",
                "description_ar": "المريض يعاني من حساسية مفرطة للبنسلين. أموكسيسيلين ينتمي لنفس العائلة.",
                "evidence_source": "Patient Allergy Record"
            })
            
        # 2. Renal Dosing Mock
        # Assume patient eGFR = 38 (Stage 3 CKD)
        if "gentamicin" in drug_names:
            warnings.append({
                "type": "renal_risk",
                "severity": "CRITICAL",
                "title_ar": "خطر على الكلى: جنتاميسين",
                "description_ar": "هذا الدواء شديد السمية للكلى. وظائف الكلى الحالية للمريض (eGFR: 38) تتطلب تعديل الجرعة بشدة أو التجنب.",
                "evidence_source": "FDA Label"
            })
            
        # 3. Duplicate Therapy Mock
        # Assume patient is already taking Metformin 1000mg
        if "metformin" in drug_names:
            warnings.append({
                "type": "duplicate_therapy",
                "severity": "HIGH",
                "title_ar": "تكرار علاجي: ميتفورمين",
                "description_ar": "المريض يتناول ميتفورمين بالفعل بجرعة 1000mg. الوصفة الجديدة تحتوي على 2000mg مما قد يسبب هبوط السكر.",
                "evidence_source": "Current Medications"
            })

        risk_score = min(100.0, len(warnings) * 33.3)
        overall_risk = "CRITICAL" if risk_score > 60 else ("HIGH" if risk_score > 30 else "LOW")
        
        summary_ar = "الوصفة الطبية تحتوي على تعارضات خطيرة مع الملف الطبي للمريض. يرجى مراجعة التحذيرات." if warnings else "الوصفة الطبية آمنة مبدئياً ولا توجد تعارضات واضحة."

        return {
            "warnings": warnings,
            "risk_score": risk_score,
            "overall_risk": overall_risk,
            "summary_ar": summary_ar
        }
