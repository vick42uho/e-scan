import os
import shutil
import sys
from pathlib import Path
from datetime import date, datetime
from PIL import Image
import pymupdf

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.core.config import settings
from app.models.patient import Patient, Encounter
from app.models.document import DocumentCategory, Document, DocumentPage
from scripts.generate_medical_docs import generate_all

SAMPLE_DIR = backend_dir.parent / "ตัวอย่าง"

def seed_data():
    db = SessionLocal()
    try:
        print("=== Step 1: Generating & Preparing Authentic Medical Document Assets ===")
        settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        settings.THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
        
        # 1. Generate clean A4 medical documents (OPD, OR Note, Lab, X-Ray, Consent, Progress Note, etc.)
        generate_all()

        # 2. Copy and map original sample files from ตัวอย่าง for other patients
        sample_copies = [
            ("Document View on web.jpg", "doc_suphapong_consent.jpg"),
            ("2026-10-01_13-56-54_0.png", "doc_jiraporn_medcert.png"),
            ("1356651_0.jpg", "doc_nattaporn_reg.jpg"),
            ("วิธี scan edscare.jpg", "doc_weeritphol_pedsurg.jpg")
        ]
        for src_name, dest_name in sample_copies:
            src_path = SAMPLE_DIR / src_name
            dest_path = settings.STORAGE_DIR / dest_name
            if src_path.exists():
                shutil.copy2(src_path, dest_path)
                print(f"Copied sample: {src_name} -> {dest_name}")

        print("\n=== Step 2: Seeding Clean Document Categories ===")
        categories_data = [
            # Care Team
            {"id": 1, "code": "REG", "name_th": "เวชระเบียนผู้ป่วยใหม่ / ทั่วไป", "name_en": "Patient Registration Form", "category_type": "Care Team", "sort_order": 1},
            {"id": 2, "code": "CONSENT", "name_th": "หนังสือแสดงความยินยอมการรักษา", "name_en": "Consent for Surgery & Procedures", "category_type": "Care Team", "sort_order": 2},
            {"id": 3, "code": "MED_RECORD", "name_th": "ประวัติการรักษา / OPD Record", "name_en": "Medical History & OPD Record", "category_type": "Care Team", "sort_order": 3},
            {"id": 4, "code": "LAB", "name_th": "ผลตรวจทางห้องปฏิบัติการ (Lab)", "name_en": "Laboratory Reports", "category_type": "Care Team", "sort_order": 4},
            {"id": 5, "code": "XRAY", "name_th": "เอกซเรย์และภาพวินิจฉัย (X-Ray)", "name_en": "Radiology & Imaging Reports", "category_type": "Care Team", "sort_order": 5},
            {"id": 6, "code": "PHARMACY", "name_th": "ใบสั่งยาและรายงานคืนยา", "name_en": "Dispense & Pharmacy Return", "category_type": "Care Team", "sort_order": 6},
            # Administration
            {"id": 7, "code": "PROPERTY", "name_th": "ใบรับฝากทรัพย์สินผู้ป่วย", "name_en": "Patient Property Deposit Form", "category_type": "Administration", "sort_order": 7},
            {"id": 8, "code": "INSURANCE", "name_th": "เอกสารสิทธิการรักษา / ประกันสุขภาพ", "name_en": "Insurance & Billing Claim", "category_type": "Administration", "sort_order": 8},
            {"id": 9, "code": "FINANCE", "name_th": "ใบเสร็จรับเงินและการเงิน", "name_en": "Receipt & Finance Deposit", "category_type": "Administration", "sort_order": 9},
        ]

        for cat in categories_data:
            existing = db.query(DocumentCategory).filter(DocumentCategory.id == cat["id"]).first()
            if not existing:
                db.add(DocumentCategory(**cat))
            else:
                for k, v in cat.items():
                    setattr(existing, k, v)
        db.commit()

        print("\n=== Step 3: Clearing Old / Corrupted Database Records ===")
        db.query(DocumentPage).delete()
        db.query(Document).delete()
        db.query(Encounter).delete()
        db.query(Patient).delete()
        db.commit()

        print("\n=== Step 4: Seeding Realistic Patients ===")
        patients_data = [
            # Patient 1: Primary Demo Patient (Mr. Somchai Deejai)
            {
                "hn": "08-24-00030",
                "name_th": "นาย สมชาย ดีใจ",
                "name_en": "Mr. Somchai Deejai",
                "dob": date(1975, 5, 12),
                "gender": "ชาย",
                "age_display": "48Y 9M 16D",
                "id_card": "1-5062-97167-50-1",
                "allergies": "ไม่มีประวัติแพ้ยา (NKDA)",
                "rights": "บุคคลทั่วไป (ชำระเงินเอง) / CASH AA OPD",
                "photo_url": None
            },
            # Patient 2: Mr. Suphapong Phaonak (from Document View on web)
            {
                "hn": "08-20-800151",
                "name_th": "นาย ศุภพงศ์ เผ่านาค",
                "name_en": "Mr. Suphapong Phaonak",
                "dob": date(1991, 8, 2),
                "gender": "ชาย",
                "age_display": "32Y 8M 0D",
                "id_card": "1-7434-21811-98-7",
                "allergies": "BIAPENAM (ประสาทหลอน / Deluded)",
                "rights": "บุคคลทั่วไป (ชำระเงินเอง) / CASH",
                "photo_url": None
            },
            # Patient 3: Miss Jiraporn Samranphan (from Arcus Air EMR OPD Record)
            {
                "hn": "08-18-018351",
                "name_th": "นางสาว จิราพร สำราญพันธ์",
                "name_en": "Miss Jiraporn Samranphan",
                "dob": date(1987, 3, 23),
                "gender": "หญิง",
                "age_display": "37Y 0M 10D",
                "id_card": "3-1005-02491-88-2",
                "allergies": "ไม่มีประวัติแพ้ยา (NKDA)",
                "rights": "บุคคลทั่วไป (ชำระเงินสดหรือบัตรเครดิต) / CASH AA 10% OPD",
                "photo_url": None
            },
            # Patient 4: Miss Nattaporn Srirungruang (from EDSCare Registration)
            {
                "hn": "08-20-800150",
                "name_th": "นางสาว ณัฐพร ศรีรุ่งเรือง",
                "name_en": "Miss Nattaporn Srirungruang",
                "dob": date(1994, 2, 15),
                "gender": "หญิง",
                "age_display": "30Y 2M 15D",
                "id_card": "1-1002-00561-23-4",
                "allergies": "PENICILLIN (ผื่นคัน / Skin Rash)",
                "rights": "ประกันสุขภาพ บมจ.เอไอเอ (AIA OPD Direct Claim)",
                "photo_url": None
            },
            # Patient 5: Master Weeritphol Patibat (Pediatric Surgery)
            {
                "hn": "08-07-000914",
                "name_th": "เด็กชาย วีริทธิ์พล ปฏิบัติ",
                "name_en": "Master Weeritphol Patibat",
                "dob": date(2011, 1, 27),
                "gender": "ชาย",
                "age_display": "13Y 2M 5D",
                "id_card": "1-1037-01992-44-1",
                "allergies": "ไม่มีประวัติแพ้ยา (NKDA)",
                "rights": "ไทยประกันชีวิต จำกัด (มหาชน) (TLC) / IPD",
                "photo_url": None
            }
        ]

        for p_dict in patients_data:
            db.add(Patient(**p_dict))
        db.commit()

        print("\n=== Step 5: Seeding Hospital Encounters (Visits) ===")
        encounters_data = [
            # Patient 1 Encounters
            Encounter(
                en="08-24-110023",
                hn="08-24-00030",
                visit_date=date(2020, 2, 28),
                visit_time="09:15:00",
                department_code="08OPD_MED",
                department_name="อายุรกรรมทั่วไป (Internal Medicine OPD)",
                doctor_code="YH00412",
                doctor_name="นพ. สุทธิพงษ์ วิริยะสกุล",
                encounter_type="OPD",
                status="Completed"
            ),
            Encounter(
                en="08-23-098124",
                hn="08-24-00030",
                visit_date=date(2019, 11, 15),
                visit_time="13:30:00",
                department_code="08SUR",
                department_name="ศัลยกรรม (Surgery Unit)",
                doctor_code="YH00355",
                doctor_name="นพ. สุรชัย พัฒนากูล",
                encounter_type="IPD",
                status="Completed"
            ),
            Encounter(
                en="08-23-054190",
                hn="08-24-00030",
                visit_date=date(2019, 6, 24),
                visit_time="10:00:00",
                department_code="08HPC",
                department_name="ศูนย์ตรวจสุขภาพ (Health Promotion Center)",
                doctor_code="YH00921",
                doctor_name="พญ. น้ำมณี มณีนิล",
                encounter_type="OPD",
                status="Completed"
            ),
            Encounter(
                en="08-22-120045",
                hn="08-24-00030",
                visit_date=date(2018, 12, 18),
                visit_time="11:45:00",
                department_code="08OPD_MED",
                department_name="อายุรกรรมทั่วไป (Internal Medicine OPD)",
                doctor_code="YH00412",
                doctor_name="นพ. สุทธิพงษ์ วิริยะสกุล",
                encounter_type="OPD",
                status="Completed"
            ),
            Encounter(
                en="08-22-088712",
                hn="08-24-00030",
                visit_date=date(2018, 8, 10),
                visit_time="14:20:00",
                department_code="08ADM",
                department_name="การเงินและธุรการ (Billing & Admin)",
                doctor_code=None,
                doctor_name=None,
                encounter_type="OPD",
                status="Completed"
            ),

            # Patient 2 Encounter
            Encounter(
                en="08-20-800612",
                hn="08-20-800151",
                visit_date=date(2020, 2, 28),
                visit_time="12:53:20",
                department_code="08OPD_MED",
                department_name="อายุรกรรมทั่วไป (Medicine Unit)",
                doctor_code="YH00412",
                doctor_name="นพ. สุทธิพงษ์ วิริยะสกุล",
                encounter_type="OPD",
                status="Completed"
            ),

            # Patient 3 Encounter
            Encounter(
                en="08-19-122932",
                hn="08-18-018351",
                visit_date=date(2019, 6, 24),
                visit_time="09:23:00",
                department_code="08HPC",
                department_name="ศูนย์ตรวจสุขภาพ (Health Promotion Center)",
                doctor_code="YH00921",
                doctor_name="พญ. น้ำมณี มณีนิล",
                encounter_type="OPD",
                status="Completed"
            ),

            # Patient 4 Encounter
            Encounter(
                en="08-20-800611",
                hn="08-20-800150",
                visit_date=date(2020, 2, 28),
                visit_time="12:19:21",
                department_code="08OPD_MED",
                department_name="อายุรกรรมทั่วไป (Medicine Unit)",
                doctor_code="YH00412",
                doctor_name="นพ. สุทธิพงษ์ วิริยะสกุล",
                encounter_type="OPD",
                status="Completed"
            ),

            # Patient 5 Encounter
            Encounter(
                en="08-20-114808",
                hn="08-07-000914",
                visit_date=date(2020, 2, 20),
                visit_time="14:10:00",
                department_code="08SUR",
                department_name="ศัลยกรรม (Surgery Unit)",
                doctor_code="YH00355",
                doctor_name="นพ. สุรชัย พัฒนากูล",
                encounter_type="OPD",
                status="Completed"
            )
        ]
        for enc in encounters_data:
            db.add(enc)
        db.commit()

        print("\n=== Step 6: Seeding Authentic Medical Documents & Pages ===")
        docs_to_create = [
            # =========================================================
            # Patient 1: นาย สมชาย ดีใจ (HN: 08-24-00030)
            # =========================================================
            # Visit 1: 28-02-2020 (OPD Internal Medicine)
            {
                "id": "doc-082400030-001",
                "hn": "08-24-00030",
                "en": "08-24-110023",
                "category_id": 1, # REG
                "title": "Patient Registration Form - ใบขึ้นทะเบียนประวัติเวชระเบียนผู้ป่วยใหม่ (2 หน้า)",
                "document_code": "REG-2020-001",
                "doctor_code": None,
                "doctor_name": None,
                "is_doctor_document": False,
                "scan_by_id": "YH1005",
                "scan_by_name": "Yanhee Staff (ID: YH1005)",
                "scan_by_role": "Staff",
                "scan_date": datetime(2020, 2, 28, 9, 30, 15),
                "total_pages": 2,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: ข้อมูลประวัติผู้ป่วย", "file": "doc_p1_reg_page1.png", "mime": "image/png"},
                    {"num": 2, "label": "หน้า 2: สำเนาบัตรประชาชน", "file": "doc_p1_reg_page2.png", "mime": "image/png"},
                ]
            },
            {
                "id": "doc-082400030-002",
                "hn": "08-24-00030",
                "en": "08-24-110023",
                "category_id": 2, # CONSENT
                "title": "Consent for Surgery & Procedures - หนังสือแสดงความยินยอมรับการตรวจรักษาและทำหัตถการ",
                "document_code": "SUR-CONSENT-01",
                "doctor_code": "YH00412",
                "doctor_name": "นพ. สุทธิพงษ์ วิริยะสกุล",
                "is_doctor_document": False,
                "scan_by_id": "NURSE-04",
                "scan_by_name": "พว. วราภรณ์ แสนดี (พยาบาล OPD)",
                "scan_by_role": "Nurse",
                "scan_date": datetime(2020, 2, 28, 10, 15, 0),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: หนังสือยินยอมการรักษา", "file": "doc_consent_surgery.png", "mime": "image/png"},
                ]
            },
            {
                "id": "doc-082400030-003",
                "hn": "08-24-00030",
                "en": "08-24-110023",
                "category_id": 3, # MED_RECORD
                "title": "Doctor's Clinical Record & Physical Exam - บันทึกการตรวจรักษาของแพทย์",
                "document_code": "OPD-MED-01",
                "doctor_code": "YH00412",
                "doctor_name": "นพ. สุทธิพงษ์ วิริยะสกุล",
                "is_doctor_document": True,
                "scan_by_id": "YH00412",
                "scan_by_name": "นพ. สุทธิพงษ์ วิริยะสกุล (แพทย์ผู้ตรวจ)",
                "scan_by_role": "Doctor",
                "scan_date": datetime(2020, 2, 28, 10, 45, 0),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: Clinical Record & PE", "file": "doc_opd_clinical_chart.png", "mime": "image/png"},
                ]
            },

            # Visit 2: 15-11-2019 (Surgery Unit)
            {
                "id": "doc-082400030-004",
                "hn": "08-24-00030",
                "en": "08-23-098124",
                "category_id": 3, # MED_RECORD
                "title": "Operative Note & Surgical Record - บันทึกการผ่าตัดศัลยกรรม (ไส้ติ่งผ่านกล้อง)",
                "document_code": "SURG-NOTE-01",
                "doctor_code": "YH00355",
                "doctor_name": "นพ. สุรชัย พัฒนากูล",
                "is_doctor_document": True,
                "scan_by_id": "NURSE_OR",
                "scan_by_name": "พว. ศิริพร หวานสนิท (พยาบาลห้องผ่าตัด)",
                "scan_by_role": "Nurse",
                "scan_date": datetime(2019, 11, 15, 15, 30, 0),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: บันทึกการผ่าตัด OR Note", "file": "doc_operative_note.png", "mime": "image/png"},
                ]
            },
            {
                "id": "doc-082400030-005",
                "hn": "08-24-00030",
                "en": "08-23-098124",
                "category_id": 3, # MED_RECORD
                "title": "Clinical Quality Committee Report - รายงานคณะกรรมการพัฒนาคุณภาพทางคลินิก (3 หน้า - PDF)",
                "document_code": "QA_CLINICAL_03",
                "doctor_code": "YH00355",
                "doctor_name": "นพ. สุรชัย พัฒนากูล",
                "is_doctor_document": True,
                "scan_by_id": "QA_STAFF",
                "scan_by_name": "เจ้าหน้าที่ศูนย์พัฒนาคุณภาพ รพ.ยันฮี",
                "scan_by_role": "Staff",
                "scan_date": datetime(2019, 11, 15, 16, 0, 0),
                "total_pages": 3,
                "is_confidential": True,
                "pages": [
                    {"num": 1, "label": "หน้า 1: ประธานระบบคุณภาพ รพ.ยันฮี (PDF)", "file": "doc-03.pdf", "mime": "application/pdf"},
                    {"num": 2, "label": "หน้า 2: นำทางคลินิกและปรับเปลี่ยน (PDF)", "file": "doc-03.pdf", "mime": "application/pdf"},
                    {"num": 3, "label": "หน้า 3: คณะกรรมการแพทย์ รพ.ยันฮี (PDF)", "file": "doc-03.pdf", "mime": "application/pdf"},
                ]
            },

            # Visit 3: 24-06-2019 (Health Promotion Center - Lab & X-Ray)
            {
                "id": "doc-082400030-006",
                "hn": "08-24-00030",
                "en": "08-23-054190",
                "category_id": 4, # LAB
                "title": "Clinical Laboratory Report (CBC & Chemistry) - ใบรายงานผลการตรวจทางห้องปฏิบัติการ",
                "document_code": "LAB-2019-06",
                "doctor_code": "YH00921",
                "doctor_name": "พญ. น้ำมณี มณีนิล",
                "is_doctor_document": True,
                "scan_by_id": "LAB_TECH",
                "scan_by_name": "ทนพ. พิเชษฐ์ ศรีวิชัย (นักเทคนิคการแพทย์)",
                "scan_by_role": "Staff",
                "scan_date": datetime(2019, 6, 24, 11, 15, 0),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: ผลตรวจ CBC & Chemistry", "file": "doc_lab_report.png", "mime": "image/png"},
                ]
            },
            {
                "id": "doc-082400030-007",
                "hn": "08-24-00030",
                "en": "08-23-054190",
                "category_id": 5, # XRAY
                "title": "Chest X-Ray Digital PA Examination - รายงานผลเอกซเรย์ทรวงอกดิจิทัล",
                "document_code": "XRAY-CHEST-01",
                "doctor_code": "YH00921",
                "doctor_name": "พญ. น้ำมณี มณีนิล",
                "is_doctor_document": True,
                "scan_by_id": "XRAY_TECH",
                "scan_by_name": "รังสีเทคนิค รพ.ยันฮี",
                "scan_by_role": "Staff",
                "scan_date": datetime(2019, 6, 24, 11, 45, 0),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: ผลเอกซเรย์ปอด Chest PA", "file": "doc_xray_chest.png", "mime": "image/png"},
                ]
            },

            # Visit 4: 18-12-2018 (Internal Medicine Follow-up)
            {
                "id": "doc-082400030-008",
                "hn": "08-24-00030",
                "en": "08-22-120045",
                "category_id": 3, # MED_RECORD
                "title": "Follow-up Clinical Progress Note - บันทึกการติดตามอาการผู้ป่วยนอก (SOAP Note)",
                "document_code": "PROGRESS-NOTE-18",
                "doctor_code": "YH00412",
                "doctor_name": "นพ. สุทธิพงษ์ วิริยะสกุล",
                "is_doctor_document": True,
                "scan_by_id": "NURSE-04",
                "scan_by_name": "พว. วราภรณ์ แสนดี (พยาบาล OPD)",
                "scan_by_role": "Nurse",
                "scan_date": datetime(2018, 12, 18, 12, 0, 0),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: บันทึกติดตามอาการ SOAP", "file": "doc_progress_note.png", "mime": "image/png"},
                ]
            },
            {
                "id": "doc-082400030-009",
                "hn": "08-24-00030",
                "en": "08-22-120045",
                "category_id": 6, # PHARMACY
                "title": "Pharmacy Prescription & Dispensing Record - ใบสั่งยาและบันทึกการส่งมอบยา",
                "document_code": "PHARM-DISP-01",
                "doctor_code": "YH00412",
                "doctor_name": "นพ. สุทธิพงษ์ วิริยะสกุล",
                "is_doctor_document": False,
                "scan_by_id": "PHARM_01",
                "scan_by_name": "ภก. รัตนชัย แซ่ตั้ง (เภสัชกร)",
                "scan_by_role": "Staff",
                "scan_date": datetime(2018, 12, 18, 12, 35, 0),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: รายการสั่งจ่ายยา", "file": "doc_pharm_dispense.png", "mime": "image/png"},
                ]
            },

            # Visit 5: 10-08-2018 (Finance & Billing)
            {
                "id": "doc-082400030-010",
                "hn": "08-24-00030",
                "en": "08-22-088712",
                "category_id": 9, # FINANCE
                "title": "Official Medical Fee Receipt - ใบเสร็จรับเงินค่ารักษาพยาบาล",
                "document_code": "RECEIPT-2018-08",
                "doctor_code": None,
                "doctor_name": None,
                "is_doctor_document": False,
                "scan_by_id": "FINANCE_02",
                "scan_by_name": "นางสาว รัตนา เงินดี (เจ้าหน้าที่การเงิน)",
                "scan_by_role": "Staff",
                "scan_date": datetime(2018, 8, 10, 14, 45, 0),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: ใบเสร็จรับเงินทางการ", "file": "doc_finance_receipt.png", "mime": "image/png"},
                ]
            },
            {
                "id": "doc-082400030-011",
                "hn": "08-24-00030",
                "en": "08-22-088712",
                "category_id": 9, # FINANCE
                "title": "Electronic Payment Tax Invoice / Receipt - ใบเสร็จรับเงิน/ใบกำกับภาษีอิเล็กทรอนิกส์ (PDF)",
                "document_code": "TAX-INV-2018",
                "doctor_code": None,
                "doctor_name": None,
                "is_doctor_document": False,
                "scan_by_id": "FINANCE_02",
                "scan_by_name": "นางสาว รัตนา เงินดี (เจ้าหน้าที่การเงิน)",
                "scan_by_role": "Staff",
                "scan_date": datetime(2018, 8, 10, 14, 50, 0),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: Electronic Tax Invoice (PDF)", "file": "doc-01.pdf", "mime": "application/pdf"},
                ]
            },

            # =========================================================
            # Patient 2: นาย ศุภพงศ์ เผ่านาค (HN: 08-20-800151)
            # =========================================================
            {
                "id": "doc-0820800151-001",
                "hn": "08-20-800151",
                "en": "08-20-800612",
                "category_id": 2, # CONSENT
                "title": "Consent for Surgery & Procedures - หนังสือแสดงความยินยอมรับการตรวจรักษา",
                "document_code": "CONSENT-0820",
                "doctor_code": "YH00412",
                "doctor_name": "นพ. สุทธิพงษ์ วิริยะสกุล",
                "is_doctor_document": False,
                "scan_by_id": "STAFF-045",
                "scan_by_name": "Atchariya Mana (เจ้าหน้าที่เวชระเบียน)",
                "scan_by_role": "Staff",
                "scan_date": datetime(2020, 2, 28, 12, 53, 20),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: ใบยินยอมการรักษา", "file": "doc_consent_surgery.png", "mime": "image/png"},
                ]
            },

            # =========================================================
            # Patient 3: นางสาว จิราพร สำราญพันธ์ (HN: 08-18-018351)
            # =========================================================
            {
                "id": "doc-0818018351-001",
                "hn": "08-18-018351",
                "en": "08-19-122932",
                "category_id": 3, # MED_RECORD
                "title": "Doctor's Clinical Record & Physical Exam - บันทึกการตรวจรักษาของแพทย์",
                "document_code": "MED-REC-0818",
                "doctor_code": "YH00921",
                "doctor_name": "พญ. น้ำมณี มณีนิล",
                "is_doctor_document": True,
                "scan_by_id": "STAFF-054",
                "scan_by_name": "ภาคภูมิ ภูมิเจริญ (เจ้าหน้าที่เวชระเบียน)",
                "scan_by_role": "Staff",
                "scan_date": datetime(2019, 6, 24, 17, 16, 50),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: Clinical Record", "file": "doc_opd_clinical_chart.png", "mime": "image/png"},
                ]
            },

            # =========================================================
            # Patient 4: นางสาว ณัฐพร ศรีรุ่งเรือง (HN: 08-20-800150)
            # =========================================================
            {
                "id": "doc-0820800150-001",
                "hn": "08-20-800150",
                "en": "08-20-800611",
                "category_id": 1, # REG
                "title": "Patient Registration Form - ใบลงทะเบียนผู้ป่วยใหม่",
                "document_code": "REG-2020-002",
                "doctor_code": "YH00412",
                "doctor_name": "นพ. สุทธิพงษ์ วิริยะสกุล",
                "is_doctor_document": False,
                "scan_by_id": "STAFF-021",
                "scan_by_name": "เจ้าหน้าที่เวชระเบียน (ID: 004521474)",
                "scan_by_role": "Staff",
                "scan_date": datetime(2020, 2, 28, 12, 19, 21),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: Registration Sheet", "file": "doc_p1_reg_page1.png", "mime": "image/png"},
                ]
            },

            # =========================================================
            # Patient 5: เด็กชาย วีริทธิ์พล ปฏิบัติ (HN: 08-07-000914)
            # =========================================================
            {
                "id": "doc-0807000914-001",
                "hn": "08-07-000914",
                "en": "08-20-114808",
                "category_id": 3, # MED_RECORD
                "title": "Pediatric Surgery Operative Record - บันทึกการตรวจศัลยกรรมกุมารเวช",
                "document_code": "PED-SURG-01",
                "doctor_code": "YH00355",
                "doctor_name": "นพ. สุรชัย พัฒนากูล",
                "is_doctor_document": True,
                "scan_by_id": "NURSE-04",
                "scan_by_name": "พว. วราภรณ์ แสนดี (พยาบาลวิชาชีพ)",
                "scan_by_role": "Nurse",
                "scan_date": datetime(2020, 2, 20, 14, 25, 0),
                "total_pages": 1,
                "is_confidential": False,
                "pages": [
                    {"num": 1, "label": "หน้า 1: Pediatric Surgery Record", "file": "doc_operative_note.png", "mime": "image/png"},
                ]
            }
        ]

        for d_info in docs_to_create:
            doc_obj = Document(
                id=d_info["id"],
                hn=d_info["hn"],
                en=d_info["en"],
                category_id=d_info["category_id"],
                title=d_info["title"],
                document_code=d_info["document_code"],
                doctor_code=d_info["doctor_code"],
                doctor_name=d_info["doctor_name"],
                is_doctor_document=d_info["is_doctor_document"],
                scan_by_id=d_info["scan_by_id"],
                scan_by_name=d_info["scan_by_name"],
                scan_by_role=d_info["scan_by_role"],
                scan_date=d_info["scan_date"],
                total_pages=d_info["total_pages"],
                is_confidential=d_info["is_confidential"]
            )
            db.add(doc_obj)
            db.flush()

            for p in d_info["pages"]:
                file_full_path = settings.STORAGE_DIR / p["file"]
                
                # Calculate actual image dimensions & byte size (supports both images and PDF)
                real_file_size = os.path.getsize(file_full_path) if file_full_path.exists() else 100000
                real_width = 1240
                real_height = 1754
                if file_full_path.exists():
                    try:
                        if file_full_path.suffix.lower() == ".pdf":
                            import pymupdf
                            with pymupdf.open(str(file_full_path)) as pdf_doc:
                                p_idx = min(max(p["num"] - 1, 0), len(pdf_doc) - 1)
                                rect = pdf_doc[p_idx].rect
                                real_width = int(rect.width)
                                real_height = int(rect.height)
                        else:
                            with Image.open(file_full_path) as im:
                                real_width, real_height = im.size
                    except Exception:
                        pass

                db.add(DocumentPage(
                    document_id=doc_obj.id,
                    page_number=p["num"],
                    page_label=p["label"],
                    file_name=p["file"],
                    file_path=str(file_full_path),
                    mime_type=p["mime"],
                    file_size=real_file_size,
                    width=real_width,
                    height=real_height
                ))

        db.commit()
        print("\n=========================================================================")
        print(" SUCCESS: Realistic Hospital Mock Data Seeded Successfully!")
        print(f" Patients: {db.query(Patient).count()}")
        print(f" Encounters: {db.query(Encounter).count()}")
        print(f" Categories: {db.query(DocumentCategory).count()}")
        print(f" Documents: {db.query(Document).count()}")
        print(f" Pages: {db.query(DocumentPage).count()}")
        print("=========================================================================")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
