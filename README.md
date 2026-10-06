# Yanhee e-Scan System (DMS) v3.1 Secured
**ระบบจัดเก็บ สแกนนำเข้า และเปิดดูเอกสารเวชระเบียน โรงพยาบาลยันฮี (Yanhee Hospital)**

---

## 🏗️ โครงสร้างสถาปัตยกรรม (Project Architecture)

โปรเจกต์ถูกออกแบบตามหลักการ **Modular & Reusable Components** โดยแยกฝั่ง Backend และ Frontend ชัดเจน ไม่เขียนโค้ดยาวในไฟล์เดียว และทุก Component ถูกออกแบบให้สามารถนำไปใช้ซ้ำในระบบเวชระเบียนอื่นๆ ได้ทันที

```
DMS/
├── backend/                       # Python FastAPI Backend (จัดการด้วย uv)
│   ├── app/
│   │   ├── api/v1/                # API Routers แยกตาม Entity
│   │   │   ├── patients.py        # ข้อมูลผู้ป่วยและ Tree View
│   │   │   ├── documents.py       # รายการเอกสารและการเปิดดู
│   │   │   ├── files.py           # สตรีมไฟล์ภาพ/PDF และลายน้ำ
│   │   │   ├── audit.py           # บันทึก Audit Log การเข้าถึง
│   │   │   └── scan.py            # API สแกนนำเข้า, เพิ่มหมวดหมู่, Patient Lookup, Vendor Upload
│   │   ├── core/                  # Database Engine (PostgreSQL) และ App Settings
│   │   ├── models/                # SQLAlchemy Models (Patient, Encounter, Document, Category, AuditLog)
│   │   ├── schemas/               # Pydantic Schemas (DTOs ตรวจสอบ Input/Output)
│   │   ├── services/              # Business Logic
│   │   │   ├── patient_service.py # บริการข้อมูลคนไข้
│   │   │   ├── document_service.py# บริการเอกสารและ Tree
│   │   │   ├── file_service.py    # สตรีมไฟล์ภาพและเรนเดอร์ PDF สดด้วย PyMuPDF (Zero Disk Bloat)
│   │   │   ├── scan_service.py    # จัดการสแกน, หมวดหมู่ไดนามิก, Magic Bytes & Vendor Upload
│   │   │   └── audit_service.py   # จัดเก็บบันทึกประวัติการกระทำความปลอดภัย
│   │   ├── utils/                 # Utility: Dynamic Watermark Generator (Pillow)
│   │   └── main.py                # FastAPI Entrypoint (CORS & Lifespan)
│   ├── storage/documents/         # จัดเก็บไฟล์ภาพสแกนเวชระเบียนและเอกสาร PDF จริง 100%
│   └── scripts/
│       ├── init_db.py             # สคริปต์สร้างตารางฐานข้อมูลอัตโนมัติ
│       ├── seed_mock_data.py      # สคริปต์จำลองข้อมูลผู้ป่วยและเชื่อมโยงเอกสารสแกนจริง
│       └── test_new_scan_features.py # ชุดทดสอบ API สแกน, Lookup, หมวดหมู่ และ Vendor Upload
│
├── frontend/                      # Next.js 16 + TypeScript + Tailwind CSS (Turbopack)
│   ├── app/
│   │   ├── view/page.tsx          # หน้าจอเปิดดูเวชระเบียน (?hn=...)
│   │   └── scan/page.tsx          # หน้าจอสแกนและนำเข้าเอกสารเวชระเบียน (/scan)
│   ├── components/
│   │   ├── ui/                    # shadcn/ui Components (Button, Input, Combobox, Dialog, ScrollArea...)
│   │   │   └── combobox.tsx       # Searchable Combobox Component มาตรฐานระบบ
│   │   ├── scan/                  # ScanForm, ScanPreviewCanvas, ScanTopBar, ScanActions
│   │   ├── viewer/                # DocumentViewerCanvas, ViewerToolbar, ViewerHeader, ThumbnailStrip, PrintDialog
│   │   ├── sidebar/               # EscanSidebar, PatientProfileCard, DocumentGroupFilter, DocumentTreeView
│   │   ├── common/                # Reusable Components (EmptyState, StatusPill, LoadingSkeleton)
│   │   └── layout/                # TopNavbar, ViewerLayout (Responsive 3-Column + Drawers)
│   ├── hooks/                     # Custom Hooks (usePatient, useDocumentTree, useViewerControls, useKeyboardShortcuts)
│   ├── services/                  # API Fetching Layer (patientApi, documentApi, scanApi)
│   └── types/                     # TypeScript Type Definitions ทั้งหมด
│
└── start_dev.bat                  # สคริปต์ดับเบิลคลิกเดียว รันทั้ง Backend และ Frontend พร้อมกัน
```

