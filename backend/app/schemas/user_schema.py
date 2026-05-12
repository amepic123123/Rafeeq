from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import RoleEnum

class UserCreate(BaseModel):
    national_id: str
    password: str
    full_name_ar: str
    email: Optional[EmailStr] = None
    role: RoleEnum = RoleEnum.PATIENT

class UserLogin(BaseModel):
    national_id: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    national_id: str
    full_name_ar: str
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
