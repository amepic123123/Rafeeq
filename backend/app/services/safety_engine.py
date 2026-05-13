from app.schemas.prescription_schema import ExtractedDrug
from app.models.patient import PatientProfile

# ── Drug family cross-reactivity map ─────────────────────────────────────────
# Maps a known allergen (lowercase) to a list of drugs in the same family.
ALLERGY_DRUG_FAMILIES: dict[str, list[str]] = {
    "penicillin": [
        "amoxicillin", "ampicillin", "amoxil", "augmentin", "piperacillin",
        "oxacillin", "cloxacillin", "dicloxacillin", "nafcillin", "mezlocillin",
        "carbenicillin", "ticarcillin", "flucloxacillin", "phenoxymethylpenicillin",
    ],
    "cephalosporin": [
        "cephalexin", "cefazolin", "cefuroxime", "ceftriaxone", "cefdinir",
        "cefixime", "cefpodoxime", "cefepime", "ceftazidime", "cefotaxime",
    ],
    "sulfa": [
        "sulfamethoxazole", "trimethoprim", "bactrim", "co-trimoxazole",
        "sulfadiazine", "sulfasalazine", "sulfadoxine",
    ],
    "nsaids": [
        "ibuprofen", "naproxen", "aspirin", "diclofenac", "celecoxib",
        "indomethacin", "ketorolac", "meloxicam", "piroxicam", "mefenamic acid",
    ],
    "fluoroquinolone": [
        "ciprofloxacin", "levofloxacin", "moxifloxacin", "ofloxacin", "norfloxacin",
    ],
    "macrolide": [
        "azithromycin", "clarithromycin", "erythromycin", "roxithromycin",
    ],
    "tetracycline": [
        "doxycycline", "minocycline", "tetracycline", "oxytetracycline",
    ],
    "statin": [
        "atorvastatin", "simvastatin", "rosuvastatin", "pravastatin",
        "fluvastatin", "lovastatin",
    ],
    "ace inhibitor": [
        "lisinopril", "enalapril", "ramipril", "captopril", "perindopril",
        "quinapril", "benazepril", "fosinopril",
    ],
    "beta blocker": [
        "metoprolol", "atenolol", "propranolol", "bisoprolol", "carvedilol",
        "labetalol", "nebivolol",
    ],
}

# ── Nephrotoxic drugs — dangerous when eGFR < 60 ─────────────────────────────
NEPHROTOXIC_DRUGS: list[str] = [
    "gentamicin", "tobramycin", "amikacin", "streptomycin", "netilmicin",
    "vancomycin", "colistin", "polymyxin", "cisplatin", "carboplatin",
    "methotrexate", "cyclosporine", "tacrolimus", "ibuprofen", "naproxen",
    "diclofenac", "indomethacin", "ketorolac", "contrast",
    "acyclovir", "tenofovir", "amphotericin",
]

# ── Hepatotoxic drugs ─────────────────────────────────────────────────────────
HEPATOTOXIC_DRUGS: list[str] = [
    "isoniazid", "rifampin", "pyrazinamide", "methotrexate", "amiodarone",
    "valproate", "carbamazepine", "phenytoin", "halothane", "statins",
]

# ── Common Arabic drug name aliases (lowercase) ───────────────────────────────
ARABIC_DRUG_ALIASES: dict[str, str] = {
    "أموكسيسيلين": "amoxicillin",
    "أموكسيل": "amoxicillin",
    "ميتفورمين": "metformin",
    "جنتاميسين": "gentamicin",
    "ليسينوبريل": "lisinopril",
    "أسبرين": "aspirin",
    "إيبوبروفين": "ibuprofen",
    "سيبروفلوكساسين": "ciprofloxacin",
    "أزيثروميسين": "azithromycin",
    "أتورفاستاتين": "atorvastatin",
    "فانكوميسين": "vancomycin",
}


def _normalize_drug_name(name: str) -> str:
    """Lowercase + strip; translate common Arabic names to English."""
    name_lower = name.strip().lower()
    return ARABIC_DRUG_ALIASES.get(name_lower, name_lower)


def _drug_conflicts_with_allergen(drug: str, allergen: str) -> str | None:
    """
    Returns a description of the conflict if the drug conflicts with the allergen,
    or None if there's no known conflict.
    """
    drug_norm = _normalize_drug_name(drug)
    allergen_norm = allergen.strip().lower()

    # Direct name match
    if allergen_norm in drug_norm or drug_norm in allergen_norm:
        return f"تطابق مباشر مع الحساسية المسجّلة ({allergen})"

    # Cross-reactivity via drug families
    for family_key, family_drugs in ALLERGY_DRUG_FAMILIES.items():
        if allergen_norm in (family_key, *family_drugs) and drug_norm in family_drugs:
            return (
                f"تفاعل مشترك: {drug} ينتمي لعائلة {family_key} "
                f"التي يُعاني المريض منها حساسية ({allergen})"
            )

    return None