---

## 🎨 มาตรฐาน UI/UX และการจัดวางข้อมูล (Hospital UI/UX Standards)

ระบบเวชระเบียนสแกนยันฮีได้รับการปรับแต่ง UI/UX ตามคำแนะนำทางการแพทย์และหลักการ Ergonomics ระดับสากล:

### 1. ป้องกันการแสดงข้อมูลซ้ำซ้อน (Zero Redundant Information)
* **TopNavbar vs. Sidebar**: ข้อมูลคนไข้ (ชื่อ, HN, อายุ) ถูกจัดวางไว้อย่างโดดเด่นใน `PatientProfileCard` ฝั่ง Sidebar ด้านซ้ายแล้ว แถบ Navbar ด้านบนจึง**ไม่แสดงซ้ำ**เมื่อเปิดเมนูอยู่ โดยจะปรากฏเฉพาะตอนที่ผู้ใช้สั่ง "พับเก็บเมนู" เท่านั้น เพื่อประหยัดพื้นที่และไม่รบกวนสายตา
* **Viewer Header (แพทย์ vs ผู้สแกน)**: ในกรณีที่แพทย์เป็นผู้ตรวจและบันทึกเอกสารเอง (`doctor_name === scan_by_name`) ระบบจะแสดงเฉพาะแบดจ์ `แพทย์: นพ. ...` และ**ตัดการแสดงชื่อผู้สแกนที่ซ้ำกันออกทันที** โดยจะแสดงชื่อผู้สแกนเฉพาะกรณีที่ผู้สแกนนำเข้าเป็นคนละคนกันจริงๆ (เช่น พยาบาล หรือเจ้าหน้าที่เวชระเบียน)
* **Patient Profile ที่กระชับ**: ตัดข้อมูลส่วนเกินที่ไม่จำเป็นต่อการเปิดดูเวชระเบียน ให้เหลือเฉพาะข้อมูลระบุตัวตนสำคัญ: ชื่อ (ไทย/อังกฤษ), HN, VN (Visit No.), เพศ, อายุ, และวันเกิดในรูปแบบ พ.ศ. ไทย (`12 พ.ค. 2518`)
* **ยกเลิกระดับความลับ (Zero Confidential Level)**: เอกสารเวชระเบียนสแกนในระบบไม่มีระดับเอกสารลับ ทุกเอกสารได้รับการจัดการสิทธิ์เข้าถึงตามมาตรฐานเวชระเบียนโรงพยาบาล จึงไม่มีป้ายหรือช่องติ๊ก "ความลับ" ให้รกสายตา

### 2. การจัดวางกลุ่มข้อมูลแนบชิด (Gestalt Proximity & Compact Controls)
* **แถบจัดกลุ่มเอกสารแบบ Single-Line Segmented Control**: 
  * รวมปุ่มจัดกลุ่ม **`Visit Date`**, **`Care provider`**, **`Doc Type`** ไว้ในกล่อง Segmented Control แถวเดียว 3 ช่องเท่ากัน
  * ป้องกันการตัดคำตกบรรทัด (`whitespace-nowrap`) ทำให้ปุ่มมีความสูงกะทัดรัด (Compact) เรียบหรู ไม่ดูใหญ่หรือเทอะทะ
* **ตัวกรองประเภทคนไข้แนบชิด (Attached Sub-Filters)**:
  * ปุ่มตัวกรอง `[ OPD | IPD | O+I ]` ถูกจัดวางให้**แนบชิดติดกับคำว่า "ประเภทคนไข้:"** ทันที ไม่ใช้ `justify-between` ที่ทำให้ปุ่มลอยเคว้งไปชิดขอบขวาสุด

