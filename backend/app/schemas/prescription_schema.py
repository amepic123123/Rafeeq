from pydantic import BaseModel
from typing import List, Optional

class ExtractedDrug(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None

class PrescriptionAnalysisResponse(BaseModel):
    status: str
    extracted_drugs: List[ExtractedDrug]
    warnings: List[dict]
    risk_score: float
    overall_risk: str
    summary_ar: str


class MedicalImageFinding(BaseModel):
    ar: str
    severity: str


class MedicalImageRecommendation(BaseModel):
    ar: str
    type: str


class DoctorConsultImageResponse(BaseModel):
    image_type: str
    findings: List[MedicalImageFinding]
    recommendations: List[MedicalImageRecommendation]
    raw_summary: str
    safety_warnings: List[dict]
    safety_risk_score: Optional[float] = None
    safety_overall_risk: Optional[str] = None
