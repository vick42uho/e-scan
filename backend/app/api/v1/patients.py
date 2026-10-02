from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.patient import PatientResponse, PatientSearchResult
from app.services.patient_service import patient_service

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("/search", response_model=List[PatientSearchResult])
def search_patients(
    q: str = Query(..., min_length=1, description="ค้นหาด้วย HN หรือชื่อ-นามสกุล"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """ค้นหารายชื่อผู้ป่วยในระบบ"""
    return patient_service.search_patients(db, query=q, limit=limit)

@router.get("/{hn}", response_model=PatientResponse)
def get_patient_profile(
    hn: str,
    db: Session = Depends(get_db)
):
    """ดึงข้อมูลผู้ป่วยและประวัติการรับบริการ (Visits) ตาม HN"""
    patient = patient_service.get_by_hn(db, hn=hn)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with HN '{hn}' not found")
    return patient