### 3. มาตรฐาน Combobox ทั่วทั้งระบบ (Searchable shadcn Combobox)
* ยกเลิกการใช้ Native `<select>` หรือ raw HTML dropdowns ทั้งหมด
* นำเข้าและใช้งาน `@/components/ui/combobox` รองรับการพิมพ์ค้นหาแบบ Real-time, คีย์บอร์ดนำทาง, และการเลือกหมวดหมู่เอกสาร, โหมดตรวจจับข้อมูล, Scanner Device, ค่า DPI และ Color Mode อย่างลื่นไหล

### 4. การคำนวณอายุอัตโนมัติตามปีปัจจุบัน (Dynamic Current-Year Age Engine)
* มีระบบคำนวณอายุ `calculateAgeFromDob` ที่แปลงปี พ.ศ. (`> 2400`) เป็น ค.ศ. อัตโนมัติ รองรับรูปแบบวันที่ภาษาไทย (`15 พ.ค. 2535` หรือ `15/05/2535`)
* คำนวณอายุเปรียบเทียบกับวันที่และปีปัจจุบันเสมอ เพื่อให้อายุของคนไข้ในระบบมีความถูกต้องเป็นปัจจุบันตลอดเวลา

### 5. ข้อจำกัดและมาตรการตรวจสอบไฟล์อัพโหลด (Strict Upload Validation)
* อนุญาตเฉพาะไฟล์นามสกุล **`.pdf`**, **`.jpg`**, **`.jpeg`**, **`.png`** เท่านั้น
* ระบบมีทั้งการตรวจ Client-side ด้วย `accept` + `DataTransfer` filter และการตรวจ Server-side ด้วย **Magic Bytes Inspection** เพื่อป้องกันไฟล์ปลอมแปลงหรือมัลแวร์

---

## 🚀 วิธีการรันระบบ (Quick Start)

### วิธีที่ 1: ดับเบิลคลิกไฟล์เดียว (แนะนำ)
ดับเบิลคลิกไฟล์ `start_dev.bat` ที่โฟลเดอร์หลัก ระบบจะเปิดทั้ง Backend และ Frontend ในหน้าต่างแยกให้อัตโนมัติ

### วิธีที่ 2: รันผ่าน Command Line

#### 1. ฝั่ง Backend (FastAPI)
```bash
cd backend
uv sync
uv run python scripts/init_db.py
uv run python scripts/seed_mock_data.py
uv run uvicorn app.main:app --reload --port 8000
```
* **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

#### 2. ฝั่ง Frontend (Next.js)
```bash
cd frontend
bun install
bun run dev --port 3000
```

