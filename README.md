# Yanhee e-Scan System (DMS) v3.2 Secured
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
│   │   ├── core/                  # Database Engine (PostgreSQL), App Settings และ Storage Resolver (storage.py)
│   │   ├── models/                # SQLAlchemy Models (Patient, Encounter, Document, Category, AuditLog)
│   │   ├── schemas/               # Pydantic Schemas (DTOs ตรวจสอบ Input/Output)
│   │   ├── services/              # Business Logic
│   │   │   ├── patient_service.py # บริการข้อมูลคนไข้
│   │   │   ├── document_service.py# บริการเอกสารและ Tree (เรียง Visit Date แบบ Descending)
│   │   │   ├── file_service.py    # สตรีมไฟล์ภาพและเรนเดอร์ PDF สดด้วย PyMuPDF (Zero Disk Bloat)
│   │   │   ├── scan_service.py    # จัดการสแกน, หมวดหมู่ไดนามิก, Magic Bytes & Vendor Upload
│   │   │   └── audit_service.py   # จัดเก็บบันทึกประวัติการกระทำความปลอดภัย
│   │   ├── utils/                 # Utility: Dynamic Watermark Generator (Pillow)
│   │   └── main.py                # FastAPI Entrypoint (CORS & Lifespan)
│   ├── storage/documents/{HN}/    # จัดเก็บไฟล์ภาพสแกนเวชระเบียนและ PDF แยกตามโฟลเดอร์ HN 100%
│   └── scripts/
│       ├── init_db.py             # สคริปต์สร้างตารางฐานข้อมูลอัตโนมัติ
│       ├── seed_mock_data.py      # สคริปต์จำลองข้อมูลผู้ป่วยและเชื่อมโยงเอกสารสแกนจริง
│       ├── migrate_storage_by_hn.py # สคริปต์ย้ายไฟล์เข้าโฟลเดอร์ตาม HN และปรับ Relative Path ใน DB
│       └── test_e2e_scan.py       # ชุดทดสอบ End-to-End สแกน, Lookup, หมวดหมู่, อัปโหลด และ Tree View
│
├── frontend/                      # Next.js 16 + TypeScript + Tailwind CSS (Turbopack)
│   ├── app/
│   │   ├── layout.tsx             # Root Layout พร้อมฟอนต์ Sarabun / TH Sarabun PSK แบบ Local 100%
│   │   ├── view/page.tsx          # หน้าจอเปิดดูเวชระเบียน (?hn=...)
│   │   └── scan/page.tsx          # หน้าจอสแกนและนำเข้าเอกสารเวชระเบียน (/scan)
│   ├── components/
│   │   ├── ui/                    # shadcn/ui Components (Button, Input, Combobox, Dialog, ScrollArea...)
│   │   │   └── combobox.tsx       # Searchable Combobox Component มาตรฐานระบบ
│   │   ├── scan/                  # ScanForm, ScanPreviewCanvas, ScanTopBar, ScanActions, SaveFeedbackDialog
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

### 6. ปุ่มสลับโหมดมืด/สว่างแบบคลิกเดียว (1-Click Dark/Light Mode Toggle)
* ติดตั้งปุ่ม **`ModeToggle`** ไว้ที่ขวาสุดของ `TopNavbar` (หน้าดูเวชระเบียน) และ `ScanTopBar` (หน้าสแกนเอกสาร)
* **คลิกเดียวสลับโหมดทันที**: ไม่ต้องเปิดเมนูหลายขั้นตอน คลิก 1 ครั้งเปลี่ยนเป็นโหมดมืด คลิกอีกครั้งเปลี่ยนกลับเป็นโหมดสว่างทันที พร้อมไอคอน Sun (ดวงอาทิตย์) และ Moon (พระจันทร์) หมุนเปลี่ยนนุ่มนวล
* **รองรับคีย์ลัด**: สามารถกดปุ่ม **`D`** บนคีย์บอร์ดเพื่อสลับโหมดได้ตลอดเวลา

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

