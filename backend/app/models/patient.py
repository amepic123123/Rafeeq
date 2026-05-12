import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, func
from sqlalchemy.orm import relationship

from app.models.base import Base

def generate_uuid():
    return str(uuid.uuid4())

class PatientProfile(Base):
    __tablename__ = "patient_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    blood_type = Column(String, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="patient_profile")
    conditions = relationship("Condition", back_populates="patient")
    medications = relationship("Medication", back_populates="patient")
    allergies = relationship("Allergy", back_populates="patient")
    lab_results = relationship("LabResult", back_populates="patient")

class Condition(Base):
    __tablename__ = "conditions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patient_profiles.id"))
    name = Column(String, nullable=False)
    name_ar = Column(String, nullable=True)
    icd_code = Column(String, nullable=True)
    is_chronic = Column(Boolean, default=False)
    status = Column(String, default="active") # active, resolved
    diagnosed_at = Column(DateTime, nullable=True)
    
    patient = relationship("PatientProfile", back_populates="conditions")

class Medication(Base):
    __tablename__ = "medications"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patient_profiles.id"))
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    patient = relationship("PatientProfile", back_populates="medications")

class Allergy(Base):
    __tablename__ = "allergies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patient_profiles.id"))
    allergen = Column(String, nullable=False)
    severity = Column(String, nullable=True)
    
    patient = relationship("PatientProfile", back_populates="allergies")

class LabResult(Base):
    __tablename__ = "lab_results"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patient_profiles.id"))
    test_name = Column(String, nullable=False)
    value = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    tested_at = Column(DateTime, default=func.now())
    
    patient = relationship("PatientProfile", back_populates="lab_results")
