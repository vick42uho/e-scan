# Yanhee e-Scan System (DMS) v3.1 Secured
**ระบบจัดเก็บและเปิดดูเอกสารเวชระเบียนสแกน โรงพยาบาลยันฮี**

---

## 🏗️ โครงสร้างสถาปัตยกรรม (Project Architecture)

โปรเจกต์ถูกออกแบบตามหลักการ **Modular & Reusable Components** โดยแยกฝั่ง Backend และ Frontend ชัดเจน ไม่เขียนโค้ดยาวในไฟล์เดียว และทุก Component ถูกออกแบบให้สามารถนำไปใช้ซ้ำในหน้าอื่นๆ ได้ทันที

```
DMS/
├── backend/                       # Python FastAPI Backend (จัดการด้วย uv)
│   ├── app/
│   │   ├── api/v1/                # API Routers แยกตาม Entity (patients, documents, files, audit)
│   │   ├── core/                  # Database Engine (PostgreSQL) และ App Settings
│   │   ├── models/                # SQLAlchemy Models (Patient, Encounter, Document, AuditLog)
│   │   ├── schemas/               # Pydantic Schemas (DTOs ตรวจสอบ Input/Output)
│   │   ├── services/              # Business Logic (PatientService, DocumentService, FileService, AuditService)
│   │   ├── utils/                 # Utility: Dynamic Watermark Generator (Pillow)
│   │   └── main.py                # FastAPI Entrypoint (CORS & Lifespan)
│   ├── storage/                   # จัดเก็บไฟล์ภาพสแกนเวชระเบียน และ Thumbnails
│   └── scripts/
│       ├── init_db.py             # สคริปต์สร้างตารางฐานข้อมูลอัตโนมัติ
│       └── seed_mock_data.py      # สคริปต์จำลองข้อมูลผู้ป่วยและคัดลอกไฟล์ตัวอย่าง
│
├── frontend/                      # Next.js 16 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── app/view/page.tsx      # หน้า Coordinator เบาๆ (< 70 บรรทัด) เชื่อมต่อ Hooks เข้ากับ Layout
│   │   ├── components/
│   │   │   ├── common/            # Reusable Components (SearchInput, PatientBadge, StatusPill, LoadingSkeleton)
│   │   │   ├── viewer/            # DocumentViewerCanvas, ViewerToolbar, DynamicWatermark, ThumbnailStrip, PrintDialog
│   │   │   ├── sidebar/           # EscanSidebar, PatientProfileCard, ViewModeTabs, DocumentTreeView
│   │   │   └── layout/            # TopNavbar, ViewerLayout (Responsive 3 Columns + Mobile Drawer)
│   │   ├── hooks/                 # Custom Hooks แยก Logic (usePatient, useDocumentTree, useViewerControls, useKeyboardShortcuts)
│   │   ├── services/              # API Fetching Layer (patientApi, documentApi)
│   │   └── types/                 # TypeScript Interfaces ทั้งหมด
│
├── ตัวอย่าง/                       # โฟลเดอร์เอกสารและแบบจำลองอ้างอิงเดิม
└── start_dev.bat                  # สคริปต์ดับเบิลคลิกเดียว รันทั้ง Backend และ Frontend
```

---

## 🚀 วิธีการรันระบบ (Quick Start)

### วิธีที่ 1: ดับเบิลคลิกไฟล์เดียว
ดับเบิลคลิกไฟล์ `start_dev.bat` ที่โฟลเดอร์หลัก ระบบจะเปิดทั้ง Backend และ Frontend ในหน้าต่างแยกให้อัตโนมัติ

### วิธีที่ 2: รันผ่าน Command Line

#### 1. ฝั่ง Backend (FastAPI)
```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```
* **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

#### 2. ฝั่ง Frontend (Next.js)
```bash
cd frontend
bun run dev --port 3000
```

