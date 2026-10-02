from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.document import DocumentTreeResponse, DocumentItemResponse
from app.services.document_service import document_service

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/tree/{hn}", response_model=DocumentTreeResponse)
def get_patient_document_tree(
    hn: str,
    group_by: str = Query("visit_date", description="จัดกลุ่มตาม: visit_date, category, caregiver"),
    category_type: str = Query("all", description="แท็บ: 'doctor', 'non_doctor', 'care_team', 'admin', หรือ 'all'"),
    encounter_type: Optional[str] = Query(None, description="กรองประเภทคนไข้: 'OPD', 'IPD', 'all' หรือ 'O+I'"),
    query: Optional[str] = Query(None, description="ค้นหาชื่อเอกสาร หรือคีย์เวิร์ดในชาร์ตคนไข้นี้"),
    doctor_code: Optional[str] = Query(None, description="รหัสแพทย์ผู้ตรวจ (My Documents filter)"),
    db: Session = Depends(get_db)
):
    """
    ดึงโครงสร้าง Tree View เอกสารทั้งหมดของผู้ป่วย
    แบ่งตามกลุ่ม (Visit Date, Category, Caregiver) และแท็บ/ประเภทคนไข้ (OPD / IPD / O+I)
    """
    return document_service.get_document_tree(
        db=db,
        hn=hn,
        group_by=group_by,
        category_type=category_type,
        encounter_type=encounter_type,
        query=query,
        doctor_code=doctor_code
    )

@router.get("/{document_id}", response_model=DocumentItemResponse)
def get_document_details(
    document_id: str,
    db: Session = Depends(get_db)
):
    """ดึงข้อมูลเอกสารแบบละเอียด พร้อมรายชื่อหน้า (Pages) และ URL ภาพ"""
    doc = document_service.get_document_by_id(db=db, document_id=document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
