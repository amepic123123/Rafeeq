from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ConditionBase(BaseModel):
    name: str
    name_ar: Optional[str] = None
    is_chronic: bool
    status: str

class ConditionResponse(ConditionBase):
    id: str
    diagnosed_at: Optional[datetime]
    class Config:
        from_attributes = True

class MedicationBase(BaseModel):
    name: str
    dosage: Optional[str]
    frequency: Optional[str]
    is_active: bool

class MedicationResponse(MedicationBase):
    id: str
    class Config:
        from_attributes = True

class AllergyBase(BaseModel):
    allergen: str
    severity: Optional[str]

class AllergyResponse(AllergyBase):
    id: str
    class Config:
        from_attributes = True

class LabResultBase(BaseModel):
    test_name: str
    value: str
    unit: Optional[str]

class LabResultResponse(LabResultBase):
    id: str
    tested_at: datetime
    class Config:
        from_attributes = True

class PatientProfileResponse(BaseModel):
    id: str
    blood_type: Optional[str]
    date_of_birth: Optional[datetime]
    class Config:
        from_attributes = True

class PatientHistoryResponse(BaseModel):
    conditions: List[ConditionResponse]
    medications: List[MedicationResponse]
    allergies: List[AllergyResponse]
    lab_results: List[LabResultResponse]

class AISummaryResponse(BaseModel):
    summary_ar: str
    summary_en: str

class AIRecommendation(BaseModel):
    category: str
    title_ar: str
    content_ar: str
    priority: str

class AIRecommendationsResponse(BaseModel):
    recommendations: List[AIRecommendation]
