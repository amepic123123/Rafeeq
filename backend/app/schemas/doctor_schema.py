from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.patient_data_schema import PatientProfileResponse, PatientHistoryResponse

class PatientSearchResult(BaseModel):
    user_id: str
    patient_profile_id: str
    national_id: str
    full_name_ar: str
    date_of_birth: Optional[datetime]

class PatientSearchResponse(BaseModel):
    results: List[PatientSearchResult]

class DoctorPatientProfileResponse(BaseModel):
    profile: PatientProfileResponse
    history: PatientHistoryResponse
