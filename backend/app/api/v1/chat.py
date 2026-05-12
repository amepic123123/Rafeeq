from fastapi import APIRouter, Depends, HTTPException
from qdrant_client import AsyncQdrantClient

from app.api.dependencies import get_current_patient
from app.db.vector_store import get_qdrant
from app.services.rag_service import RAGService
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def patient_chat(
    request: ChatRequest,
    current_patient: User = Depends(get_current_patient),
    qdrant: AsyncQdrantClient = Depends(get_qdrant)
):
    try:
        rag_service = RAGService(qdrant_client=qdrant)
        response_text = await rag_service.generate_response(
            patient_id=current_patient.id,
            query=request.message,
            session_id=request.session_id
        )
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
