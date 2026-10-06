import os
import io
import re
import uuid
import hashlib
from datetime import datetime, date
from zoneinfo import ZoneInfo
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import UploadFile, HTTPException
import numpy as np
import PIL.Image
import pymupdf
import zxingcpp

from app.models.document import Document, DocumentCategory, DocumentPage
from app.models.patient import Patient, Encounter
from app.models.audit import AuditLog
from app.schemas.scan import (
    DocumentCategoryOption,
    DocumentCategoryCreate,
    EncounterOption,
    DocumentUploadResponse,
    BarcodeDetectionResult,
    ExtractedMetadata,
    ExtractionResponse,
    PatientLookupResult,
    VendorUploadResponse
)
from app.core.config import settings
from app.core.storage import build_storage_path

def get_bangkok_today() -> date:
    try:
        return datetime.now(ZoneInfo("Asia/Bangkok")).date()
    except Exception:
        return datetime.utcnow().date()

def parse_date_string(val: Optional[str]) -> Optional[date]:
    if not val or not str(val).strip():
        return None
    s = str(val).strip()
    try:
        # 1. YYYY-MM-DD
        if re.match(r'^\d{4}-\d{2}-\d{2}', s):
            clean = s.split('T')[0].split(' ')[0]
            parts = clean.split('-')
            y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
            if y > 2400:
                y -= 543
            return date(y, m, d)
        # 2. DD/MM/YYYY
        if re.match(r'^\d{1,2}/\d{1,2}/\d{4}', s):
            parts = s.split('/')
            d, m, y = int(parts[0]), int(parts[1]), int(parts[2])
            if y > 2400:
                y -= 543
            return date(y, m, d)
        # 3. DD-MM-YYYY
        if re.match(r'^\d{1,2}-\d{1,2}-\d{4}', s):
            parts = s.split('-')
            d, m, y = int(parts[0]), int(parts[1]), int(parts[2])
            if y > 2400:
                y -= 543
            return date(y, m, d)
    except Exception:
        pass
    return None

_ocr_engine = None

def get_ocr_engine():
    global _ocr_engine
    if _ocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            thai_rec_path = settings.BASE_DIR / "models" / "ocr" / "thai" / "rec.onnx"
            thai_dict_path = settings.BASE_DIR / "models" / "ocr" / "thai" / "dict.txt"
            
            if thai_rec_path.exists() and thai_dict_path.exists():
                _ocr_engine = RapidOCR(
                    rec_model_path=str(thai_rec_path),
                    rec_keys_path=str(thai_dict_path)
                )
            else:
                _ocr_engine = RapidOCR()
        except Exception as e:
            print(f"RapidOCR initialization notice: {e}")
            _ocr_engine = None
    return _ocr_engine

def ocr_extract_with_auto_orientation(ocr, pil_img: PIL.Image.Image) -> str:
    """
    Auto-detects document orientation (0, 270, 90, 180 degrees) based on Thai text density.
    Flatbed scanners (e.g. EPSON V39) scan landscape documents at 270 degrees.
    """
    if not ocr or not pil_img:
        return ""
    
    try:
        best_text = ""
        best_score = -1
        
        # Test angles: 0 (default), 270 (flatbed), 90, 180
        for ang in [0, 270, 90, 180]:
            rot = pil_img if ang == 0 else pil_img.rotate(ang, expand=True)
            res, _ = ocr(np.array(rot))
            lines = [r[1] for r in res] if res else []
            text = "\n".join(lines)
            thai = len(re.findall(r'[\u0E00-\u0E7F]', text))
            score = thai * 3 + len(text.strip())
            if score > best_score:
                best_score = score
                best_text = text
            # If high confidence (> 350 Thai chars), that is clearly the right orientation
            if thai >= 350:
                break
                
        return best_text
    except Exception as e:
        print(f"OCR orientation extraction error: {e}")
        return ""