### 👤 ตัวอย่าง URL แยกตาม Role (แพทย์, พยาบาล, เจ้าหน้าที่เวชระเบียน):
* **👨‍⚕️ สำหรับแพทย์ผู้ตรวจ (Dr. Suthipong)**: 
  [http://localhost:3000/view?hn=08-24-00030&user=YH00412&role=doctor](http://localhost:3000/view?hn=08-24-00030&user=YH00412&role=doctor)
  *(มีฟิลเตอร์ "เฉพาะเอกสารของฉัน (My Documents)" สำหรับแพทย์ แสดงเฉพาะเคสที่ตนเองตรวจ และประทับตราลายน้ำชื่อแพทย์)*
* **👨‍⚕️ สำหรับศัลยแพทย์ (Dr. Surachai)**: 
  [http://localhost:3000/view?hn=08-24-00030&user=YH00355&role=doctor](http://localhost:3000/view?hn=08-24-00030&user=YH00355&role=doctor)
  *(แสดงบันทึกการผ่าตัด Operative Note และรายงานคุณภาพคลินิก 3 หน้า)*
* **👩‍⚕️ สำหรับพยาบาล OPD (Nurse Waraporn)**: 
  [http://localhost:3000/view?hn=08-24-00030&user=NURSE-04&role=nurse](http://localhost:3000/view?hn=08-24-00030&user=NURSE-04&role=nurse)
  *(สำหรับตรวจดูใบยินยอมผ่าตัด Consent for Surgery และประวัติการพยาบาล)*
* **🏢 สำหรับเจ้าหน้าที่เวชระเบียน (Medical Records Staff)**: 
  [http://localhost:3000/view?hn=08-24-00030&user=YH1005&role=staff](http://localhost:3000/view?hn=08-24-00030&user=YH1005&role=staff)
  *(สำหรับสแกนและตรวจสอบเอกสารเวชระเบียนทั้งหมดของผู้ป่วย)*

> **Tip**: สามารถกดเปลี่ยน Persona บน **Top Bar ขวาบน** ได้ทันทีโดยไม่ต้องพิมพ์ URL เอง!

## 🛡️ ฟังก์ชันความปลอดภัยและการใช้งาน

1. **HIS/EMR Integration URL**:
   * เรียกเปิดดูเอกสารผู้ป่วยผ่าน URL ได้ทันที:
     `/view?hn={HN}&vn={VN}&user={StaffId}`
2. **Dynamic Watermark**:
   * ประทับตรา *"สำเนาถูกต้อง COPY"* พร้อมระบุรหัสเจ้าหน้าที่ (`user_id`) และวันเวลา เพื่อความปลอดภัยตามมาตรฐานเวชระเบียน
3. **Interactive Document Canvas & Touch Gestures**:
   * ซูมเข้า/ออก (20% – 400%), หมุนภาพ (90° CCW / CW), ปรับขนาดพอดีจอ (Fit to Screen), ปรับสี (Color / Grayscale / Contrast / Invert)
   * รองรับการคลิกลากแพนภาพ (Pan/Drag) และลูกกลิ้งเมาส์ (Mouse Wheel Zoom)
   * รองรับ **Touch Gestures บนมือถือ & iPad**: ใช้นิ้วลากแพนภาพ (1-finger touch pan), ปัดซ้าย/ขวาเพื่อเปลี่ยนหน้า (Swipe page flip), ดับเบิ้ลแท็บเพื่อซูม (Double-tap zoom)
   * คีย์ลัดแป้นพิมพ์: `+`, `-`, `0`, `R`, ลูกศรซ้าย/ขวา, `Ctrl+P`, `[` (พับเมนูซ้าย), และ `]` (พับหน้ารวมขวา)
4. **Collapsible Sidebars & Mobile Responsive**:
   * พับเก็บเมนูประวัติเวชระเบียนฝั่งซ้าย และแถบหน้ารวมฝั่งขวาได้อิสระ เพื่อการอ่านเอกสารแบบเต็มจอ
   * บนหน้าจอมือถือ แถบหน้ารวมจะปรับเป็น **Slide-over Drawer** อัตโนมัติ ทำให้หน้าเอกสารขยายกว้างเต็ม 100% อ่านง่าย คมชัด ไม่ถูกบีบ
   * แถบ Toolbar มีปุ่ม `< 1 / 2 >` แสดงอัตโนมัติบนมือถือ หรือเมื่อพับแถบข้าง
5. **Audit Logging**:
   * ทุกครั้งที่มีการเปิดดูเอกสาร หรือสั่งพิมพ์ ระบบจะบันทึกลงตาราง `audit_logs` ใน PostgreSQL อัตโนมัติ