### 🔗 ลิงก์และการเชื่อมต่อระบบ (Direct URLs & iFrame Integration):
* **หน้าเปิดดูเวชระเบียนคนไข้ (Dynamic URL Parameters)**:
  * **เรียกตรงผ่าน `/view`**: `http://localhost:3000/view?hn={HN}&visitId={VN/EN}&user={Staff_ID}`
  * **เรียกผ่าน Root `/` (iFrame Integration)**: `http://localhost:3000/?patientId={PID}&hn={HN}&visitId={VN/EN}` (ระบบจะ Forward พารามิเตอร์ทั้งหมดต่อไปยัง `/view` อัตโนมัติ รองรับทั้ง `hn`, `visitId`, `vn`, `en`, `patientId`, `user`)
  * **Zero Hardcoded Fallback**: ปราศจากค่า Mock HN แข็ง ป้องกันการแสดงประวัติผิดคน (Wrong Patient Error) และสอดคล้องกับมาตรฐานความปลอดภัย PDPA (หากไม่มี `hn` แนบมาระบบจะแสดง Empty State แจ้งเตือนอย่างปลอดภัย)
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
* **ระบบทำงานเบื้องหลังอัตโนมัติ (Zero-Intervention Auto-Start)**:
  * ติดตั้งครั้งเดียวที่เครื่องหน้างานด้วย `scanner-bridge/install_autostart.bat` ระบบจะรันอัตโนมัติในพื้นหลังทุกครั้งที่เปิดเครื่อง Windows (ผ่าน `run_silent.vbs`)
  * เจ้าหน้าที่ไม่ต้องคอยดับเบิลคลิกเปิดเอง และไม่มีหน้าต่างดำ CMD ปรากฏกวนใจหรือเผลอกดปิดระหว่างวัน

### 2. ระบบอ่านข้อความภาษาไทยด้วย AI OCR (PaddleOCR ONNX Thai Model) & Hybrid Engine
* **โมเดลภาษาไทยเฉพาะทาง**: ติดตั้ง PaddleOCR Thai ONNX Model ใน `backend/models/ocr/thai/rec.onnx` และ `dict.txt` ขับเคลื่อนด้วย `RapidOCR` + `ONNXRuntime`
* ⚠️ **ข้อกำหนดด้าน Dependencies ใน Docker (`uv.lock`)**:
  * ระบบต้องการ `rapidocr-onnxruntime>=1.4.0` และ `onnxruntime>=1.20.0` ใน `pyproject.toml`
  * หากแพ็กเกจนี้หายไป Docker build จะไม่สามารถโหลดโมเดล OCR ได้ และระบบจะ Fallback เป็น Barcode-only (อ่านได้แค่ HN จากบาร์โค้ด) ดังนั้นจึงต้องล็อก Dependency ไว้ใน `uv.lock` เสมอ
* **ระบบตรวจจับ Barcode หลายทิศทาง (Multi-Pass Auto-Rotation & Adaptive Thresholding)**:
  * ในเอกสารจริง สติกเกอร์บาร์โค้ดอาจหมุน 90°, 180°, 270° หรือซีดจาง
  * ฟังก์ชัน `detect_barcodes()` ใช้การสแกนแบบ Multi-pass (Original ➔ หมุน 4 ทิศ ➔ Grayscale Adaptive Threshold) และอ่านบาร์โค้ดทั้งหมดบนหน้า (ทั้ง HN `000000002` และ VN `OP26040000006`) โดยไม่หลุด break กลางคัน
