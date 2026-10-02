from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DocumentCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name_th: str
    name_en: str
    category_type: str
    icon: Optional[str] = None
    sort_order: int = 0


class DocumentPageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: str
    page_number: int
    page_label: Optional[str] = None
    file_name: str
    mime_type: str
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


class DocumentItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hn: str
    en: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    title: str
    document_code: Optional[str] = None
    doctor_code: Optional[str] = None
    doctor_name: Optional[str] = None
    is_doctor_document: bool = False
    scan_by_id: Optional[str] = None
    scan_by_name: Optional[str] = None
    scan_by_role: Optional[str] = "Staff"
    scan_date: Optional[datetime] = None
    total_pages: int = 1
    is_confidential: bool = False
    pages: List[DocumentPageResponse] = []


class DocumentTreeNode(BaseModel):
    id: str
    label: str
    type: str  # "date_group", "category_group", "caregiver_group", or "document"
    count: int = 0
    document_id: Optional[str] = None
    category_type: Optional[str] = None  # "Care Team" หรือ "Administration"
    date_str: Optional[str] = None
    doctor_name: Optional[str] = None
    is_doctor_document: Optional[bool] = False
    scan_by_role: Optional[str] = None
    children: List["DocumentTreeNode"] = []


class DocumentTreeResponse(BaseModel):
    group_by: str
    category_type: str
    total_documents: int
    nodes: List[DocumentTreeNode]
