from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class DocumentCategoryCreate(BaseModel):
    name_th: str
    name_en: Optional[str] = None
    code: Optional[str] = None
    category_type: Optional[str] = "Care Team"

class DocumentCategoryOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name_th: str
    name_en: str
    category_type: str

class EncounterOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    en: str
    visit_date: str
    visit_time: Optional[str] = None
    encounter_type: str
    doctor_name: Optional[str] = None
    department_name: Optional[str] = None

class PatientLookupResult(BaseModel):
    found: bool
    hn: Optional[str] = None
    name_th: Optional[str] = None
    name_en: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    age: Optional[str] = None
    en: Optional[str] = None
    visit_date: Optional[str] = None
    visit_time: Optional[str] = None
    encounter_type: Optional[str] = None
    department_name: Optional[str] = None
    doctor_name: Optional[str] = None
    message: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    status: str
    document_id: str
    title: str
    total_pages: int
    message: str

class VendorUploadResponse(BaseModel):
    status: str
    document_id: str
    title: str
    hn: str
    en: Optional[str] = None
    total_pages: int
    vendor_name: str
    reference_id: Optional[str] = None
    file_checksum_sha256: Optional[str] = None
    message: str

class BarcodeDetectionResult(BaseModel):
    text: str
    format: str

class ExtractedMetadata(BaseModel):
    hn: Optional[str] = None
    en: Optional[str] = None
    name: Optional[str] = None
    name_th: Optional[str] = None
    name_en: Optional[str] = None
    age: Optional[str] = None
    dob: Optional[str] = None
    visit_date: Optional[str] = None
    visit_time: Optional[str] = None
    title: Optional[str] = None
    category_id: Optional[int] = None
    category_code: Optional[str] = None
    category_name: Optional[str] = None
    document_code: Optional[str] = None
    doctor_name: Optional[str] = None
    encounter_type: Optional[str] = None
    raw_barcodes: List[BarcodeDetectionResult] = []

class ExtractionResponse(BaseModel):
    status: str
    mode_used: str  # 'barcode' | 'pdf_text' | 'ocr' | 'hybrid'
    confidence: float
    data: ExtractedMetadata
    raw_text_snippet: Optional[str] = None

