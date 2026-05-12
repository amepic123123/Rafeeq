from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User, RoleEnum
from app.models.audit import AuditLog
from app.schemas.admin_schema import PaginatedUsers, PaginatedAuditLogs
from app.schemas.user_schema import UserResponse

router = APIRouter()

async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@router.get("/users", response_model=PaginatedUsers)
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    total_query = select(func.count()).select_from(User)
    total_result = await db.execute(total_query)
    total = total_result.scalar_one()
    
    query = select(User).offset(skip).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return PaginatedUsers(total=total, items=[UserResponse.model_validate(u) for u in users])

@router.get("/logs/audit", response_model=PaginatedAuditLogs)
async def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    total_query = select(func.count()).select_from(AuditLog)
    total_result = await db.execute(total_query)
    total = total_result.scalar_one()
    
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return PaginatedAuditLogs(total=total, items=logs)
