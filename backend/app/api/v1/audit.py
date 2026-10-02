from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.audit import AuditLogCreate, AuditLogResponse
from app.services.audit_service import audit_service

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.post("/log", response_model=AuditLogResponse)
def create_audit_log(
    log_in: AuditLogCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """บันทึกประวัติการเปิดดู / สั่งพิมพ์ / ดาวน์โหลด เอกสาร"""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    return audit_service.record_log(
        db=db,
        log_in=log_in,
        user_ip=client_ip,
        user_agent=user_agent
    )

@router.get("/patient/{hn}", response_model=List[AuditLogResponse])
def get_patient_audit_logs(
    hn: str,
    db: Session = Depends(get_db)
):
    """ดูประวัติการเข้าถึงเอกสารของผู้ป่วย HN นี้"""
    return audit_service.get_logs_by_hn(db=db, hn=hn)