* **ระบบปรับทิศทางภาพอัตโนมัติ (Intelligent Auto-Orientation)**: ตรวจวัดคะแนนความหนาแน่นตัวอักษรภาษาไทยระหว่าง 0°, 270°, 90°, 180° หมุนเอกสารที่สแกนแนวนอนจาก Flatbed ให้ตั้งตรงและอ่านข้อความได้อย่างถูกต้องทันที
* **สกัดข้อมูลสำคัญลงฟอร์มอัตโนมัติ (Auto Extraction)**:
  * **ชื่อผู้ป่วยภาษาไทย (`name_th`)**: เช่น `น.ส. จิราพร ภู่มะลิ` พร้อมระบบตัดคำภาษาอังกฤษส่วนเกิน (Stop Keywords เช่น `Name :`, `HN`) ไม่ให้รั่วไหลปนชื่อไทย
  * **ชื่อผู้ป่วยภาษาอังกฤษ (`name_en`)**: เช่น `JIRAPORN PHUMALI`
  * **เลขที่รับบริการ (VN / EN)**: ตรวจจับเลขที่รับบริการ 11 หลัก เช่น `OP26040000006` พร้อมแก้ไขตัวสะกด OCR ที่เพี้ยน (เช่น `CP` หรือ `CIP` ➔ ปรับเป็น `OP` อัตโนมัติ)
  * **วันที่รับบริการ พ.ศ. (`visit_date`)**: แปลงวันที่ภาษาไทย เช่น `Print Date : 10 ก.ค. 2569` เป็นรูปแบบ ISO `2026-07-10` อัตโนมัติ
  * **เวลารับบริการ (`visit_time`)**: สกัดเวลา เช่น `10:12` ➔ `10:12:00`
  * **อายุ (`age`)**: คำนวณเทียบปีปัจจุบันหรือสกัดจากเอกสาร เช่น `24 ปี`
  * **วันเกิด (`dob`)**: แปลงตัวสะกดเดือนภาษาไทย เช่น `03 เม.ย. 2545` ➔ `2002-04-03`
  * **ชื่อแพทย์ผู้ตรวจ (`doctor_name`)**: ตรวจจับ `DOCTOR YANHEE` (พร้อมขจัด Noise เช่น `YANe4EE`), `นพ. ...`, `พญ. ...` และติ๊กเลือก `is_doctor_document = true` ให้อัตโนมัติ
  * **หมวดหมู่เอกสาร (`category_id`)**: สำหรับใบ Visit Slip ระบบจะจับคู่กับรหัสหมวดหมู่ `OPD-NOTE` (ID 1: บันทึกการตรวจผู้ป่วยนอก) ของโรงพยาบาลยันฮีโดยตรง
  * **โหมดตรวจจับ Hybrid**: เมื่ออ่านได้ทั้งบาร์โค้ดและข้อความ OCR ระบบจะแสดงป้าย `[ตรวจจับอัตโนมัติ (Hybrid: Barcode + OCR)]` พร้อมระดับความเชื่อมั่น 99%

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

---

## 📁 สถาปัตยกรรมการจัดเก็บไฟล์แยกตามโฟลเดอร์ HN (HN-Partitioned Storage Engine)

เพื่อความเป็นระเบียบและประสิทธิภาพการจัดการไฟล์ในระดับ Production (ระดับแสนถึงล้านไฟล์):

1. **โครงสร้างโฟลเดอร์แบบจำแนกตาม HN**:
   * ไฟล์เอกสารสแกนและ PDF ทั้งหมดถูกจัดเก็บแยกเป็นโฟลเดอร์ตามหมายเลขประจำตัวผู้ป่วย (HN):
     ```
     backend/storage/documents/
     ├── 08-24-00030/
     │   ├── 08-24-00030_20261005093135_a4d32227.png
     │   ├── doc-01.pdf
     │   └── doc_opd_clinical_chart.png
     ├── 08-20-800150/
     ├── 08-07-000914/
     └── 000000001/
     ```
   * หมดปัญหาไฟล์กระจัดกระจายปะปนกันที่ root โฟลเดอร์
2. **โมดูลควบคุมและแก้ไข Path (`backend/app/core/storage.py`)**:
   * `hn_folder(hn)`: กรอง Sanitization ป้องกัน Path Traversal (`../`) และสร้างโฟลเดอร์คนไข้ให้อัตโนมัติ
   * `build_storage_path(hn, filename)`: จัดเก็บไฟล์ลงโฟลเดอร์ HN และคืนค่าเป็น **Relative Path** (`{HN}/{filename}`) สำหรับบันทึกลงฐานข้อมูล
   * `resolve_storage_path(file_path)`: รองรับทั้ง Relative Path ใหม่, Absolute Path เดิม และ Fallback เก่า ทำให้ระบบเข้ากันได้ย้อนหลัง 100%