class SafetyEngine:
    async def analyze(
        self,
        extracted_drugs: list[ExtractedDrug],
        patient_profile: PatientProfile | None,
    ) -> dict:
        warnings = []
        drug_warning_map: dict[str, list[str]] = {}  # drug_name → list of warning types

        drug_names_raw = [d.name for d in extracted_drugs]
        drug_names_norm = [_normalize_drug_name(d.name) for d in extracted_drugs]

        # ── 1. Allergy Check (real patient data) ─────────────────────────────
        if patient_profile and patient_profile.allergies:
            for allergy in patient_profile.allergies:
                for drug in extracted_drugs:
                    conflict_desc = _drug_conflicts_with_allergen(drug.name, allergy.allergen)
                    if conflict_desc:
                        severity = (
                            "CRITICAL" if allergy.severity in ("life-threatening", "severe", "high")
                            else "HIGH"
                        )
                        warnings.append({
                            "type": "allergy_conflict",
                            "severity": severity,
                            "title_ar": f"⚠️ تحذير حساسية: {drug.name}",
                            "description_ar": (
                                f"المريض يُعاني من حساسية مسجّلة تجاه «{allergy.allergen}». "
                                f"{conflict_desc}. "
                                f"شدة الحساسية: {allergy.severity or 'غير محددة'}."
                            ),
                            "evidence_source": "سجل حساسية المريض",
                            "drug": drug.name,
                        })
                        drug_warning_map.setdefault(drug.name, []).append("allergy")

        # ── 2. Duplicate Therapy Check (real patient meds) ───────────────────
        if patient_profile and patient_profile.medications:
            active_meds_norm = {
                _normalize_drug_name(m.name): m
                for m in patient_profile.medications
                if m.is_active
            }
            for drug in extracted_drugs:
                drug_norm = _normalize_drug_name(drug.name)
                if drug_norm in active_meds_norm:
                    existing = active_meds_norm[drug_norm]
                    warnings.append({
                        "type": "duplicate_therapy",
                        "severity": "HIGH",
                        "title_ar": f"🔁 تكرار علاجي: {drug.name}",
                        "description_ar": (
                            f"المريض يتناول «{existing.name}» بجرعة {existing.dosage or 'غير محددة'} "
                            f"({existing.frequency or 'غير محددة'}). "
                            f"الوصفة الجديدة تحتوي على {drug.name} {drug.dosage or ''} مما قد يُسبب "
                            f"جرعة زائدة."
                        ),
                        "evidence_source": "قائمة أدوية المريض الحالية",
                        "drug": drug.name,
                    })
                    drug_warning_map.setdefault(drug.name, []).append("duplicate")

        # ── 3. Renal Dosing Check (eGFR from lab results) ────────────────────
        egfr_value = None
        if patient_profile and patient_profile.lab_results:
            for lab in patient_profile.lab_results:
                if lab.test_name.lower() in ("egfr", "egfr (ckd-epi)", "gfr"):
                    try:
                        egfr_value = float(lab.value)
                    except (ValueError, TypeError):
                        pass

        if egfr_value is not None and egfr_value < 60:
            ckd_stage = (
                "المرحلة الخامسة (فشل كلوي)" if egfr_value < 15
                else "المرحلة الرابعة" if egfr_value < 30
                else "المرحلة الثالثة"
            )
            for drug in extracted_drugs:
                drug_norm = _normalize_drug_name(drug.name)
                if any(nephro in drug_norm for nephro in NEPHROTOXIC_DRUGS):
                    warnings.append({
                        "type": "renal_risk",
                        "severity": "CRITICAL" if egfr_value < 30 else "HIGH",
                        "title_ar": f"🫘 خطر كلوي: {drug.name}",
                        "description_ar": (
                            f"هذا الدواء سامّ للكلى. معدل الترشيح الكبيبي للمريض "
                            f"(eGFR: {egfr_value:.0f} mL/min) يُشير إلى اعتلال كلوي {ckd_stage}. "
                            f"يُوصى بتعديل الجرعة بشدة أو اختيار بديل أقل سُمّية."
                        ),
                        "evidence_source": "نتائج المختبر (eGFR)",
                        "drug": drug.name,
                    })
                    drug_warning_map.setdefault(drug.name, []).append("renal")

        # ── 4. Diabetes + Metformin + eGFR < 30 ──────────────────────────────
        if egfr_value is not None and egfr_value < 30:
            for drug in extracted_drugs:
                if "metformin" in _normalize_drug_name(drug.name):
                    if not any(
                        w["drug"] == drug.name and w["type"] == "renal_risk"
                        for w in warnings
                    ):
                        warnings.append({
                            "type": "renal_risk",
                            "severity": "CRITICAL",
                            "title_ar": f"🫘 ميتفورمين + اعتلال كلوي حاد",
                            "description_ar": (
                                f"ميتفورمين مُضاد استطباب عند eGFR < 30. "
                                f"eGFR الحالي: {egfr_value:.0f}. خطر تحمّض اللاكتات."
                            ),
                            "evidence_source": "إرشادات FDA",
                            "drug": drug.name,
                        })
                        drug_warning_map.setdefault(drug.name, []).append("renal")

        # ── Compute summary scores ────────────────────────────────────────────
        critical_count = sum(1 for w in warnings if w.get("severity") == "CRITICAL")
        high_count = sum(1 for w in warnings if w.get("severity") == "HIGH")

        risk_score = min(100.0, critical_count * 40.0 + high_count * 20.0)
        overall_risk = (
            "CRITICAL" if critical_count > 0
            else "HIGH" if high_count > 0
            else "LOW"
        )

        summary_ar = (
            "⚠️ الوصفة الطبية تحتوي على تعارضات خطيرة مع الملف الطبي للمريض. "
            "يُرجى مراجعة التحذيرات قبل صرف الدواء."
            if warnings
            else "✅ الوصفة الطبية آمنة مبدئياً — لا توجد تعارضات واضحة مع السجل الطبي."
        )

        return {
            "warnings": warnings,
            "drug_warning_map": drug_warning_map,
            "risk_score": risk_score,
            "overall_risk": overall_risk,
            "summary_ar": summary_ar,
            "allergy_count": sum(1 for w in warnings if w["type"] == "allergy_conflict"),
        }
