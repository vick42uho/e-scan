import os
import io
from pathlib import Path
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException
from fastapi.responses import Response
from PIL import Image

from app.models.document import DocumentPage, Document
from app.core.config import settings
from app.utils.watermark import apply_image_watermark

class FileService:
    @staticmethod
    def get_document_page_file(
        db: Session,
        document_id: str,
        page_number: int,
        watermark: bool = False,
        user_id: str = "Staff",
        stamp_text: str = "สำเนาถูกต้อง COPY"
    ) -> Response:
        """
        ดึงไฟล์ภาพเอกสารหรือ PDF ตาม Document ID และ Page Number
        พร้อมประทับตราลายน้ำรักษาความปลอดภัยแบบ Dynamic Watermark
        """
        page = (
            db.query(DocumentPage)
            .filter(
                DocumentPage.document_id == document_id,
                DocumentPage.page_number == page_number
            )
            .first()
        )
        if not page:
            raise HTTPException(status_code=404, detail="Document page not found")

        file_path = Path(page.file_path)
        if not file_path.is_absolute() or not file_path.exists():
            alt_path = settings.STORAGE_DIR / page.file_name
            if alt_path.exists():
                file_path = alt_path

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on storage")

        with open(file_path, "rb") as f:
            content = f.read()

        mime = page.mime_type or "image/jpeg"
        is_pdf = file_path.suffix.lower() == ".pdf" or mime == "application/pdf"

        # หากเป็นไฟล์ PDF ให้เรนเดอร์หน้านั้นๆ เป็นภาพความละเอียดสูงแบบ On-The-Fly ทันที
        # โดยไม่ต้องแปลงไฟล์ทิ้งไว้บนดิสก์
        if is_pdf:
            import pymupdf
            try:
                with pymupdf.open(str(file_path)) as pdf_doc:
                    total_p = len(pdf_doc)
                    page_idx = min(max(page_number - 1, 0), total_p - 1)
                    pdf_page = pdf_doc[page_idx]
                    pix = pdf_page.get_pixmap(dpi=150)
                    content = pix.tobytes("jpeg")
                    mime = "image/jpeg"
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to render PDF page: {str(e)}")
        else:
            with open(file_path, "rb") as f:
                content = f.read()

        # หากต้องการลายน้ำรักษาความปลอดภัย
        if watermark and mime.startswith("image/"):
            watermarked_bytes = apply_image_watermark(
                content,
                user_id=user_id,
                custom_stamp=stamp_text
            )
            return Response(
                content=watermarked_bytes,
                media_type="image/jpeg",
                headers={
                    "Content-Disposition": f"inline; filename={page.file_name}",
                    "Cache-Control": "private, max-age=60"
                }
            )

        return Response(
            content=content,
            media_type=mime,
            headers={
                "Content-Disposition": f"inline; filename={page.file_name}",
                "Cache-Control": "public, max-age=3600"
            }
        )

    @staticmethod
    def get_document_page_thumbnail(
        db: Session,
        document_id: str,
        page_number: int
    ) -> Response:
        """
        ดึงหรือสร้างภาพ Thumbnail ขนาดกว้าง ~200px สำหรับแถบ Thumbnail Strip
        รองรับทั้งไฟล์ภาพปกติและไฟล์ PDF โดยเรนเดอร์ On-The-Fly แล้วเก็บแคช
        """
        page = (
            db.query(DocumentPage)
            .filter(
                DocumentPage.document_id == document_id,
                DocumentPage.page_number == page_number
            )
            .first()
        )
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")

        thumb_path = settings.THUMBNAILS_DIR / f"thumb_{document_id}_{page_number}.jpg"
        if thumb_path.exists():
            with open(thumb_path, "rb") as f:
                return Response(content=f.read(), media_type="image/jpeg")

        # สร้าง thumbnail จากไฟล์หลัก
        file_path = Path(page.file_path)
        if not file_path.is_absolute() or not file_path.exists():
            alt_path = settings.STORAGE_DIR / page.file_name
            if alt_path.exists():
                file_path = alt_path

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Source image not found")

        is_pdf = file_path.suffix.lower() == ".pdf" or (page.mime_type and page.mime_type == "application/pdf")
        if is_pdf:
            import pymupdf
            try:
                with pymupdf.open(str(file_path)) as pdf_doc:
                    total_p = len(pdf_doc)
                    page_idx = min(max(page_number - 1, 0), total_p - 1)
                    pdf_page = pdf_doc[page_idx]
                    zoom = 200.0 / pdf_page.rect.width if pdf_page.rect.width > 0 else 0.3
                    mat = pymupdf.Matrix(zoom, zoom)
                    pix = pdf_page.get_pixmap(matrix=mat)
                    thumb_bytes = pix.tobytes("jpeg")
                    with open(thumb_path, "wb") as tf:
                        tf.write(thumb_bytes)
                    return Response(content=thumb_bytes, media_type="image/jpeg")
            except Exception as e:
                pass

        try:
            with Image.open(file_path) as img:
                img.thumbnail((200, 260))
                thumb_io = io.BytesIO()
                img.convert("RGB").save(thumb_io, format="JPEG", quality=80)
                thumb_bytes = thumb_io.getvalue()
                
                # บันทึกลงแคช thumbnail
                with open(thumb_path, "wb") as tf:
                    tf.write(thumb_bytes)
                
                return Response(content=thumb_bytes, media_type="image/jpeg")
        except Exception as e:
            # Fallback ส่งภาพเดิม
            with open(file_path, "rb") as f:
                return Response(content=f.read(), media_type="image/jpeg")

    @staticmethod
    def get_raw_document_file(
        db: Session,
        document_id: str
    ) -> Response:
        """
        เสิร์ฟไฟล์เอกสารดิบทั้งฉบับ (Raw File เช่น .pdf สำหรับเปิดดูใน Acrobat / PDF Viewer ของเบราว์เซอร์)
        """
        page = (
            db.query(DocumentPage)
            .filter(DocumentPage.document_id == document_id)
            .order_by(DocumentPage.page_number)
            .first()
        )
        if not page:
            raise HTTPException(status_code=404, detail="Document not found")

        file_path = Path(page.file_path)
        if not file_path.is_absolute() or not file_path.exists():
            alt_path = settings.STORAGE_DIR / page.file_name
            if alt_path.exists():
                file_path = alt_path

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on storage")

        with open(file_path, "rb") as f:
            content = f.read()

        is_pdf = file_path.suffix.lower() == ".pdf" or page.mime_type == "application/pdf"
        media_type = "application/pdf" if is_pdf else (page.mime_type or "image/jpeg")

        return Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"inline; filename={page.file_name}",
                "Cache-Control": "public, max-age=3600"
            }
        )

file_service = FileService()
