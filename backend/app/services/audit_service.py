from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogCreate, AuditLogResponse

class AuditService:
    @staticmethod
    def record_log(
        db: Session,
        log_in: AuditLogCreate,
        user_ip: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLogResponse:
        """บันทึกประวัติการเปิดอ่าน / พิมพ์ / ดาวน์โหลด เอกสารเวชระเบียน"""
        audit_entry = AuditLog(
            hn=log_in.hn,
            document_id=log_in.document_id,
            page_number=log_in.page_number,
            action=log_in.action.upper(),
            user_id=log_in.user_id,
            user_name=log_in.user_name,
            user_ip=user_ip,
            user_agent=user_agent,
            details=log_in.details
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        return AuditLogResponse.model_validate(audit_entry)

    @staticmethod
    def get_logs_by_hn(db: Session, hn: str, limit: int = 50) -> List[AuditLogResponse]:
        logs = (
            db.query(AuditLog)
            .filter(AuditLog.hn == hn)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .all()
        )
        return [AuditLogResponse.model_validate(log) for log in logs]

audit_service = AuditService()
