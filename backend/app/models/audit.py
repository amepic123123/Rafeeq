import uuid
from sqlalchemy import Column, String, DateTime, func, JSON, ForeignKey
from app.models.base import Base

def generate_uuid():
    return str(uuid.uuid4())

class AuditLog(BaseModel := Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False) # e.g., "prescription.analyze", "patient.view"
    resource = Column(String, nullable=False) # e.g., "prescription", "patient_profile"
    resource_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

class AIAuditLog(BaseModel := Base):
    __tablename__ = "ai_audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    request_type = Column(String, nullable=False) # e.g., "rag_chat", "ocr", "safety_engine"
    model_used = Column(String, nullable=False)
    input_prompt = Column(String, nullable=True) # Usually hashed or omitted for privacy, but kept for MVP
    output_result = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