### 🔗 ลิงก์การใช้งานระบบ (Direct URLs):
* **หน้าเปิดดูเวชระเบียนคนไข้**: [http://localhost:3000/view?hn=08-24-00030](http://localhost:3000/view?hn=08-24-00030)
* **หน้าจอสแกนและนำเข้าเอกสาร**: [http://localhost:3000/scan](http://localhost:3000/scan)

---

## 📥 โมดูลสแกนและนำเข้าเอกสาร (Document Scanning & Ingestion - `/scan`)

โมดูล `/scan` ทำหน้าที่เป็น Gateway นำเข้าเอกสารเวชระเบียนเข้าสู่ระบบ DMS:

1. **โหมดการนำเข้า 2 รูปแบบ**:
   * **สแกนผ่านเครื่องสแกนเนอร์ (Scanner Bridge)**: เชื่อมต่อไดรเวอร์ TWAIN/WIA พร้อมเลือกอุปกรณ์, ความละเอียด DPI (150, 200, 300), และโหมดสี (Color, Grayscale, B&W) ผ่าน Searchable Combobox
   * **อัพโหลดไฟล์โดยตรง (Direct File Upload)**: ลากวาง (Drag & Drop) หรือเลือกไฟล์ `.pdf, .jpg, .jpeg, .png`
2. **โหมดตรวจจับข้อมูลอัตโนมัติ (Extraction Mode)**:
   * **OCR + Barcode**: ดึง HN, VN, วันที่, และชื่อผู้ป่วยจากเอกสารโดยอัตโนมัติ
   * **Manual Entry**: กรอกข้อมูลด้วยตนเองสำหรับเอกสารที่ไม่มีบาร์โค้ด
3. **การจัดการหมวดหมู่เอกสารแบบไดนามิกและจัดกลุ่ม 2 ภาษา (Grouped Dual-Language Categories)**:
   * **การแสดงผล 2 ภาษา**: แสดงผล `ชื่อไทย (English Name)` เมื่อมีทั้ง 2 ภาษา หรือแสดงภาษาเดียวตามที่มีในระบบ
   * **จัดกลุ่มด้วย ComboboxGroup & ComboboxSeparator**: ตัวเลือกจัดกลุ่มตาม `category_type` (เช่น `Core Clinical Documents`, `Assessment`, `Orders / Treatment` ฯลฯ) พร้อมส่วนหัวของกลุ่มแบบ Inline สะอาดตา ไม่ซ้อนทับกัน และเส้นคั่น Separator ช่วยให้ค้นหาเอกสารได้รวดเร็วตามหลัก Hospital Ergonomics
   * **ปุ่มล้างตัวเลือก (showClear) & ล้างเอกสาร (Clear Document)**: รองรับปุ่ม Clear ล้างค่าใน Combobox ได้ทันที และมีปุ่ม "ล้างเอกสาร" บนหน้าจอพรีวิว พร้อมระบบล้างข้อมูลอัตโนมัติเมื่อเลือกอัพโหลดเอกสารใหม่ ป้องกันข้อมูลคนไข้เก่าค้างในฟอร์ม
   * **เพิ่มหมวดหมู่ใหม่แบบไดนามิก 100%**: ปุ่ม **`+ เพิ่มหมวดหมู่`** เปิด Dialog บันทึกหมวดหมู่ใหม่ผ่าน API `POST /api/v1/scan/categories` โดยดึงรายการ `category_type` จากฐานข้อมูลจริง 100% ปราศจากค่า Hardcode มีระบบป้องกัน Dialog ปิดตัวโดยไม่ตั้งใจเมื่อคลิกเลือก Combobox และปลดล็อกการเลื่อนลูกกลิ้งเมาส์ด้วย `container={dialogRef}` ช่วยให้เลื่อนดูรายการได้ครบถ้วนลื่นไหล 60 FPS พร้อมรองรับการสลับไปพิมพ์ประเภทหมวดหมู่ใหม่ (`+ พิมพ์ใหม่`) ได้อย่างอิสระ เมื่อบันทึกสำเร็จจะอัพเดทเข้า Combobox ทันทีโดยไม่ต้อง Reload หน้าเว็บ
4. **ความยืดหยุ่นบนอุปกรณ์พกพา (Mobile Ergonomics)**:
   * บนหน้าจอ Desktop (`≥ 768px`) แสดงผลแบบ 2 คอลัมน์ (ฟอร์มซ้าย + พรีวิวขวา)
   * บนสมาร์ตโฟน/แท็บเล็ต (`< 768px`) สลับการทำงานด้วยแท็บ `[ 📝 ข้อมูล & สแกน | 📄 ตัวอย่าง ({pages}) ]` และสลับไปยังแท็บพรีวิวอัตโนมัติเมื่อมีการสแกนหรืออัพโหลดไฟล์

---

## 🔍 ระบบค้นหาและเติมข้อมูลคนไข้อัตโนมัติ (Patient & Encounter Auto-Fill Lookup API)

ระบบเตรียมพร้อมรองรับการเชื่อมต่อกับ HIS โรงพยาบาลผ่าน API Lookup ที่รวดเร็ว:

* **Endpoint**: `GET /api/v1/scan/patient-lookup?query={hn_or_en}`
* **ลำดับการค้นหา (Precedence)**:
  1. ค้นหาจากเลขที่การเข้ารับบริการ (`Encounter / VN`) เป็นอันดับแรก เพื่อดึงข้อมูลการมาตรวจครั้งนั้นอย่างแม่นยำ
  2. หากไม่พบ VN จะค้นหาจากเลขประจำตัวผู้ป่วย (`HN`) และดึงการมาตรวจล่าสุดของผู้ป่วยรายนั้นให้อัตโนมัติ
* **ข้อมูลที่ส่งกลับ**:
  * ข้อมูลประชากร: `hn`, `name_th`, `name_en`, `gender`, `dob`, และ **`age` (คำนวณตามปีปัจจุบัน)**
  * ข้อมูลการตรวจ: `en`, `visit_date`, `encounter_type` (`OPD`/`IPD`), `department_name`, และ `doctor_name`
* **การใช้งานบน UI**: มีปุ่ม **"ดึงข้อมูลอัตโนมัติ"** และรองรับการกดปุ่ม `Enter` ในช่อง HN/VN เพื่อเติมข้อมูลลงฟอร์มทันที

---

## 🛡️ สถาปัตยกรรมการรับส่งไฟล์จากคู่ค้าภายนอก (Secure Vendor Document Ingestion API)

รองรับกรณีที่โรงพยาบาลมี Vendor หรือห้องปฏิบัติการภายนอก (เช่น Outsourced Lab, ศูนย์ตรวจพยาธิวิทยา, หรือคลินิกเอ็กซเรย์) ส่งไฟล์เอกสารพร้อม Metadata มาจัดเก็บในฐานข้อมูล DMS โดยตรง:

* **Endpoint**: `POST /api/v1/scan/vendor-upload` (Multipart Form Data)
* **โครงสร้างการป้องกัน 6 ชั้น (6-Layer Security Shield)**:
  1. **Authentication Layer**: ตรวจสอบ Header `X-API-Key` เทียบกับคีย์ความปลอดภัยของระบบ
  2. **Deep File Inspection (Magic Bytes)**:
     - PDF: ต้องขึ้นต้นด้วยไบต์ `b"%PDF-"`
     - JPEG: ต้องขึ้นต้นด้วยไบต์ `b"\xFF\xD8\xFF"`
     - PNG: ต้องขึ้นต้นด้วยไบต์ `b"\x89PNG\r\n\x1a\n"`
     - ปฏิเสธไฟล์ประเภทอื่นและไฟล์ Polyglot ที่ซ่อนโค้ดอันตรายทันที (HTTP 400)
  3. **File Size & Quota Ceiling**: จำกัดขนาดไฟล์สูงสุดไม่เกิน 50 MB ต่อไฟล์ ป้องกันการโจมตีแบบ DoS
  4. **Idempotency Protection**: รองรับ `external_reference_id` ป้องกันการส่งเอกสารซ้ำซ้อน
  5. **Storage Sanitization**: จัดเก็บไฟล์ด้วยชื่อที่ปลอดภัยและเข้ารหัสรหัสเอกสารเพื่อป้องกัน Path Traversal
  6. **Forensic Audit Logging**: บันทึกกิจกรรม `VENDOR_UPLOAD` ลงในตาราง `audit_logs` พร้อมบันทึก IP, User-Agent, ขนาดไฟล์ และค่า Hash ตรวจสอบย้อนหลังได้ 100%

### 💡 แนวทางความปลอดภัยขั้นสูงสำหรับ Production:
1. **API Key Per Vendor**: แยก API Key ประจำแต่ละ Vendor และจัดเก็บแบบเข้ารหัส (Hashed)
2. **IP Whitelisting & WAF**: กำหนดให้เรียกใช้งานผ่าน Reverse Proxy (Nginx/Cloudflare) โดยอนุญาตเฉพาะหมายเลข IP สาธารณะที่ได้รับอนุญาตของ Vendor เท่านั้น
3. **mTLS (Mutual TLS)**: ใช้ใบรับรองดิจิทัลแบบ 2 ทางสำหรับการเชื่อมต่อระหว่างเซิร์ฟเวอร์
4. **Rate Limiting**: กำหนดขีดจำกัดความถี่การเรียกใช้งาน เช่น สูงสุด 60 requests/นาที ต่อหนึ่ง API Key
5. **Antivirus & Malware Scanning**: ทำงานร่วมกับ ClamAV daemon สแกนไฟล์ก่อนนำขึ้นสู่ระบบ

---

## ⚡ สถาปัตยกรรมการแสดงผลและเอกสาร (Document & PDF Engine)

1. **รองรับไฟล์ PDF ต้นฉบับโดยไม่ต้องแปลงลง Disk (Zero-Disk PyMuPDF Streaming)**:
   * รองรับทั้งไฟล์ภาพสแกน (PNG, JPG) และไฟล์ **PDF หลายหน้า** (เช่น รายงานคณะกรรมการคุณภาพ QA Report)
   * Backend ใช้ **PyMuPDF (`fitz`)** แปลงหน้า PDF ส่งเป็นไบต์สตรีมแบบ On-the-Fly ทันทีที่เรียกดู ไม่สร้างไฟล์ขยะตกค้างใน Disk
   * มีปุ่ม **"PDF ต้นฉบับ"** ใน Header ให้แพทย์สามารถคลิกเปิดดูไฟล์ PDF ดั้งเดิมในแท็บใหม่ได้ทันที
2. **การจัดกลุ่มเอกสาร 3 รูปแบบ (Multi-level Tree)**:
   * **`Visit Date`**: เรียงตามวันที่มาตรวจล่าสุด พร้อมตัวกรองย่อย `[ OPD | IPD | O+I ]`
   * **`Care provider`**: จัดกลุ่มตามแพทย์ผู้ตรวจรักษาเท่านั้น (เช่น นพ. สุทธิพงษ์, นพ. สุรชัย, พญ. น้ำมณี) โดยตัดเอกสารที่ไม่มีแพทย์ออก ไม่ให้ชื่อเจ้าหน้าที่หรือการเงินมาปะปน
   * **`Doc Type`**: จัดกลุ่มตามประเภทเอกสาร (OPD Record, Operative Note, Consent Form, ใบรับฝากทรัพย์สิน)
3. **ระบบค้นหาเอกสารในเวชระเบียน (In-Chart Document Search)**:
   * ค้นหาได้ทั้งชื่อเอกสาร, รหัสแบบฟอร์ม, ชื่อแพทย์, หรือหมวดหมู่ แบบ Real-time พร้อมแสดงจำนวนผลลัพธ์
4. **ความปลอดภัยและลายน้ำแบบไดนามิก (Dynamic Watermarking)**:
   * ประทับตรา *"สำเนาถูกต้อง COPY"* พร้อมระบุรหัสเจ้าหน้าที่ วันที่ และเวลา
   * บันทึก Audit Log ทุกครั้งที่มีการเปิดดู พิมพ์ หรือส่งออกเอกสาร
5. **Interactive Viewer & Mobile Gestures**:
   * ซูม 20% – 400%, แพนภาพ, หมุน 90° ซ้าย/ขวา, ฟิลเตอร์สี (ขาวดำ, เพิ่มความคมชัด, สีผกผัน)
   * รองรับ Touch Pan 1 นิ้ว, Swipe ปัดซ้าย/ขวาเพื่อเปลี่ยนหน้า, ดับเบิ้ลแท็บเพื่อซูม
   * คีย์ลัดแป้นพิมพ์: `+`, `-`, `0`, `R`, ลูกศรซ้าย/ขวา, `Ctrl+P`, `[` (พับเมนูซ้าย), และ `]` (พับหน้ารวมขวา)

---

## 🖨️ สถาปัตยกรรม Scanner Bridge และ Thai AI OCR

### 1. การเชื่อมต่อฮาร์ดแวร์เครื่องสแกน (Local Scanner Bridge - Port 18000)
* **WIA Automation**: ตัว Bridge ทำงานเป็น FastAPI daemon บนเครื่อง Client คุยกับ Windows WIA Driver (`win32com.client.Dispatch("WIA.DeviceManager")`)
* **เจาะจงเครื่องสแกนที่เลือก**: ส่งคำสั่งไปยัง Device ID และชื่อเครื่องที่ผู้ใช้งานเลือกใน Top Bar โดยตรง (เช่น EPSON Perfection V39) ไม่สับสนกับ Default Printer ใน Windows
* **ป้องกันอุปกรณ์ซ้ำซ้อน**: กรองไดรเวอร์ eSCL Network ที่ซ้ำกับ Native WIA Driver ป้องกันปัญหาชื่อเครื่องเบิ้ล

### 2. ระบบอ่านข้อความภาษาไทยด้วย AI OCR (PaddleOCR ONNX Thai Model)
* **โมเดลภาษาไทยเฉพาะทาง**: ติดตั้ง PaddleOCR Thai ONNX Model ใน `backend/models/ocr/thai/rec.onnx` และ `dict.txt` ประมวลผลรวดเร็วและแม่นยำสูง
* **ระบบปรับทิศทางภาพอัตโนมัติ (Intelligent Auto-Orientation)**: ตรวจวัดคะแนนความหนาแน่นตัวอักษรภาษาไทยระหว่าง 0°, 270°, 90°, 180° หมุนเอกสารที่สแกนแนวนอนจาก Flatbed ให้ตั้งตรงและอ่านข้อความได้อย่างถูกต้องทันที
* **สกัดข้อมูลสำคัญลงฟอร์มอัตโนมัติ**:
  * **ชื่อผู้ป่วยภาษาไทย**: เช่น `น.ส. จิราพร ภู่มะลิ` (พร้อมแก้ไขตัวสะกดคำนำหน้าชื่อ OCR)
  * **ชื่อผู้ป่วยภาษาอังกฤษ**: เช่น `JIRAPORN PHUMALI`
  * **อายุ**: คำนวณเทียบปีปัจจุบันหรือสกัดจากเอกสาร เช่น `24 ปี`
  * **วันเกิด**: แปลงตัวสะกดเดือนภาษาไทย เช่น `03 เม.ย. 2545`
  * **ชื่อแพทย์ผู้ตรวจ**: ตรวจจับ `DOCTOR YANHEE`, `นพ. ...`, `พญ. ...`, และแผนกคู่แพทย์
  * **เลขที่ HN/VN**: สกัดจาก Barcode, QR Code, และข้อความบนเอกสาร พร้อมดึงข้อมูลจากฐานข้อมูลเวชระเบียนมาเติมให้อัตโนมัติ

### 3. มาตรฐานเวชระเบียน HA/JCI สำหรับ Checkbox "เป็นเอกสารบันทึกของแพทย์โดยตรง"
* **บันทึกของแพทย์โดยตรง (`is_doctor_document = true`)**: เอกสารทางคลินิกที่แพทย์ลงบันทึกเอง เช่น Progress Note, Doctor's Orders, Operative Note
* **เอกสารทั่วไปที่มีชื่อแพทย์ (`is_doctor_document = false`)**: เอกสารที่พยาบาลหรือเจ้าหน้าที่พิมพ์จากระบบ HIS โดยมีชื่อแพทย์เป็นผู้ออกคำสั่งตรวจ เช่น Visit Slip, ใบสั่ง Lab/X-Ray
* **ระบบอำนวยความสะดวก**: ติ๊กถูกให้อัตโนมัติเมื่อตรวจพบชื่อแพทย์ โดยเปิดให้เจ้าหน้าที่ปรับเปลี่ยนได้ตามความเหมาะสม

### 4. ระบบอ่าน Barcode / QR Code รูปแบบ Multi-Field Key=Value (Auto-Population)
* **รูปแบบข้อมูลใน QR Code**: รองรับโครงสร้างข้อมูลแบบ Pipe-Delimited เช่น:
  `HN=00000001|VN=OP26070000001|Doctype=OPD-NOTE|DOB=2006-01-08 17:00:00.000`
* **การกรอกข้อมูลอัตโนมัติ 5 จุดสำคัญ**:
  1. **HN**: สกัดเลขประจำตัวคนไข้ นำไปกรอกลงช่อง HN ทันที
  2. **VN / EN**: สกัดเลขรับบริการ และสลับประเภท Encounter (`OPD` หรือ `IPD`) ให้อัตโนมัติตามคำนำหน้ารหัส (`OP` / `IP`)
  3. **Doctype (หมวดหมู่เอกสาร)**: จับคู่รหัสเอกสาร (เช่น `OPD-NOTE`) กับตาราง `document_categories` ตาม `code`, `category_type`, `name_en`, หรือ `name_th` และนำ `id` ไปเลือกใน Combobox หมวดหมู่เอกสาร พร้อมตั้งชื่อเอกสาร (`title`) ให้ทันที
  4. **DOB & Age**: สกัดวันเดือนปีเกิดและคำนวณอายุของผู้ป่วยเทียบกับปีปัจจุบัน (เช่น `20 ปี`) โดยอัตโนมัติ
  5. **Enrichment จากฐานข้อมูล**: ค้นหาข้อมูลผู้ป่วยในระบบ DMS เติมชื่อ-นามสกุล, เพศ, และแพทย์ผู้ตรวจให้อัตโนมัติทันทีที่สแกนหรือดึงข้อมูล

