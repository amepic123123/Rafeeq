from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Rafeeq AI API",
    description="Backend API for Rafeeq AI inside Hakeem",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1 import auth, chat, doctors, patients, admin, frontend_adapter
from app.core.config import settings

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["Patient Chat"])
app.include_router(doctors.router, prefix=f"{settings.API_V1_STR}/doctors", tags=["Doctors"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin"])
# We use frontend_adapter for patients to match the exact Next.js API shape
app.include_router(frontend_adapter.router, prefix=f"{settings.API_V1_STR}/patients", tags=["Patients (UI Adapter)"])
app.include_router(frontend_adapter.prescription_router, prefix=f"{settings.API_V1_STR}/prescriptions", tags=["Prescriptions (UI Adapter)"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "rafeeq-ai-backend"}
