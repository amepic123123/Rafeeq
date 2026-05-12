from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.user_schema import UserResponse

class AuditLogResponse(BaseModel):
    id: str
    actor_id: Optional[str]
    action: str
    resource: str
    resource_id: Optional[str]
    details: Optional[dict]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaginatedAuditLogs(BaseModel):
    total: int
    items: List[AuditLogResponse]
    
class PaginatedUsers(BaseModel):
    total: int
    items: List[UserResponse]
