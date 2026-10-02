import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class DocumentCategory(Base):
    __tablename__ = "document_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name_th = Column(String(100), nullable=False)
    name_en = Column(String(100), nullable=False)
    category_type = Column(String(30), default="Care Team", index=True) # "Care Team" หรือ "Administration"
    icon = Column(String(50), nullable=True)
    sort_order = Column(Integer, default=0)

    # Relationships
    documents = relationship("Document", back_populates="category")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hn = Column(String(30), ForeignKey("patients.hn", ondelete="CASCADE"), nullable=False, index=True)
    en = Column(String(40), ForeignKey("encounters.en", ondelete="SET NULL"), nullable=True, index=True)
    category_id = Column(Integer, ForeignKey("document_categories.id"), nullable=False, index=True)
    
    title = Column(String(200), nullable=False)
    document_code = Column(String(50), nullable=True)
    doctor_code = Column(String(30), nullable=True, index=True)
    doctor_name = Column(String(100), nullable=True)
    is_doctor_document = Column(Boolean, default=False, index=True)
    scan_by_id = Column(String(30), nullable=True)
    scan_by_name = Column(String(100), nullable=True)
    scan_by_role = Column(String(30), default="Staff") # "Doctor", "Nurse", "Staff", "Admin"
    scan_date = Column(DateTime, nullable=True)
    total_pages = Column(Integer, default=1)
    is_confidential = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="documents")
    encounter = relationship("Encounter", back_populates="documents")
    category = relationship("DocumentCategory", back_populates="documents")
    pages = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan", order_by="DocumentPage.page_number")


class DocumentPage(Base):
    __tablename__ = "document_pages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False, default=1)
    page_label = Column(String(50), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(50), default="image/jpeg")
    file_size = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    document = relationship("Document", back_populates="pages")
