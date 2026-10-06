from fastapi import APIRouter
from app.api.v1.patients import router as patients_router
from app.api.v1.documents import router as documents_router
from app.api.v1.files import router as files_router
from app.api.v1.audit import router as audit_router
from app.api.v1.scan import router as scan_router

api_router = APIRouter()

api_router.include_router(patients_router)
api_router.include_router(documents_router)
api_router.include_router(files_router)
api_router.include_router(audit_router)
api_router.include_router(scan_router)