3. **การแปลงข้อมูลเก่าแบบปลอดภัย (Live Storage Migration - `migrate_storage_by_hn.py`)**:
   * ย้ายไฟล์เดิมทั้งหมด 28 รายการเข้าสู่โฟลเดอร์ตาม HN สำเร็จ 100% (Errors = 0)
   * ใช้กลยุทธ์ **Copy-then-Cleanup** ปลอดภัยต่อไฟล์ Mock ที่ถูกผูกกับหลาย HN และล้างไฟล์ซ้ำซ้อนที่ root อย่างหมดจด

---

## 📅 ระบบวันที่รับบริการ (Visit Date) และการเรียงลำดับ Tree View แบบ Descending

1. **ช่องกรอกวันที่รับบริการ (Visit Date) ในหน้า Scan**:
   * อยู่ในส่วน *ข้อมูลการรับบริการ (Encounter)*
   * **ตรวจจับและล็อกอัตโนมัติจาก HIS**: หากระบบตรวจพบว่า VN / Encounter มีอยู่ในประวัติของคนไข้แล้ว ระบบจะดึง `visit_date` ขึ้นมาให้อัตโนมัติ พร้อมแสดง Badge **"จากระบบ HIS 🔒"** และปิดการแก้ไข เพื่อป้องกันข้อมูลขัดแย้ง
   * **กำหนดวันตรวจรักษาสำหรับ VN ใหม่**: หากเป็น VN ใหม่ เจ้าหน้าที่สามารถเลือกวันที่ตรวจรักษาได้ตามจริง (จำกัดไม่เกินวันปัจจุบัน) พร้อมแสดงปี พ.ศ. กำกับ
2. **การจัดกลุ่มใน Tree View แบบเรียงจากใหม่ไปเก่า (Descending Chronological Order)**:
   * ในหน้า View เอกสารจะถูกจัดกลุ่มตาม `Encounter.visit_date` (และ fallback เป็น `scan_date` เวลาไทย `Asia/Bangkok`)
   * ปรับการเรียงลำดับกลุ่มวันที่จาก **"วันล่าสุด ➔ วันในอดีต"** (เช่น `05-10-2026`, `03-10-2026`, `28-02-2020`...) เพื่อให้แพทย์เห็นประวัติการตรวจปัจจุบันได้ทันทีโดยไม่ต้องเลื่อนลงล่าง
   * ปรับใช้ `joinedload(Document.encounter)` ใน Backend เพื่อดึงข้อมูลรวดเร็วในรอบเดียว (Zero N+1 Query)

---

## 🔤 ระบบฟอนต์มาตรฐานโรงพยาบาลแบบออฟไลน์ 100% (Offline Hospital Typography)

1. **รองรับ Intranet โรงพยาบาล 100% (Zero External CDN Dependency)**:
   * ติดตั้งฟอนต์ Google Fonts **Sarabun** (Regular, Medium, SemiBold, Bold) และ **TH Sarabun PSK** ไว้ใน `frontend/public/fonts/`
   * โหลดผ่าน `next/font/local` ใน `app/layout.tsx` ทำให้หน้าเว็บโหลดเร็วทันที แม้เครื่องลูกข่ายในโรงพยาบาลจะไม่มีการเชื่อมต่ออินเทอร์เน็ตภายนอก
2. **ความสม่ำเสมอของ UI และปราศจาก Hydration Error**:
   * กำหนดขนาดตัวอักษรและ Line-height ที่เหมาะสมกับภาษาไทย อ่านง่าย สบายตา
   * ป้องกันปัญหา React Hydration Mismatch และการสลับฟอนต์กระพริบ (FOUT)

---

## 📊 สถานะความคืบหน้าของโครงการ (Current Progress & Milestones)

