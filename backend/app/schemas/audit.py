from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AuditLogCreate(BaseModel):
    hn: str
    document_id: Optional[str] = None
    page_number: Optional[int] = None
    action: str  # VIEW, PRINT, DOWNLOAD, SEARCH
    user_id: str
    user_name: Optional[str] = None
    details: Optional[str] = None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hn: str
    document_id: Optional[str] = None
    page_number: Optional[int] = None
    action: str
    user_id: str
    user_name: Optional[str] = None
    user_ip: Optional[str] = None
    timestamp: datetime
