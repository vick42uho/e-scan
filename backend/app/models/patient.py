from datetime import datetime
from sqlalchemy import Column, String, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"

    hn = Column(String(30), primary_key=True, index=True)
    name_th = Column(String(150), nullable=False)
    name_en = Column(String(150), nullable=True)
    dob = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)
    age_display = Column(String(50), nullable=True)
    id_card = Column(String(30), nullable=True)
    allergies = Column(Text, nullable=True)
    rights = Column(String(150), nullable=True)
    photo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    encounters = relationship("Encounter", back_populates="patient", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="patient", cascade="all, delete-orphan")


class Encounter(Base):
    __tablename__ = "encounters"

    en = Column(String(40), primary_key=True, index=True)
    hn = Column(String(30), ForeignKey("patients.hn", ondelete="CASCADE"), nullable=False, index=True)
    visit_date = Column(Date, nullable=False, index=True)
    visit_time = Column(String(20), nullable=True)
    department_code = Column(String(30), nullable=True)
    department_name = Column(String(100), nullable=True)
    doctor_code = Column(String(30), nullable=True)
    doctor_name = Column(String(100), nullable=True)
    encounter_type = Column(String(10), default="OPD")
    status = Column(String(20), default="Completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="encounters")
    documents = relationship("Document", back_populates="encounter")
