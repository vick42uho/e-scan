from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hn = Column(String(30), index=True, nullable=False)
    document_id = Column(String(36), index=True, nullable=True)
    page_number = Column(Integer, nullable=True)
    action = Column(String(30), nullable=False) # VIEW, PRINT, DOWNLOAD, SEARCH
    user_id = Column(String(50), nullable=False, index=True)
    user_name = Column(String(100), nullable=True)
    user_ip = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
