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
