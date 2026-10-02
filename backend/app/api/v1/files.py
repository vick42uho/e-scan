from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.file_service import file_service

router = APIRouter(prefix="/documents", tags=["Files"])

@router.get("/{document_id}/pages/{page_number}/file")
def get_page_file(
    document_id: str,
    page_number: int,
    watermark: bool = Query(False, description="ต้องการประทับตราลายน้ำหรือไม่"),
    user_id: str = Query("Staff", description="รหัสเจ้าหน้าที่ที่เปิดดูเอกสาร"),
    stamp: str = Query("สำเนาถูกต้อง COPY", description="ข้อความตราประทับ"),
    db: Session = Depends(get_db)
):
    """
    เสิร์ฟไฟล์ภาพสแกนหรือ PDF ของเอกสารหน้านั้นๆ
    สามารถเปิด Dynamic Watermark เพื่อประทับตรารักษาความปลอดภัยได้
    """
    return file_service.get_document_page_file(
        db=db,
        document_id=document_id,
        page_number=page_number,
        watermark=watermark,
        user_id=user_id,
        stamp_text=stamp
    )

@router.get("/{document_id}/pages/{page_number}/thumbnail")
def get_page_thumbnail(
    document_id: str,
    page_number: int,
    db: Session = Depends(get_db)
):
    """
    เสิร์ฟภาพขนาดเล็ก (Thumbnail) สำหรับแถบพรีวิวเอกสารด้านข้าง
    """
    return file_service.get_document_page_thumbnail(
        db=db,
        document_id=document_id,
        page_number=page_number
    )

@router.get("/{document_id}/raw")
def get_raw_file(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    เสิร์ฟไฟล์เอกสารต้นฉบับทั้งฉบับ (Raw File เช่น .pdf สำหรับเปิดดูใน Acrobat / Native Browser PDF Viewer)
    """
    return file_service.get_raw_document_file(
        db=db,
        document_id=document_id
    )
