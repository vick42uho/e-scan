from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.document import Document, DocumentCategory, DocumentPage
from app.models.patient import Encounter
from app.schemas.document import (
    DocumentItemResponse,
    DocumentPageResponse,
    DocumentTreeNode,
    DocumentTreeResponse
)

class DocumentService:
    @staticmethod
    def get_document_by_id(db: Session, document_id: str) -> Optional[DocumentItemResponse]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return None
        
        pages_resp = [
            DocumentPageResponse(
                id=p.id,
                document_id=p.document_id,
                page_number=p.page_number,
                page_label=p.page_label,
                file_name=p.file_name,
                mime_type=p.mime_type,
                file_size=p.file_size,
                width=p.width,
                height=p.height,
                file_url=f"/api/v1/documents/{doc.id}/pages/{p.page_number}/file",
                thumbnail_url=f"/api/v1/documents/{doc.id}/pages/{p.page_number}/thumbnail"
            )
            for p in doc.pages
        ]

        return DocumentItemResponse(
            id=doc.id,
            hn=doc.hn,
            en=doc.en,
            category_id=doc.category_id,
            category_name=doc.category.name_th if doc.category else None,
            title=doc.title,
            document_code=doc.document_code,
            doctor_code=doc.doctor_code,
            doctor_name=doc.doctor_name,
            is_doctor_document=doc.is_doctor_document or False,
            scan_by_id=doc.scan_by_id,
            scan_by_name=doc.scan_by_name,
            scan_by_role=doc.scan_by_role or "Staff",
            scan_date=doc.scan_date,
            total_pages=doc.total_pages,
            is_confidential=doc.is_confidential,
            pages=pages_resp
        )

    @staticmethod
    def get_document_tree(
        db: Session,
        hn: str,
        group_by: str = "visit_date",
        category_type: str = "all",
        query: Optional[str] = None,
        doctor_code: Optional[str] = None
    ) -> DocumentTreeResponse:
        """
        สร้างโครงสร้าง Tree View ตาม HN
        - group_by: 'visit_date' | 'category' | 'caregiver'
        - category_type: 'doctor' | 'non_doctor' | 'care_team' | 'admin' | 'all'
        - query: ค้นหาชื่อเอกสาร หรือคีย์เวิร์ดในชาร์ตคนไข้นี้
        - doctor_code: กรองเฉพาะเอกสารของหมอท่านนี้ (เมื่อหมอ Login)
        """
        db_query = (
            db.query(Document)
            .join(DocumentCategory, Document.category_id == DocumentCategory.id)
            .outerjoin(Encounter, Document.en == Encounter.en)
            .filter(Document.hn == hn)
        )

        # 1. Filter by Category Type / Doctor vs Non Doctor
        cat_lower = category_type.lower()
        if cat_lower in ["doctor", "doc"]:
            db_query = db_query.filter(Document.is_doctor_document == True)
        elif cat_lower in ["non_doctor", "non-doctor", "nondoctor"]:
            db_query = db_query.filter(Document.is_doctor_document == False)
        elif cat_lower in ["care_team", "care team"]:
            db_query = db_query.filter(DocumentCategory.category_type == "Care Team")
        elif cat_lower in ["administration", "admin"]:
            db_query = db_query.filter(DocumentCategory.category_type == "Administration")

        # 2. Filter by Doctor Code (My Documents)
        if doctor_code:
            db_query = db_query.filter(Document.doctor_code == doctor_code)

        # 3. Filter by Search Query (In-chart Document Search)
        if query and query.strip():
            pat = f"%{query.strip()}%"
            db_query = db_query.filter(
                or_(
                    Document.title.ilike(pat),
                    Document.document_code.ilike(pat),
                    Document.doctor_name.ilike(pat),
                    Document.scan_by_name.ilike(pat),
                    DocumentCategory.name_th.ilike(pat)
                )
            )

        docs = db_query.order_by(Document.scan_date.desc()).all()
        nodes: List[DocumentTreeNode] = []

        # -------------------------------------------------------------
        # Mode 1: Group by Visit Date
        # -------------------------------------------------------------
        if group_by == "visit_date":
            date_groups: Dict[str, List[Document]] = {}
            for doc in docs:
                date_key = doc.scan_date.strftime("%d-%m-%Y") if doc.scan_date else "ไม่ระบุวันที่"
                date_groups.setdefault(date_key, []).append(doc)

            for d_str, doc_list in date_groups.items():
                child_nodes = [
                    DocumentTreeNode(
                        id=f"doc_{d.id}",
                        label=d.title,
                        type="document",
                        count=d.total_pages,
                        document_id=d.id,
                        category_type=d.category.category_type if d.category else None,
                        date_str=d_str,
                        doctor_name=d.doctor_name,
                        is_doctor_document=d.is_doctor_document,
                        scan_by_role=d.scan_by_role
                    )
                    for d in doc_list
                ]
                nodes.append(
                    DocumentTreeNode(
                        id=f"group_date_{d_str}",
                        label=d_str,
                        type="date_group",
                        count=len(doc_list),
                        date_str=d_str,
                        children=child_nodes
                    )
                )

        # -------------------------------------------------------------
        # Mode 2: Group by Caregiver (Doctor / Nurse / Staff) -> Subgroup by Visit Date!
        # -------------------------------------------------------------
        elif group_by == "caregiver":
            # Level 1: Caregiver Name
            care_groups: Dict[str, Dict[str, List[Document]]] = {}
            for doc in docs:
                giver_name = doc.doctor_name or doc.scan_by_name or "ไม่ระบุผู้ตรวจ"
                date_key = doc.scan_date.strftime("%d-%m-%Y") if doc.scan_date else "ไม่ระบุวันที่"
                care_groups.setdefault(giver_name, {}).setdefault(date_key, []).append(doc)

            for giver_name, dates_dict in care_groups.items():
                date_subnodes = []
                total_giver_docs = 0

                for d_str, doc_list in dates_dict.items():
                    total_giver_docs += len(doc_list)
                    doc_subnodes = [
                        DocumentTreeNode(
                            id=f"doc_{d.id}",
                            label=d.title,
                            type="document",
                            count=d.total_pages,
                            document_id=d.id,
                            category_type=d.category.category_type if d.category else None,
                            date_str=d_str,
                            doctor_name=d.doctor_name,
                            is_doctor_document=d.is_doctor_document,
                            scan_by_role=d.scan_by_role
                        )
                        for d in doc_list
                    ]
                    date_subnodes.append(
                        DocumentTreeNode(
                            id=f"care_{giver_name}_{d_str}",
                            label=f"Visit: {d_str}",
                            type="date_group",
                            count=len(doc_list),
                            date_str=d_str,
                            children=doc_subnodes
                        )
                    )

                nodes.append(
                    DocumentTreeNode(
                        id=f"caregiver_{giver_name}",
                        label=giver_name,
                        type="caregiver_group",
                        count=total_giver_docs,
                        children=date_subnodes
                    )
                )

        # -------------------------------------------------------------
        # Mode 3: Group by Category -> Subgroup by Visit Date!
        # -------------------------------------------------------------
        elif group_by == "category":
            cat_groups: Dict[str, Dict[str, List[Document]]] = {}
            for doc in docs:
                cat_name = doc.category.name_th if doc.category else "ทั่วไป"
                date_key = doc.scan_date.strftime("%d-%m-%Y") if doc.scan_date else "ไม่ระบุวันที่"
                cat_groups.setdefault(cat_name, {}).setdefault(date_key, []).append(doc)

            for cat_name, dates_dict in cat_groups.items():
                date_subnodes = []
                total_cat_docs = 0

                for d_str, doc_list in dates_dict.items():
                    total_cat_docs += len(doc_list)
                    doc_subnodes = [
                        DocumentTreeNode(
                            id=f"doc_{d.id}",
                            label=d.title,
                            type="document",
                            count=d.total_pages,
                            document_id=d.id,
                            category_type=d.category.category_type if d.category else None,
                            date_str=d_str,
                            doctor_name=d.doctor_name,
                            is_doctor_document=d.is_doctor_document,
                            scan_by_role=d.scan_by_role
                        )
                        for d in doc_list
                    ]
                    date_subnodes.append(
                        DocumentTreeNode(
                            id=f"cat_{cat_name}_{d_str}",
                            label=f"Visit: {d_str}",
                            type="date_group",
                            count=len(doc_list),
                            date_str=d_str,
                            children=doc_subnodes
                        )
                    )

                nodes.append(
                    DocumentTreeNode(
                        id=f"cat_{cat_name}",
                        label=cat_name,
                        type="category_group",
                        count=total_cat_docs,
                        children=date_subnodes
                    )
                )

        return DocumentTreeResponse(
            group_by=group_by,
            category_type=category_type,
            total_documents=len(docs),
            nodes=nodes
        )

document_service = DocumentService()
