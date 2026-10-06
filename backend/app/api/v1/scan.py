from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.schemas.scan import (
    DocumentCategoryOption,
    DocumentCategoryCreate,
    EncounterOption,
    DocumentUploadResponse,
    BarcodeDetectionResult,
    ExtractionResponse,
    PatientLookupResult,
    VendorUploadResponse
)
from app.services.scan_service import scan_service

router = APIRouter(prefix="/scan", tags=["Scan & Upload"])

def verify_vendor_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    if not x_api_key:
        raise HTTPException(
            status_code=401, 
            detail="Header 'X-API-Key' is missing. External vendor authentication required."
        )
    valid_key = settings.VENDOR_API_KEY
    if x_api_key.strip() != valid_key.strip():
        raise HTTPException(
            status_code=401, 
            detail="Invalid API Key. Unauthorized vendor access denied."
        )
    return x_api_key

@router.get("/categories", response_model=List[DocumentCategoryOption])
def get_categories(db: Session = Depends(get_db)):
    return scan_service.get_all_categories(db)

@router.post("/categories", response_model=DocumentCategoryOption)
def create_category(data: DocumentCategoryCreate, db: Session = Depends(get_db)):
    return scan_service.create_category(db, data)

@router.get("/patient-lookup", response_model=PatientLookupResult)
def lookup_patient(query: str, db: Session = Depends(get_db)):
    return scan_service.lookup_patient_or_encounter(db, query)

@router.get("/encounters/{hn}", response_model=List[EncounterOption])
def get_encounters(hn: str, db: Session = Depends(get_db)):
    return scan_service.get_encounters_by_hn(db, hn)

@router.post("/extract-metadata", response_model=ExtractionResponse)
def extract_metadata(
    file: UploadFile = File(...),
    mode: str = Form("auto"),
    db: Session = Depends(get_db)
):
    return scan_service.extract_document_metadata(db=db, file=file, mode=mode)

@router.post("/upload", response_model=DocumentUploadResponse)
def upload_document(
    file: UploadFile = File(...),
    hn: str = Form(...),
    title: str = Form(...),
    category_id: int = Form(...),
    en: Optional[str] = Form(None),
    document_code: Optional[str] = Form(None),
    doctor_code: Optional[str] = Form(None),
    doctor_name: Optional[str] = Form(None),
    encounter_type: Optional[str] = Form(None),
    is_doctor_document: bool = Form(False),
    is_confidential: bool = Form(False),
    patient_name: Optional[str] = Form(None),
    age: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    visit_date: Optional[str] = Form(None),
    visit_time: Optional[str] = Form(None),
    scan_by_id: Optional[str] = Form(None),
    scan_by_name: Optional[str] = Form(None),
    scan_by_role: Optional[str] = Form("Staff"),
    db: Session = Depends(get_db)
):
    return scan_service.upload_document(
        db=db, file=file, hn=hn, title=title, category_id=category_id, 
        en=en, document_code=document_code, doctor_code=doctor_code, 
        doctor_name=doctor_name, encounter_type=encounter_type, 
        is_doctor_document=is_doctor_document, is_confidential=is_confidential, 
        scan_by_id=scan_by_id, scan_by_name=scan_by_name, scan_by_role=scan_by_role,
        patient_name=patient_name, age=age, dob=dob, visit_date=visit_date,
        visit_time=visit_time
    )

@router.post("/upload-page/{document_id}", response_model=DocumentUploadResponse)
def upload_page(
    document_id: str,
    file: UploadFile = File(...),
    page_label: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    return scan_service.add_page_to_document(db, document_id, file, page_label)

@router.post("/detect-barcode", response_model=List[BarcodeDetectionResult])
def detect_barcode(file: UploadFile = File(...)):
    return scan_service.detect_barcodes(file)

@router.post("/vendor-upload", response_model=VendorUploadResponse)
def vendor_upload(
    request: Request,
    file: UploadFile = File(...),
    vendor_code: str = Form(...),
    vendor_name: str = Form(...),
    hn: str = Form(...),
    title: str = Form(...),
    category_code: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    en: Optional[str] = Form(None),
    document_code: Optional[str] = Form(None),
    doctor_code: Optional[str] = Form(None),
    doctor_name: Optional[str] = Form(None),
    encounter_type: Optional[str] = Form("OPD"),
    patient_name: Optional[str] = Form(None),
    age: Optional[str] = Form(None),
    dob: Optional[str] = Form(None),
    visit_date: Optional[str] = Form(None),
    external_reference_id: Optional[str] = Form(None),
    api_key: str = Depends(verify_vendor_api_key),
    db: Session = Depends(get_db)
):
    client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else "unknown")
    user_agent = request.headers.get("user-agent")
    
    return scan_service.vendor_upload_document(
        db=db,
        file=file,
        vendor_code=vendor_code,
        vendor_name=vendor_name,
        hn=hn,
        title=title,
        category_code=category_code,
        category_id=category_id,
        en=en,
        document_code=document_code,
        doctor_code=doctor_code,
        doctor_name=doctor_name,
        encounter_type=encounter_type,
        patient_name=patient_name,
        age=age,
        dob=dob,
        visit_date=visit_date,
        external_reference_id=external_reference_id,
        client_ip=client_ip,
        user_agent=user_agent
    )