| โมดูล / ฟีเจอร์ | สถานะ | รายละเอียด |
|---|:---:|---|
| **E-Scan Viewer Layout (/view)** | ✅ เสร็จสมบูรณ์ | รองรับ 3 คอลัมน์, ย่อ/ขยาย Sidebar, Touch Gestures, Watermark |
| **Interactive Canvas Engine** | ✅ เสร็จสมบูรณ์ | ซูม 20%-400%, Pan, หมุน 90°, ฟิลเตอร์สี, พิมพ์รายงาน |
| **Zero-Disk PyMuPDF Streaming** | ✅ เสร็จสมบูรณ์ | สตรีมหน้า PDF On-The-Fly พร้อมปุ่มเปิด PDF ต้นฉบับ |
| **Document Scanning (/scan)** | ✅ เสร็จสมบูรณ์ | รองรับทั้งสแกนเนอร์ TWAIN/WIA (Port 18000) และไฟล์ PDF/ภาพ |
| **Thai AI OCR (PaddleOCR ONNX)**| ✅ เสร็จสมบูรณ์ | อ่านชื่อไทย, อายุ, วันเกิด, แพทย์, HN/VN และหมุนภาพอัตโนมัติ |
| **Dynamic Category & Combobox** | ✅ เสร็จสมบูรณ์ | ดึงประเภทหมวดหมู่จาก DB จริง, เลื่อนลื่นไหล, เพิ่มหมวดหมู่ใหม่สด |
| **Visit Date & HIS Encounter Sync** | ✅ เสร็จสมบูรณ์ | กรอก/ล็อกวันที่รับบริการ, Tree View เรียง Descending ใหม่➔เก่า |
| **HN-Partitioned Storage** | ✅ เสร็จสมบูรณ์ | เก็บไฟล์แยกโฟลเดอร์ตาม `{HN}/...`, Relative Path ใน DB, ย้ายไฟล์ครบ 100% |
| **Save Confirmation Modal** | ✅ เสร็จสมบูรณ์ | แสดงการ์ดสรุปข้อมูลเอกสาร พร้อมปุ่มเปิดดูทันทีและปุ่มสแกนเคสถัดไป |
| **Offline Hospital Fonts** | ✅ เสร็จสมบูรณ์ | ฟอนต์ Sarabun และ TH Sarabun PSK ผ่าน LocalFont 100% ออฟไลน์ |
| **Docker 2-Server Stack** | ✅ เสร็จสมบูรณ์ | แยก Frontend (8031) และ Backend/DB (8033/5434) ปลอดภัย ไม่ชนแอปอื่น |

---

## 🐳 การขึ้นระบบจริงด้วย Docker บน Ubuntu 24.04 LTS (Distributed 2-Server Deployment)

> 📘 **ดูคู่มือฉบับสมบูรณ์พร้อมคำสั่งอัปเดตโค้ดทีละขั้นตอนได้ที่:** [**`DEPLOYMENT_GUIDE.md`**](DEPLOYMENT_GUIDE.md)

ระบบถูกออกแบบสำหรับสถาปัตยกรรมระดับ Production ของโรงพยาบาล โดยแบ่งการทำงานออกเป็น **2 เซิร์ฟเวอร์** เพื่อประสิทธิภาพการจัดเก็บไฟล์สแกนและป้องกันการชนพอร์ต (Port Collision) กับแอปพลิเคชันอื่นในอนาคต:

### 1. ผังการจัดสรรพอร์ตแยกเฉพาะ (Port Allocation Scheme)

| เซิร์ฟเวอร์ | บทบาทบริการ | พอร์ตที่กำหนด | ตัวแปรคอนฟิก | รายละเอียด |
|---|---|:---:|---|---|
| **Server 1 (`10.200.120.31`)** | **Frontend Web & Nginx Gateway** | **`8031`** | `FRONTEND_PORT` | ลงท้ายด้วย 31 ตาม IP เครื่อง, ป้องกันการชนพอร์ต 80 ของแอปอื่น |
| **Server 2 (`10.200.120.33`)** | **Backend API (FastAPI Engine)** | **`8033`** | `BACKEND_PORT` | ลงท้ายด้วย 33 ตาม IP เครื่อง, Uvicorn 4 workers |
| **Server 2 (`10.200.120.33`)** | **PostgreSQL 14+ Instance** | **`5434`** | `DATABASE_URL` | ฐานข้อมูล `yanhee_escan_db` |

---

### 2. ขั้นตอนการติดตั้งบน Server 2 (`10.200.120.33`) — Backend + DB

