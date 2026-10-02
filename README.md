# Yanhee e-Scan System (DMS) v3.1 Secured
**ระบบจัดเก็บและเปิดดูเอกสารเวชระเบียนสแกน โรงพยาบาลยันฮี (Yanhee Hospital)**

---

## 🏗️ โครงสร้างสถาปัตยกรรม (Project Architecture)

โปรเจกต์ถูกออกแบบตามหลักการ **Modular & Reusable Components** โดยแยกฝั่ง Backend และ Frontend ชัดเจน ไม่เขียนโค้ดยาวในไฟล์เดียว และทุก Component ถูกออกแบบให้สามารถนำไปใช้ซ้ำในระบบเวชระเบียนอื่นๆ ได้ทันที

```
DMS/
├── backend/                       # Python FastAPI Backend (จัดการด้วย uv)
│   ├── app/
│   │   ├── api/v1/                # API Routers แยกตาม Entity (patients, documents, files, audit)
│   │   ├── core/                  # Database Engine (PostgreSQL) และ App Settings
│   │   ├── models/                # SQLAlchemy Models (Patient, Encounter, Document, AuditLog)
│   │   ├── schemas/               # Pydantic Schemas (DTOs ตรวจสอบ Input/Output)
│   │   ├── services/              # Business Logic (PatientService, DocumentService, FileService, AuditService)
│   │   │                          # - FileService: สตรีมไฟล์ภาพและเรนเดอร์ PDF สดด้วย PyMuPDF (Zero Disk Bloat)
│   │   ├── utils/                 # Utility: Dynamic Watermark Generator (Pillow)
│   │   └── main.py                # FastAPI Entrypoint (CORS & Lifespan)
│   ├── storage/documents/         # จัดเก็บไฟล์ภาพสแกนเวชระเบียนและเอกสาร PDF จริง 100%
│   └── scripts/
│       ├── init_db.py             # สคริปต์สร้างตารางฐานข้อมูลอัตโนมัติ
│       └── seed_mock_data.py      # สคริปต์จำลองข้อมูลผู้ป่วยและเชื่อมโยงเอกสารสแกนจริง
│
├── frontend/                      # Next.js 16 + TypeScript + Tailwind CSS (Turbopack)
│   ├── app/view/page.tsx          # Coordinator Page เบาๆ รับเฉพาะ ?hn=... และส่งต่อ State
│   ├── components/
│   │   ├── common/                # Reusable Components (EmptyState, StatusPill, LoadingSkeleton)
│   │   ├── viewer/                # DocumentViewerCanvas, ViewerToolbar, ViewerHeader, ThumbnailStrip, PrintDialog
│   │   ├── sidebar/               # EscanSidebar, PatientProfileCard, DocumentGroupFilter, DocumentTreeView
│   │   └── layout/                # TopNavbar (Branding & Fullscreen), ViewerLayout (Responsive 3-Column + Drawers)
│   ├── hooks/                     # Custom Hooks แยก Logic (usePatient, useDocumentTree, useViewerControls, useKeyboardShortcuts)
│   ├── services/                  # API Fetching Layer (patientApi, documentApi)
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
* **Patient Profile ที่กระชับ**: ตัดข้อมูลส่วนเกินที่ไม่จำเป็นต่อการเปิดดูเวชระเบียน (เช่น สิทธิ์การรักษา, เลขบัตรประชาชน, แพ้ยา) ให้เหลือเฉพาะข้อมูลระบุตัวตนสำคัญ: ชื่อ (ไทย/อังกฤษ), HN, VN (Visit No.), เพศ, อายุ, และวันเกิดในรูปแบบ พ.ศ. ไทย (`12 พ.ค. 2518`)

### 2. การจัดวางกลุ่มข้อมูลแนบชิด (Gestalt Proximity & Compact Controls)
* **แถบจัดกลุ่มเอกสารแบบ Single-Line Segmented Control**: 
  * รวมปุ่มจัดกลุ่ม **`Visit Date`**, **`Care provider`**, **`Doc Type`** ไว้ในกล่อง Segmented Control แถวเดียว 3 ช่องเท่ากัน
  * ป้องกันการตัดคำตกบรรทัด (`whitespace-nowrap`) ทำให้ปุ่มมีความสูงกะทัดรัด (Compact) เรียบหรู ไม่ดูใหญ่หรือเทอะทะ
* **ตัวกรองประเภทคนไข้แนบชิด (Attached Sub-Filters)**:
  * ปุ่มตัวกรอง `[ OPD | IPD | O+I ]` ถูกจัดวางให้**แนบชิดติดกับคำว่า "ประเภทคนไข้:"** ทันที ไม่ใช้ `justify-between` ที่ทำให้ปุ่มลอยเคว้งไปชิดขอบขวาสุด

---

## 🚀 วิธีการรันระบบ (Quick Start)

### วิธีที่ 1: ดับเบิลคลิกไฟล์เดียว (แนะนำ)
ดับเบิลคลิกไฟล์ `start_dev.bat` ที่โฟลเดอร์หลัก ระบบจะเปิดทั้ง Backend และ Frontend ในหน้าต่างแยกให้อัตโนมัติ

### วิธีที่ 2: รันผ่าน Command Line

#### 1. ฝั่ง Backend (FastAPI)
```bash
cd backend
uv sync
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

### 🔗 การเปิดดูเวชระเบียน (Clean URL):
ระบบรองรับการเปิดดูเวชระเบียนผู้ป่วยผ่าน URL ที่สะอาดและสั้นกระชับ:
* **เปิดดูประวัติคนไข้**: [http://localhost:3000/view?hn=08-24-00030](http://localhost:3000/view?hn=08-24-00030)
  *(ระบบไม่ยัดเยียด URL Parameters เสริม เช่น `&user=...` หรือ `&role=...` ลงใน Address Bar เพื่อความสะอาดและพร้อมต่อการเชื่อมต่อกับระบบ HIS ของโรงพยาบาล)*

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