class ScanService:
    def get_all_categories(self, db: Session) -> List[DocumentCategoryOption]:
        categories = db.query(DocumentCategory).order_by(DocumentCategory.sort_order).all()
        return [DocumentCategoryOption.model_validate(c) for c in categories]

    def get_encounters_by_hn(self, db: Session, hn: str) -> List[EncounterOption]:
        clean_hn = (hn or "").strip()
        encounters = db.query(Encounter).filter(Encounter.hn == clean_hn).order_by(desc(Encounter.visit_date)).all()
        if not encounters and clean_hn:
            digits = re.sub(r'\D', '', clean_hn).lstrip('0') or '0'
            all_encs = db.query(Encounter).order_by(desc(Encounter.visit_date)).all()
            encounters = [e for e in all_encs if (re.sub(r'\D', '', e.hn or '').lstrip('0') or '0') == digits]

        results = []
        for e in encounters:
            e_dict = {
                "en": e.en,
                "visit_date": str(e.visit_date),
                "visit_time": e.visit_time,
                "encounter_type": e.encounter_type,
                "doctor_name": e.doctor_name,
                "department_name": e.department_name
            }
            results.append(EncounterOption.model_validate(e_dict))
        return results

    def create_category(self, db: Session, data: DocumentCategoryCreate) -> DocumentCategoryOption:
        clean_name_th = data.name_th.strip()
        if not clean_name_th:
            raise HTTPException(status_code=400, detail="ชื่อหมวดหมู่ภาษาไทยจำเป็นต้องระบุ")
        
        clean_name_en = (data.name_en or "").strip() or clean_name_th
        category_type = data.category_type.strip() if data.category_type else "Care Team"
        
        # Determine unique code
        if data.code and data.code.strip():
            code = data.code.strip().upper()
        else:
            slug = re.sub(r'[^A-Z0-9]', '', clean_name_en.upper())
            if not slug:
                slug = "CAT"
            code = f"{slug[:8]}_{uuid.uuid4().hex[:4].upper()}"

        existing = db.query(DocumentCategory).filter(DocumentCategory.code == code).first()
        if existing:
            code = f"{code}_{uuid.uuid4().hex[:4].upper()}"

        max_sort = db.query(DocumentCategory.sort_order).order_by(desc(DocumentCategory.sort_order)).first()
        next_order = (max_sort[0] + 1) if max_sort and max_sort[0] is not None else 1

        new_cat = DocumentCategory(
            code=code,
            name_th=clean_name_th,
            name_en=clean_name_en,
            category_type=category_type,
            sort_order=next_order
        )
        db.add(new_cat)
        db.commit()
        db.refresh(new_cat)
        return DocumentCategoryOption.model_validate(new_cat)

    def lookup_patient_or_encounter(self, db: Session, query: str) -> PatientLookupResult:
        q = (query or "").strip()
        if not q:
            return PatientLookupResult(found=False, message="กรุณาระบุเลขที่ HN หรือ VN")

        # 1. First attempt: match by Encounter EN
        encounter = db.query(Encounter).filter(Encounter.en.ilike(q)).first()
        patient = None
        if encounter:
            patient = db.query(Patient).filter(Patient.hn == encounter.hn).first()
            if not patient:
                enc_hn_digits = re.sub(r'\D', '', encounter.hn or '').lstrip('0') or '0'
                all_pts = db.query(Patient).all()
                for p in all_pts:
                    if (re.sub(r'\D', '', p.hn or '').lstrip('0') or '0') == enc_hn_digits:
                        patient = p
                        break
        else:
            # 2. Second attempt: match by Patient HN
            patient = db.query(Patient).filter(Patient.hn.ilike(q)).first()
            if not patient:
                q_digits = re.sub(r'\D', '', q).lstrip('0') or '0'
                if len(q_digits) >= 1:
                    all_pts = db.query(Patient).all()
                    for p in all_pts:
                        p_digits = re.sub(r'\D', '', p.hn or '').lstrip('0') or '0'
                        if p_digits == q_digits:
                            patient = p
                            break

            if patient:
                encounter = db.query(Encounter).filter(Encounter.hn == patient.hn).order_by(desc(Encounter.visit_date)).first()
                if not encounter:
                    p_digits = re.sub(r'\D', '', patient.hn or '').lstrip('0') or '0'
                    all_encs = db.query(Encounter).all()
                    for e in all_encs:
                        if (re.sub(r'\D', '', e.hn or '').lstrip('0') or '0') == p_digits:
                            encounter = e
                            break

        if not patient and not encounter:
            return PatientLookupResult(found=False, message=f"ไม่พบข้อมูลเวชระเบียนสำหรับ '{q}'")

        # Dynamically compute age from DOB based on current year/date
        age_str = patient.age_display if patient else None
        dob_str = str(patient.dob) if patient and patient.dob else None
        
        if patient and patient.dob:
            try:
                today = datetime.now().date()
                birth = patient.dob
                years = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
                if years > 0:
                    age_str = f"{years} ปี"
                else:
                    months = (today.year - birth.year) * 12 + today.month - birth.month
                    age_str = f"{max(0, months)} เดือน"
            except Exception:
                pass

        return PatientLookupResult(
            found=True,
            hn=patient.hn if patient else (encounter.hn if encounter else None),
            name_th=patient.name_th if patient else None,
            name_en=patient.name_en if patient else None,
            gender=patient.gender if patient else None,
            dob=dob_str,
            age=age_str,
            en=encounter.en if encounter else None,
            visit_date=str(encounter.visit_date) if encounter else None,
            visit_time=encounter.visit_time if encounter else None,
            encounter_type=encounter.encounter_type if encounter else "OPD",
            department_name=encounter.department_name if encounter else None,
            doctor_name=encounter.doctor_name if encounter else None,
            message="พบข้อมูลเรียบร้อยแล้ว"
        )

    def upload_document(
        self, db: Session, file: UploadFile, hn: str, title: str, category_id: int, 
        en: Optional[str], document_code: Optional[str], doctor_code: Optional[str], 
        doctor_name: Optional[str], encounter_type: Optional[str], 
        is_doctor_document: bool, is_confidential: bool, scan_by_id: Optional[str], 
        scan_by_name: Optional[str], scan_by_role: Optional[str],
        patient_name: Optional[str] = None, age: Optional[str] = None, dob: Optional[str] = None,
        visit_date: Optional[str] = None, visit_time: Optional[str] = None
    ) -> DocumentUploadResponse:
        
        patient = db.query(Patient).filter(Patient.hn == hn).first()
        clean_patient_name = patient_name.strip() if patient_name and patient_name.strip() else None
        clean_age = age.strip() if age and age.strip() else None
        
        parsed_dob = parse_date_string(dob)

        if not patient:
            patient = Patient(
                hn=hn,
                name_th=clean_patient_name or f"ผู้ป่วย {hn}",
                gender="U",
                age_display=clean_age,
                dob=parsed_dob,
                created_at=datetime.utcnow()
            )
            db.add(patient)
            db.flush()
        else:
            if clean_patient_name and (not patient.name_th or patient.name_th.startswith("ผู้ป่วย ")):
                patient.name_th = clean_patient_name
            if clean_age and not patient.age_display:
                patient.age_display = clean_age
            if parsed_dob and not patient.dob:
                patient.dob = parsed_dob
            db.flush()

        if en and en.strip():
            clean_en = en.strip()
            encounter = db.query(Encounter).filter(Encounter.en == clean_en).first()
            clean_time = visit_time.strip() if visit_time and visit_time.strip() else None
            if not encounter:
                parsed_visit = parse_date_string(visit_date) or get_bangkok_today()
                encounter = Encounter(
                    en=clean_en,
                    hn=hn,
                    visit_date=parsed_visit,
                    visit_time=clean_time,
                    doctor_name=doctor_name,
                    encounter_type=encounter_type or "OPD"
                )
                db.add(encounter)
                db.flush()
            else:
                if doctor_name and not encounter.doctor_name:
                    encounter.doctor_name = doctor_name
                if encounter_type and not encounter.encounter_type:
                    encounter.encounter_type = encounter_type
                if clean_time and not encounter.visit_time:
                    encounter.visit_time = clean_time
                db.flush()
            
        category = db.query(DocumentCategory).filter(DocumentCategory.id == category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="Category not found")
            
        document_id = str(uuid.uuid4())
        
        content = file.file.read()
        file.file.seek(0)
        
        mime_type = file.content_type or "application/octet-stream"
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".bin"
        
        safe_hn = hn.replace("/", "_")
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{safe_hn}_{timestamp}_{document_id[:8]}{ext}"
        
        file_path, rel_path = build_storage_path(hn, filename)
        with open(file_path, "wb") as f:
            f.write(content)
            
        file_size = len(content)
        width, height = None, None
        total_pages = 1
        
        if mime_type.startswith("image/"):
            try:
                with PIL.Image.open(file_path) as img:
                    width, height = img.size
            except Exception:
                pass
        elif mime_type == "application/pdf":
            try:
                doc = pymupdf.open(file_path)
                total_pages = len(doc)
                doc.close()
            except Exception:
                pass
                
        document = Document(
            id=document_id,
            hn=hn,
            en=en,
            category_id=category_id,
            title=title,
            document_code=document_code,
            doctor_code=doctor_code,
            doctor_name=doctor_name,
            is_doctor_document=is_doctor_document,
            scan_by_id=scan_by_id,
            scan_by_name=scan_by_name,
            scan_by_role=scan_by_role,
            scan_date=datetime.utcnow(),
            total_pages=total_pages,
            is_confidential=is_confidential
        )
        db.add(document)
        db.flush()
        
        if mime_type == "application/pdf":
            for i in range(total_pages):
                page = DocumentPage(
                    document_id=document_id,
                    page_number=i+1,
                    file_name=filename,
                    file_path=rel_path,
                    mime_type=mime_type,
                    file_size=file_size
                )
                db.add(page)
        else:
            page = DocumentPage(
                document_id=document_id,
                page_number=1,
                file_name=filename,
                file_path=rel_path,
                mime_type=mime_type,
                file_size=file_size,
                width=width,
                height=height
            )
            db.add(page)
            
        db.commit()
        
        return DocumentUploadResponse(
            status="success",
            document_id=document_id,
            title=title,
            total_pages=total_pages,
            message="Document uploaded successfully"
        )
        
    def add_page_to_document(
        self, db: Session, document_id: str, file: UploadFile, page_label: Optional[str]
    ) -> DocumentUploadResponse:
        
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        content = file.file.read()
        file.file.seek(0)
        
        mime_type = file.content_type or "application/octet-stream"
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".bin"
        
        safe_hn = document.hn.replace("/", "_")
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"{safe_hn}_{timestamp}_{document_id[:8]}_{document.total_pages + 1}{ext}"
        
        file_path, rel_path = build_storage_path(document.hn, filename)
        with open(file_path, "wb") as f:
            f.write(content)
            
        file_size = len(content)
        width, height = None, None
        
        if mime_type.startswith("image/"):
            try:
                with PIL.Image.open(file_path) as img:
                    width, height = img.size
            except Exception:
                pass
                
        document.total_pages += 1
        
        page = DocumentPage(
            document_id=document_id,
            page_number=document.total_pages,
            page_label=page_label,
            file_name=filename,
            file_path=rel_path,
            mime_type=mime_type,
            file_size=file_size,
            width=width,
            height=height
        )
        db.add(page)
        db.commit()
        
        return DocumentUploadResponse(
            status="success",
            document_id=document_id,
            title=document.title,
            total_pages=document.total_pages,
            message="Page added successfully"
        )

    def vendor_upload_document(
        self,
        db: Session,
        file: UploadFile,
        vendor_code: str,
        vendor_name: str,
        hn: str,
        title: str,
        category_code: Optional[str] = None,
        category_id: Optional[int] = None,
        en: Optional[str] = None,
        document_code: Optional[str] = None,
        doctor_code: Optional[str] = None,
        doctor_name: Optional[str] = None,
        encounter_type: Optional[str] = "OPD",
        patient_name: Optional[str] = None,
        age: Optional[str] = None,
        dob: Optional[str] = None,
        visit_date: Optional[str] = None,
        external_reference_id: Optional[str] = None,
        client_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> VendorUploadResponse:
        # 1. Validate file extension strictly (jpg, jpeg, png, pdf)
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        allowed_exts = {".pdf", ".jpg", ".jpeg", ".png"}
        if ext not in allowed_exts:
            raise HTTPException(
                status_code=400,
                detail=f"รูปแบบไฟล์ไม่ถูกต้อง '{ext}' ระบบรองรับเฉพาะ .pdf, .jpg, .jpeg, .png เท่านั้น"
            )

        # 2. Read and validate content & size (Max 50MB)
        MAX_SIZE = 50 * 1024 * 1024
        content = file.file.read()
        file.file.seek(0)
        
        if len(content) > MAX_SIZE:
            raise HTTPException(
                status_code=400,
                detail="ขนาดไฟล์เกินขีดจำกัดสูงสุด 50 MB"
            )
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="ไฟล์ที่อัพโหลดมีขนาดเป็น 0 (Empty file)")

        # 3. Magic bytes inspection (Deep content security check)
        is_valid_magic = False
        if ext == ".pdf" and content.startswith(b"%PDF-"):
            is_valid_magic = True
        elif ext in [".jpg", ".jpeg"] and content.startswith(b"\xff\xd8\xff"):
            is_valid_magic = True
        elif ext == ".png" and content.startswith(b"\x89PNG\r\n\x1a\n"):
            is_valid_magic = True

        if not is_valid_magic:
            raise HTTPException(
                status_code=400,
                detail=f"ความปลอดภัยล้มเหลว (Magic Bytes mismatch): เนื้อหาไฟล์จริงไม่ตรงกับนามสกุล '{ext}'"
            )

        # 4. Check for duplicate/idempotent submission via external_reference_id
        file_hash = hashlib.sha256(content).hexdigest()
        clean_hn = hn.strip()
        ref_clean = external_reference_id.strip() if external_reference_id and external_reference_id.strip() else None
        
        if ref_clean:
            existing_doc = db.query(Document).filter(
                (Document.document_code == ref_clean) & (Document.hn == clean_hn)
            ).first()
            if existing_doc:
                return VendorUploadResponse(
                    status="success",
                    document_id=existing_doc.id,
                    title=existing_doc.title,
                    hn=existing_doc.hn,
                    en=existing_doc.en,
                    total_pages=existing_doc.total_pages,
                    vendor_name=vendor_name,
                    reference_id=ref_clean,
                    file_checksum_sha256=file_hash,
                    message="เอกสารนี้เคยถูกบันทึกเข้าระบบแล้ว (Idempotent response)"
                )

        # 5. Resolve category
        category = None
        if category_id:
            category = db.query(DocumentCategory).filter(DocumentCategory.id == category_id).first()
        elif category_code and category_code.strip():
            category = db.query(DocumentCategory).filter(DocumentCategory.code.ilike(category_code.strip())).first()

        if not category:
            # Fallback to general category or first available
            category = db.query(DocumentCategory).filter(DocumentCategory.code.ilike("LAB")).first() or db.query(DocumentCategory).first()
        
        if not category:
            raise HTTPException(status_code=400, detail="ไม่พบหมวดหมู่เอกสารในระบบ")

        # 6. Ensure Patient & Encounter exist (upsert)
        patient = db.query(Patient).filter(Patient.hn == clean_hn).first()
        clean_patient_name = patient_name.strip() if patient_name and patient_name.strip() else None
        
        parsed_dob = parse_date_string(dob)

        if not patient:
            patient = Patient(
                hn=clean_hn,
                name_th=clean_patient_name or f"ผู้ป่วย {clean_hn}",
                gender="U",
                age_display=age.strip() if age else None,
                dob=parsed_dob,
                created_at=datetime.utcnow()
            )
            db.add(patient)
            db.flush()
        else:
            if clean_patient_name and (not patient.name_th or patient.name_th.startswith("ผู้ป่วย ")):
                patient.name_th = clean_patient_name
            if parsed_dob and not patient.dob:
                patient.dob = parsed_dob
            db.flush()

        clean_en = en.strip() if en and en.strip() else None
        if clean_en:
            encounter = db.query(Encounter).filter(Encounter.en == clean_en).first()
            if not encounter:
                parsed_visit = parse_date_string(visit_date) or get_bangkok_today()
                encounter = Encounter(
                    en=clean_en,
                    hn=clean_hn,
                    visit_date=parsed_visit,
                    doctor_name=doctor_name,
                    encounter_type=encounter_type or "OPD"
                )
                db.add(encounter)
                db.flush()

        # 7. Write File to Storage with sanitized unique name
        document_id = str(uuid.uuid4())
        safe_hn = clean_hn.replace("/", "_")
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        vendor_prefix = re.sub(r'[^A-Za-z0-9_]', '', vendor_code.upper()) or "EXT"
        filename = f"VENDOR_{vendor_prefix}_{safe_hn}_{timestamp}_{document_id[:8]}{ext}"
        
        file_path, rel_path = build_storage_path(clean_hn, filename)
        with open(file_path, "wb") as f:
            f.write(content)

        # 8. Extract dimension / page count
        mime_type = "application/pdf" if ext == ".pdf" else ("image/png" if ext == ".png" else "image/jpeg")
        total_pages = 1
        width, height = None, None
        
        if mime_type.startswith("image/"):
            try:
                with PIL.Image.open(file_path) as img:
                    width, height = img.size
            except Exception:
                pass
        elif mime_type == "application/pdf":
            try:
                doc = pymupdf.open(file_path)
                total_pages = len(doc)
                doc.close()
            except Exception:
                pass

        # 9. Create Document Record
        document = Document(
            id=document_id,
            hn=clean_hn,
            en=clean_en,
            category_id=category.id,
            title=title.strip(),
            document_code=ref_clean or (document_code.strip() if document_code else None),
            doctor_code=doctor_code,
            doctor_name=doctor_name,
            is_doctor_document=bool(doctor_name and doctor_name.strip()),
            scan_by_id=f"VENDOR_{vendor_prefix}",
            scan_by_name=f"Vendor: {vendor_name}",
            scan_by_role="Vendor",
            scan_date=datetime.utcnow(),
            total_pages=total_pages,
            is_confidential=False
        )
        db.add(document)
        db.flush()

        # 10. Create Document Pages
        if mime_type == "application/pdf":
            for i in range(total_pages):
                page = DocumentPage(
                    document_id=document_id,
                    page_number=i + 1,
                    file_name=filename,
                    file_path=rel_path,
                    mime_type=mime_type,
                    file_size=len(content)
                )
                db.add(page)
        else:
            page = DocumentPage(
                document_id=document_id,
                page_number=1,
                page_label="หน้า 1",
                file_name=filename,
                file_path=rel_path,
                mime_type=mime_type,
                file_size=len(content),
                width=width,
                height=height
            )
            db.add(page)

        # 11. Record Security Audit Log
        audit = AuditLog(
            hn=clean_hn,
            document_id=document_id,
            page_number=1,
            action="VENDOR_UPLOAD",
            user_id=f"VENDOR:{vendor_prefix}",
            user_name=f"Vendor ({vendor_name})",
            user_ip=client_ip or "unknown",
            user_agent=user_agent,
            details=f"Vendor: {vendor_name} | File: {file.filename} | Size: {len(content)} bytes | SHA256: {file_hash} | Ref: {ref_clean or '-'}"
        )
        db.add(audit)
        db.commit()

        return VendorUploadResponse(
            status="success",
            document_id=document_id,
            title=title.strip(),
            hn=clean_hn,
            en=clean_en,
            total_pages=total_pages,
            vendor_name=vendor_name,
            reference_id=ref_clean,
            file_checksum_sha256=file_hash,
            message="บันทึกเอกสารจาก Vendor เข้าสู่ฐานข้อมูล DMS เรียบร้อยแล้ว"
        )
        
    def detect_barcodes(self, file: UploadFile) -> List[BarcodeDetectionResult]:
        import io
        try:
            content = file.file.read()
            file.file.seek(0)
            
            is_pdf = (file.filename and file.filename.lower().endswith(".pdf")) or (file.content_type == "application/pdf")
            
            if is_pdf:
                doc = pymupdf.open(stream=content, filetype="pdf")
                results = []
                for pno in range(min(len(doc), 2)):
                    page = doc.load_page(pno)
                    pix = page.get_pixmap(dpi=200)
                    img = PIL.Image.open(io.BytesIO(pix.tobytes("png")))
                    barcodes = zxingcpp.read_barcodes(img)
                    for b in barcodes:
                        results.append(BarcodeDetectionResult(text=b.text, format=str(b.format)))
                doc.close()
                return results
            else:
                img = PIL.Image.open(io.BytesIO(content))
                barcodes = zxingcpp.read_barcodes(img)
                return [
                    BarcodeDetectionResult(text=b.text, format=str(b.format))
                    for b in barcodes
                ]
        except Exception:
            return []

    def extract_document_metadata(
        self, db: Session, file: UploadFile, mode: str = "auto"
    ) -> ExtractionResponse:
        content = file.file.read()
        file.file.seek(0)
        
        filename_lower = (file.filename or "").lower()
        content_type_lower = (file.content_type or "").lower()
        is_pdf = filename_lower.endswith(".pdf") or "application/pdf" in content_type_lower
        
        extracted = ExtractedMetadata()
        mode_used = "auto"
        confidence = 0.0
        page_text = ""
        raw_text_snippet = None

        # 1. Barcode / QR Code Detection (All formats)
        if mode in ["auto", "barcode", "hybrid"]:
            barcodes = self.detect_barcodes(file)
            extracted.raw_barcodes = barcodes
            
            for bc in barcodes:
                text = bc.text.strip()
                if not text:
                    continue

                # A) Key=Value delimited format (supports pipe |, semicolon ;, newline, or single key=val)
                # e.g. HN=00000001|VN=OP26070000001|Doctype=OPD-NOTE|DOB=2006-01-08 17:00:00.000
                if ("=" in text or ":" in text) and ("|" in text or "\n" in text or ";" in text or "HN=" in text.upper() or "VN=" in text.upper()):
                    pairs = [p.strip() for p in re.split(r'[|\n;]+', text) if p.strip()]
                    for part in pairs:
                        delim = "=" if "=" in part else (":" if ":" in part else None)
                        if not delim:
                            continue
                        k, v = part.split(delim, 1)
                        k = k.strip().upper()
                        v = v.strip()
                        if not k or not v:
                            continue

                        # 1. HN
                        if k in ["HN", "H.N.", "PID", "HOSPITAL_NO", "HOSPITALNO"]:
                            extracted.hn = v
                            confidence = max(confidence, 0.99)
                            mode_used = "barcode"
                        # 2. VN / EN (Encounter)
                        elif k in ["VN", "EN", "V.N.", "E.N.", "VISIT", "ENCOUNTER", "VISIT_NO", "VISITNO"]:
                            extracted.en = v
                            confidence = max(confidence, 0.99)
                            mode_used = "barcode"
                            if v.upper().startswith("OP") or v.upper().startswith("VN"):
                                extracted.encounter_type = "OPD"
                            elif v.upper().startswith("IP"):
                                extracted.encounter_type = "IPD"
                        # 3. Doctype / Category Type
                        elif k in ["DOCTYPE", "DOC_TYPE", "DOC-TYPE", "CATEGORY", "CAT", "CATEGORY_TYPE", "DOCUMENT_TYPE"]:
                            doctype_val = v
                            cat = db.query(DocumentCategory).filter(
                                (DocumentCategory.code.ilike(doctype_val)) |
                                (DocumentCategory.category_type.ilike(doctype_val)) |
                                (DocumentCategory.name_en.ilike(doctype_val)) |
                                (DocumentCategory.name_th.ilike(doctype_val)) |
                                (DocumentCategory.code.ilike(f"%{doctype_val}%")) |
                                (DocumentCategory.category_type.ilike(f"%{doctype_val}%"))
                            ).first()
                            if cat:
                                extracted.category_id = cat.id
                                extracted.category_code = cat.code
                                extracted.category_name = cat.name_th or cat.name_en
                                if not extracted.title or extracted.title.startswith("scan_"):
                                    extracted.title = cat.name_th or cat.name_en
                            confidence = max(confidence, 0.99)
                            mode_used = "barcode"
                        # 4. DOB & dynamic Age calculation
                        elif k in ["DOB", "BIRTHDATE", "BIRTH_DATE", "DATE_OF_BIRTH"]:
                            iso_match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', v)
                            if iso_match:
                                b_year = int(iso_match.group(1))
                                b_month = int(iso_match.group(2))
                                b_day = int(iso_match.group(3))
                                if b_year > 2400:
                                    b_year -= 543
                                extracted.dob = f"{b_year:04d}-{b_month:02d}-{b_day:02d}"
                                today = datetime.now().date()
                                age_years = today.year - b_year - ((today.month, today.day) < (b_month, b_day))
                                if age_years >= 0:
                                    extracted.age = f"{age_years} ปี"
                            else:
                                extracted.dob = v
                        # 5. Patient Name
                        elif k in ["NAME", "PATIENT_NAME", "PATIENTNAME"]:
                            extracted.name = v
                            if re.search(r'[\u0E00-\u0E7F]', v):
                                extracted.name_th = v
                            else:
                                extracted.name_en = v
                        # 6. Doctor Name
                        elif k in ["DOCTOR", "DOCTOR_NAME", "DOC_NAME"]:
                            extracted.doctor_name = v
                        # 7. Document Code
                        elif k in ["DOC_CODE", "DOCUMENT_CODE", "FORM_NO", "FORM"]:
                            extracted.document_code = v

                # B) Standard Single-value Barcode / QR Code
                else:
                    if re.match(r'^\d{2}-?\d{2}-?\d{5,6}$', text) or re.match(r'^\d{6,12}$', text):
                        extracted.hn = text
                        confidence = max(confidence, 0.98)
                        mode_used = "barcode"
                    elif text.startswith("EN-") or text.startswith("VN-") or text.startswith("OP") or text.startswith("IP") or re.match(r'^\d{2}-?\d{2}-\d{6}$', text):
                        extracted.en = text
                        if text.startswith("OP") or text.startswith("VN"):
                            extracted.encounter_type = "OPD"
                        elif text.startswith("IP"):
                            extracted.encounter_type = "IPD"
                    elif text.startswith("FM-") or text.startswith("DOC-") or text.startswith("SUR-"):
                        extracted.document_code = text

        # 2. Text Extraction & OCR (Supports PDF, JPG, PNG, TIFF, BMP, WEBP, GIF)
        if mode in ["auto", "pdf_text", "ocr", "hybrid"]:
            if is_pdf:
                try:
                    doc = pymupdf.open(stream=content, filetype="pdf")
                    extracted_pages = []
                    for pno in range(min(len(doc), 2)):
                        page = doc[pno]
                        dig_text = page.get_text()
                        has_corruption = "\ufffd" in dig_text and (dig_text.count("\ufffd") / max(1, len(dig_text)) > 0.05)
                        
                        if len(dig_text.strip()) >= 25 and not has_corruption:
                            extracted_pages.append(dig_text)
                            if mode_used != "barcode":
                                mode_used = "pdf_text"
                            confidence = max(confidence, 0.95)
                        else:
                            ocr = get_ocr_engine()
                            if ocr:
                                pix = page.get_pixmap(dpi=200)
                                pil_img = PIL.Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
                                ocr_page_text = ocr_extract_with_auto_orientation(ocr, pil_img)
                                if ocr_page_text:
                                    extracted_pages.append(ocr_page_text)
                                    if mode_used != "barcode":
                                        mode_used = "ocr"
                                    confidence = max(confidence, 0.90)

                    page_text = "\n\n".join(extracted_pages)
                    doc.close()
                except Exception as e:
                    print(f"PDF extraction error: {e}")
            else:
                # Image formats: JPG, PNG, TIFF, BMP, WEBP, GIF (Scanned or uploaded)
                try:
                    ocr = get_ocr_engine()
                    if ocr:
                        pil_img = PIL.Image.open(io.BytesIO(content)).convert("RGB")
                        page_text = ocr_extract_with_auto_orientation(ocr, pil_img)
                        if page_text:
                            if mode_used != "barcode":
                                mode_used = "ocr"
                            confidence = max(confidence, 0.90)
                except Exception as e:
                    print(f"Image OCR error: {e}")

        if page_text:
            raw_text_snippet = page_text[:500]

            # A) Extract HN
            if not extracted.hn:
                hn_match = re.search(
                    r'(?:HN|H\.N\.|Hospital\s*No\.?)\s*[:.\s\r\n]*([0-9]{2}-?[0-9]{2}-?[0-9]{5,6}|[0-9]{6,12})',
                    page_text,
                    re.IGNORECASE
                )
                if not hn_match:
                    hn_match = re.search(r'\b(0[0-9]-[0-9]{2}-[0-9]{5,6})\b', page_text)
                if not hn_match:
                    hn_match = re.search(r'\b(00[0-9]{6,8})\b', page_text)
                if not hn_match:
                    hn_match = re.search(r'HN\s*[:.\s\r\n]*0*([0-9]{6,10})', page_text, re.IGNORECASE)
                if hn_match:
                    extracted.hn = hn_match.group(1).strip()
                    confidence = max(confidence, 0.90)

            # B) Extract VN / EN (Encounter)
            if not extracted.en:
                en_match = re.search(
                    r'(?:EN|VN|E\.N\.|V\.N\.|Encounter|Visit\s*No\.?)\s*[:.\s\r\n]*([0-9]{2}-?[0-9]{2}-?[0-9]{5,6}|[0-9]{6,12}|OP[0-9]{3,8}|IP[0-9]{3,8})',
                    page_text,
                    re.IGNORECASE
                )
                if not en_match:
                    en_match = re.search(r'\b(OP[0-9]{3,8}|IP[0-9]{3,8})\b', page_text, re.IGNORECASE)
                if not en_match:
                    en_match = re.search(r'\b(0[0-9]-[0-9]{2}-[0-9]{6})\b', page_text)
                if en_match:
                    extracted.en = en_match.group(1).strip()

            # C) Extract Patient Name (Prioritize Thai script and prefixes, then English)
            # Stop keywords when patient name is on the same line with other labels
            stop_keywords = r'(?:HN|H\.N\.|VN|EN|อายุ|Age|วัน\s*เดือน\s*ปี\s*เกิด|วันเกิด|DOB|Date\s*of\s*Birth|เพศ|Sex|Gender|เตียง|Bed|แผนก|Dept|Ward|Doctor|แพทย์)'

            thai_name = None

            # 1. Match label style FIRST (More explicit and reliable on clinical forms): ชื่อ - สกุล, ชื่อผู้ป่วย, ชื่อ
            lbl_th_match = re.search(
                r'(?:ชื่อ\s*[-–—]?\s*(?:สกุล|นามสกุล)|ชื่อผู้ป่วย|ชื่อ)\s*[:.\s-]*([^\r\n|]+)',
                page_text
            )
            if lbl_th_match:
                raw_th = lbl_th_match.group(1).strip()
                # Truncate before any subsequent label on the same line
                raw_th = re.split(rf'\s+(?:{stop_keywords})[:\s]', raw_th, maxsplit=1, flags=re.IGNORECASE)[0].strip()
                raw_th = re.sub(r'^[._\s:-]+|[._\s:-]+$', '', raw_th).strip()
                if len(raw_th) >= 2 and not any(bad in raw_th for bad in ["โรงพยาบาล", "ยันฮี", "เวชระเบียน", "ผู้รับบริการ"]):
                    thai_name = raw_th

            # 2. Match prefix style: น.ส., นางสาว, นาย, นาง, ด.ช., ด.ญ., คุณ, or OCR artifacts: น.a., u.a., U.a.
            if not thai_name:
                thai_prefix_match = re.search(
                    r'(?:^|[\r\n\s])((?:[UuNnน]\.[aAส]\.?|นางสาว|นาย|นาง|ด\.ช\.|ด\.ญ\.|เด็กชาย|เด็กหญิง|คุณ)\s*[^\r\n|]+)',
                    page_text
                )
                if thai_prefix_match:
                    raw_th = thai_prefix_match.group(1).strip()
                    raw_th = re.sub(r'^[UuNnน]\.[aAส]\.?\s*', 'น.ส. ', raw_th)
                    raw_th = re.split(rf'\s+(?:{stop_keywords})[:\s]', raw_th, maxsplit=1, flags=re.IGNORECASE)[0].strip()
                    raw_th = re.sub(r'^[._\s:-]+|[._\s:-]+$', '', raw_th).strip()
                    if len(raw_th) >= 4 and not any(bad in raw_th for bad in ["โรงพยาบาล", "ยันฮี", "เวชระเบียน", "เอกสาร"]):
                        thai_name = raw_th

            # 3. Match English Name
            en_name = None
            en_match = re.search(
                r'(?:Name|Patient\s*Name)\s*[:.\s]*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})',
                page_text,
                re.IGNORECASE
            )
            if not en_match:
                en_line_match = re.search(r'(?:^|[\r\n])\s*:?\s*([A-Z]{3,20}\s+[A-Z]{3,20}(?:\s+[A-Z]{3,20})?)\s*(?:[\r\n]|$)', page_text)
                if en_line_match:
                    cand = en_line_match.group(1).strip()
                    if not any(b in cand for b in ['YANHEE', 'HOSPITAL', 'PERFECTION', 'BROTHER', 'VISIT SLIP', 'FOLLOW UP', 'MP RASH', 'DOCTOR']):
                        en_name = cand
            else:
                en_name = en_match.group(1).strip()

            if thai_name:
                extracted.name_th = thai_name
            if en_name:
                extracted.name_en = en_name

            # Set primary name to Thai if found, else English
            if not extracted.name:
                if thai_name:
                    extracted.name = thai_name
                elif en_name:
                    extracted.name = en_name

            # D) Extract Date of Birth (DOB) and Visit Date
            dob_thai_match = re.search(
                r'(?:วัน\s*เดือน\s*ปี\s*เกิด|Date\s*of\s*Birth|DOB|[Vv]?[/I]?[0-9]?[/I]?\s*เกิด|[Vv]/[0O]/[ปU]\s*เกี?ค?|เกิด)[\s\S]{0,40}?([0-9]{1,2})\s*([^\s]{2,8}?)\s*(25[0-9]{1,2}|19[0-9]{2}|20[0-9]{2})',
                page_text,
                re.IGNORECASE
            )
            if not dob_thai_match:
                dob_thai_match = re.search(
                    r'([0-9]{1,2})\s*([^\s]{2,8}?)\s*(25[0-9]{1,2}|19[0-9]{2}|20[0-9]{2})',
                    page_text
                )
            if dob_thai_match:
                d_day = int(dob_thai_match.group(1))
                raw_m = dob_thai_match.group(2)
                raw_y = dob_thai_match.group(3)
                norm_month = 'เม.ย.' if any(k in raw_m for k in ['เม', '0', '1', 'ย']) else raw_m
                norm_y = f"{raw_y}5" if len(raw_y) == 3 else raw_y
                extracted.dob = f"{d_day:02d} {norm_month} {norm_y}"

            # E) Extract Age (or compute from DOB)
            if not extracted.age:
                age_match = re.search(
                    r'(?:อายุ|Age|อา|อาย)\s*[:.\s]*([0-9]{1,3})\s*(?:ปี|ง|ขวบ|y|yr)?',
                    page_text,
                    re.IGNORECASE
                )
                if age_match:
                    extracted.age = f"{age_match.group(1)} ปี"
                elif extracted.dob:
                    # Calculate age from DOB year (BE or CE)
                    yr_match = re.search(r'\b(25[0-9]{2}|19[0-9]{2}|20[0-9]{2})\b', extracted.dob)
                    if yr_match:
                        y = int(yr_match.group(1))
                        current_year = datetime.now().year
                        birth_ce = (y - 543) if y > 2400 else y
                        calc_age = current_year - birth_ce
                        if 0 <= calc_age <= 120:
                            extracted.age = f"{calc_age} ปี"

            # E2) Extract Time of Visit from text (e.g. 16:30น., 16:30:00, 14:20 น.)
            if not extracted.visit_time:
                time_match = re.search(
                    r'(?:เวลา|Time|เมื่อ|at)?\s*([01]?[0-9]|2[0-3])[:.]([0-5][0-9])(?::([0-5][0-9]))?\s*(?:น\.|น\b|hrs?\b)',
                    page_text,
                    re.IGNORECASE
                )
                if time_match:
                    h = int(time_match.group(1))
                    m = int(time_match.group(2))
                    s = int(time_match.group(3)) if time_match.group(3) else 0
                    extracted.visit_time = f"{h:02d}:{m:02d}:{s:02d}"

            # F) Extract Document Code
            if not extracted.document_code:
                doc_code_match = re.search(
                    r'(?:รหัสแบบฟอร์ม|Doc\s*Code|รหัสเอกสาร|Form\s*No\.?|แบบฟอร์ม)\s*[:.\s]*([A-Za-z0-9_-]+)',
                    page_text,
                    re.IGNORECASE
                )
                if not doc_code_match:
                    doc_code_match = re.search(r'\b([A-Z]{2,4}-[A-Z0-9_-]{3,15})\b', page_text)
                if doc_code_match:
                    extracted.document_code = doc_code_match.group(1).strip()

            # G) Extract Document Title & Detect Category
            title_match = re.search(
                r'(?:แบบฟอร์มเวชระเบียน|แบบฟอร์ม|Title|Form)\s*[:.\s-]*([^\r\n]+)',
                page_text,
                re.IGNORECASE
            )
            if not title_match:
                title_match = re.search(
                    r'(หนังสือแสดงความยินยอม[^\r\n]+|Consent Form[^\r\n]+|ใบยินยอม[^\r\n]+|ประวัติการรักษา[^\r\n]+|เวชระเบียน[^\r\n]+|ใบสั่งยา[^\r\n]+|รายงานผลการตรวจ[^\r\n]+|ใบรับรองแพทย์[^\r\n]+|OPD Record[^\r\n]+|Visit Slip[^\r\n]*)',
                    page_text,
                    re.IGNORECASE
                )
            if title_match:
                extracted.title = title_match.group(1).strip()

            # Detect Category by keywords (combining OCR text, filename, and document code)
            text_lower = page_text.lower()
            fn_lower = (file.filename or "").lower()
            doc_code_upper = (extracted.document_code or "").upper()

            cat_code = None
            if "ยินยอม" in page_text or "consent" in text_lower or "consent" in fn_lower or "CONSENT" in doc_code_upper:
                cat_code = "CONSENT"
            elif "เวชระเบียน" in page_text or "ผู้ป่วยใหม่" in page_text or "registration" in text_lower or "reg" in fn_lower:
                cat_code = "REG"
            elif (
                "ประวัติการรักษา" in page_text
                or "opd record" in text_lower
                or "opd" in text_lower
                or "opd" in fn_lower
                or "clinical" in fn_lower
                or "operative" in fn_lower
                or "progress" in fn_lower
                or "soap" in text_lower
                or "ใบรับรองแพทย์" in page_text
                or "visit slip" in text_lower
                or "OPD" in doc_code_upper
                or "SURG" in doc_code_upper
                or "PROGRESS" in doc_code_upper
            ):
                cat_code = "MED_RECORD"
            elif "lab" in text_lower or "lab" in fn_lower or "ห้องปฏิบัติการ" in page_text or "LAB" in doc_code_upper:
                cat_code = "LAB"
            elif "x-ray" in text_lower or "xray" in text_lower or "xray" in fn_lower or "รังสี" in page_text or "XRAY" in doc_code_upper:
                cat_code = "XRAY"
            elif "ยา" in page_text or "pharmacy" in text_lower or "pharm" in fn_lower or "PHARM" in doc_code_upper:
                cat_code = "PHARMACY"
            elif "ทรัพย์สิน" in page_text or "property" in text_lower or "deposit" in fn_lower or "RT_COMMON" in doc_code_upper:
                cat_code = "PROPERTY"
            elif "ประกัน" in page_text or "สิทธิ" in page_text or "insurance" in text_lower:
                cat_code = "INSURANCE"
            elif "ใบเสร็จ" in page_text or "การเงิน" in page_text or "receipt" in text_lower or "finance" in fn_lower:
                cat_code = "FINANCE"

            if cat_code and not extracted.category_id:
                category = db.query(DocumentCategory).filter(DocumentCategory.code == cat_code).first()
                if category:
                    extracted.category_id = category.id
                    extracted.category_code = category.code
                    extracted.category_name = category.name_th

            # Fallback smart title if title is empty or generic
            if not extracted.title or extracted.title.startswith("scan_"):
                if extracted.document_code and "SUR-CONSENT" in extracted.document_code.upper():
                    extracted.title = "หนังสือแสดงความยินยอมรับการผ่าตัดและระงับความรู้สึก"
                elif extracted.category_name:
                    extracted.title = extracted.category_name
                elif file.filename:
                    extracted.title = os.path.splitext(file.filename)[0]

            # H) Extract Doctor Name
            if not extracted.doctor_name:
                # 1. Department comma doctor (e.g. อายุรกรรม , DOCTOR YANHEE , Cath Lab)
                doc_dept_match = re.search(
                    r'(?:อายุรกรรม|ศัลยกรรม|กุมาร|สูติ)[^,\n\r]*,\s*(DOCTOR\s+[A-Za-z]+|นพ\.[^\r\n,]+|พญ\.[^\r\n,]+)',
                    page_text,
                    re.IGNORECASE
                )
                if doc_dept_match:
                    extracted.doctor_name = doc_dept_match.group(1).strip()

                # 2. DOCTOR FIRSTNAME LASTNAME pattern
                if not extracted.doctor_name:
                    doc_upper_match = re.search(r'\b(DOCTOR\s+[A-Z]{3,20}(?:\s+[A-Z]{3,20})?)\b', page_text)
                    if doc_upper_match:
                        cand = doc_upper_match.group(1).strip()
                        if not any(b in cand for b in ["HOSPITAL", "CLINIC"]):
                            extracted.doctor_name = cand

                # 3. Standard prefixes: นพ., พญ., Dr., แพทย์
                if not extracted.doctor_name:
                    doc_match = re.search(
                        r'(?:แพทย์ผู้ตรวจ|แพทย์|Doctor|Dr\.?|นพ\.?|พญ\.?)\s*[:.\s]*([A-Za-z\u0E00-\u0E7F.]{2,25}(?:\s+[A-Za-z\u0E00-\u0E7F.]{2,25}){1,2})',
                        page_text,
                        re.IGNORECASE
                    )
                    if doc_match:
                        doc_val = doc_match.group(1).strip()
                        if not any(bad in doc_val for bad in ["เจ้าหน้าที่", "อธิบาย", "ทราบ", "พยาน", "ผู้ป่วย", "รับบริการ", "จัดเตรียม"]):
                            full_doc = doc_match.group(0).strip()
                            if "นพ." in full_doc and not doc_val.startswith("นพ."):
                                doc_val = f"นพ. {doc_val}"
                            elif "พญ." in full_doc and not doc_val.startswith("พญ."):
                                doc_val = f"พญ. {doc_val}"
                            elif "dr" in full_doc.lower() and not doc_val.lower().startswith("dr"):
                                doc_val = f"Dr. {doc_val}"
                            extracted.doctor_name = doc_val

        # 3. Database Patient & Encounter Enrichment (if HN or EN is found)
        if extracted.hn or extracted.en:
            clean_hn = (extracted.hn or "").strip()
            digits_only = re.sub(r'\D', '', clean_hn)
            patient = None
            if clean_hn:
                patient = db.query(Patient).filter(Patient.hn == clean_hn).first()
                if not patient and digits_only:
                    digits_clean = digits_only.lstrip('0') or '0'
                    all_patients = db.query(Patient).all()
                    for p in all_patients:
                        p_digits = re.sub(r'\D', '', p.hn or '').lstrip('0') or '0'
                        if p_digits == digits_clean:
                            patient = p
                            break

            # Encounter lookup / enrichment
            target_en = (extracted.en or "").strip()
            encounter = None
            if target_en:
                encounter = db.query(Encounter).filter(Encounter.en == target_en).first()
            if not encounter and (patient or clean_hn):
                target_hn = patient.hn if patient else clean_hn
                encounter = db.query(Encounter).filter(Encounter.hn == target_hn).order_by(desc(Encounter.visit_date)).first()
                if not encounter and digits_only:
                    digits_clean = digits_only.lstrip('0') or '0'
                    all_encs = db.query(Encounter).all()
                    for e in all_encs:
                        e_hn_digits = re.sub(r'\D', '', e.hn or '').lstrip('0') or '0'
                        if e_hn_digits == digits_clean:
                            encounter = e
                            break

            if encounter and not patient and encounter.hn:
                patient = db.query(Patient).filter(Patient.hn == encounter.hn).first()

            if patient:
                if patient.name_th:
                    extracted.name = patient.name_th
                    extracted.name_th = patient.name_th
                elif not extracted.name and patient.name_en:
                    extracted.name = patient.name_en
                if patient.name_en:
                    extracted.name_en = patient.name_en

                if patient.dob and not extracted.dob:
                    extracted.dob = str(patient.dob)
                if not extracted.age and patient.dob:
                    try:
                        today = datetime.now().date()
                        birth = patient.dob
                        years = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
                        if years > 0:
                            extracted.age = f"{years} ปี"
                    except Exception:
                        pass
                if not extracted.age and patient.age_display:
                    extracted.age = patient.age_display

            if encounter:
                if not extracted.en:
                    extracted.en = encounter.en
                if not extracted.visit_date and encounter.visit_date:
                    extracted.visit_date = str(encounter.visit_date)
                if not extracted.visit_time and encounter.visit_time:
                    extracted.visit_time = encounter.visit_time
                if not extracted.doctor_name and encounter.doctor_name:
                    extracted.doctor_name = encounter.doctor_name
                if not extracted.encounter_type and encounter.encounter_type:
                    extracted.encounter_type = encounter.encounter_type

        # Default title if still empty
        if not extracted.title and file.filename:
            extracted.title = os.path.splitext(file.filename)[0]

        return ExtractionResponse(
            status="success",
            mode_used=mode_used,
            confidence=confidence,
            data=extracted,
            raw_text_snippet=raw_text_snippet
        )

scan_service = ScanService()