```bash
# 1. Clone โค้ดลงเครื่อง
git clone https://github.com/vick42uho/e-scan.git dms
cd dms

# 2. ตั้งค่าไฟล์ .env สำหรับ Backend
cp .env.backend.example .env

# 3. เปิด Firewall พอร์ต 8033
sudo ufw allow 8033/tcp comment "Yanhee DMS Backend API"

# 4. สั่งรัน Backend Container
docker compose -f docker-compose.backend.yml up -d --build

# 5. ตรวจสอบและสร้างฐานข้อมูล + ตารางทั้งหมดโดยอัตโนมัติ
docker compose -f docker-compose.backend.yml exec backend uv run python scripts/init_db.py

# 6. (ทางเลือก) สร้าง Mock Data สำหรับทดสอบระบบ
docker compose -f docker-compose.backend.yml exec backend uv run python scripts/seed_mock_data.py

# 7. ตรวจสอบ Health Check
curl http://localhost:8033/health
```

---

### 3. ขั้นตอนการติดตั้งบน Server 1 (`10.200.120.31`) — Frontend Server

```bash
# 1. Clone โค้ดลงเครื่อง
git clone https://github.com/vick42uho/e-scan.git dms
cd dms

# 2. ตั้งค่าไฟล์ .env สำหรับ Frontend
cp .env.frontend.example .env

# 3. เปิด Firewall พอร์ต 8031
sudo ufw allow 8031/tcp comment "Yanhee DMS Frontend Web"

# 4. สั่งรัน Frontend + Nginx Gateway
docker compose -f docker-compose.frontend.yml up -d --build

# 5. ตรวจสอบสถานะว่า Gateway ส่งต่อข้ามเครื่องสำเร็จ
curl http://localhost:8031/health
```

---

### 4. การเข้าใช้งานระบบ
* **หน้าเว็บระบบสแกนและเปิดดูเอกสาร**: `http://10.200.120.31:8031/`
  * หน้าดูเอกสารเวชระเบียน: `http://10.200.120.31:8031/view`
  * หน้าสแกนเอกสาร: `http://10.200.120.31:8031/scan`
* **Swagger API Documentation**: `http://10.200.120.31:8031/docs` หรือ `http://10.200.120.33:8033/docs`

---

### 5. วิธีการอัปเดตโค้ดบนทั้งสองเซิร์ฟเวอร์ (How to Update Production Servers)

> ⚠️ **คำเตือนสถาปัตยกรรม (แยก 2 เซิร์ฟเวอร์เด็ดขาด)**:
> หน้าบ้าน (`10.200.120.31`) และหลังบ้าน (`10.200.120.33`) แยกเครื่องกันชัดเจน **ห้ามรันคำสั่งสลับเครื่องเด็ดขาด!**

#### 🔹 บน Server 2 (`10.200.120.33`) — Backend API + Database
```bash
cd /home/it-dev/dms   # หรือโฟลเดอร์โปรเจกต์บนเครื่อง
git pull origin main

# สั่ง Rebuild Backend Container (ติดตั้ง uv dependencies ใหม่ รวมถึง rapidocr-onnxruntime)
docker compose -f docker-compose.backend.yml up -d --build backend

# ตรวจสอบว่า RapidOCR และ ONNX Runtime ทำงานได้สมบูรณ์ใน Container
docker compose -f docker-compose.backend.yml exec backend uv run python -c "from rapidocr_onnxruntime import RapidOCR; print('RapidOCR Ready')"

# (ทางเลือก) อัปเดตข้อมูลตัวอย่างจำลองคนไข้และเลข VN
docker compose -f docker-compose.backend.yml exec backend uv run python scripts/seed_mock_data.py

# ตรวจสอบ Health Check หลังบ้าน
curl http://localhost:8033/health
```

#### 🔹 บน Server 1 (`10.200.120.31`) — Frontend Web + Nginx Gateway
```bash
cd /home/it-dev/dms   # หรือโฟลเดอร์โปรเจกต์บนเครื่อง
git pull origin main

# สั่ง Rebuild Frontend Container (Next.js 16 Standalone)
docker compose -f docker-compose.frontend.yml up -d --build frontend

# ตรวจสอบ Health Check ผ่าน Nginx Gateway หน้าบ้าน
curl http://localhost:8031/health
```




