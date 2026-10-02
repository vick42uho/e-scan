---
name: yanhee-dms
description: >-
  Master knowledge base and operational blueprint for the Yanhee Hospital Document Management System (DMS)
  and Yanhee e-Scan System v3.1 Secured (FastAPI + PostgreSQL + Next.js 16 + Tailwind CSS + shadcn sidebar-10).
  Covers end-to-end architecture, HIS/EMR URL integration (/view?hn=...&vn=...&user=...), secured document viewer
  with dynamic watermarking ("สำเนาถูกต้อง COPY"), zoom/pan/rotate/color filters canvas, right-hand thumbnail strip,
  in-chart document search, doctor attribution (Doctor vs Non-Doctor), My Documents filter for physicians,
  multi-level patient document tree (nested by Visit Date under Caregiver and Category), scanner role auditing
  (Doctor, Nurse, Staff), database schema (patients, encounters, documents, pages, audit_logs), and strict
  modular component-driven frontend architecture.
---

# Yanhee Hospital e-Scan System (DMS) v3.1 — Knowledge Base & Architecture Blueprint

## 1. System Overview & Architecture

The **Yanhee e-Scan System (DMS)** is the mission-critical hospital document management and electronic medical record scanning system for **Yanhee Hospital (โรงพยาบาลยันฮี)**. It bridges the hospital Information System (HIS / Arcus Air OPD EMR) with high-resolution scanned medical charts, surgical consents, clinical examination notes, lab slips, and administrative deposit documents.

```
+---------------------------------------------------------------------------------------------------+
|                                  HIS / OPD EMR (Arcus Air / Hospital App)                         |
|   - "DMS" Launch Button triggers: http://<dms-host>/view?hn={HN}&vn={VN}&user={StaffId}          |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                Next.js 16 App Router Frontend (Port 3000)                         |
|   - Stack: Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS, shadcn/ui (Radix)         |
|   - Left: EscanSidebar (sidebar-10 pattern):                                                      |
|     * PatientProfileCard: Patient demographics, allergies, insurance rights                       |
|     * DocumentSearchInput: Live in-chart search (by document name, code, doctor, category)        |
|     * ViewModeTabs: Doctor (เอกสารแพทย์) | Non Doctor (พยาบาล/ทั่วไป) | Admin (ธุรการ) | All (ทั้งหมด) |
|     * My Documents Toggle: Instant 1-click filter for physicians to see only their consultations   |
|     * DocumentGroupFilter: Visit Date | Caregiver (nested visits) | Category (nested visits)      |
|     * DocumentTreeView: Multi-level collapsible tree with [แพทย์] / [พยาบาล] badges & page counts |
|   - Center: DocumentViewerCanvas - Interactive Canvas (Zoom 20%-400%, Pan, Rotate 90°, Filters)   |
|   - Dynamic Watermark: SVG/Canvas overlay with "สำเนาถูกต้อง COPY", Staff ID, Date/Time Stamp    |
|   - Collapsible Sidebars: 1-click fold/expand for Left Tree (key: `[`) & Right Thumbnails (key: `]`)|
|     * Floating Edge Tab Handles (`เปิดเมนู` / `หน้ารวม`) for instant restoration on hover/click   |
|   - Mobile Responsiveness & Touch Architecture:                                                   |
|     * Canvas expands to 100% full width on mobile (`max-w-[96vw]`) for maximum reading area        |
|     * Right thumbnail strip adapts to an overlay Slide-over Sheet (`Sheet side="right"`) on mobile|
|     * Always-visible compact page switcher `< 1 / 2 >` in mobile toolbar for quick 1-tap navigation|
|     * Native Touch Gestures: 1-finger touch pan, horizontal swipe for Prev/Next, double-tap zoom   |
|   - Right: ThumbnailStrip - Multi-page vertical navigation with active A4 card preview            |
|   - Top: TopNavbar - Yanhee branding ("v3.1 Secured"), patient banner, 1-click user personas      |
|   - Dialogs: PrintDialog - Secured print workflow with mandatory audit logging                    |
+-------------------------------------------------+-------------------------------------------------+
                                                  | REST APIs (/api/v1/*)
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 FastAPI Backend Engine (Port 8000)                                |
|   - Python 3.13+ managed by uv                                                                    |
|   - Layered Architecture: api/v1/ -> services/ -> models/ & core/db -> schemas/                   |
|   - Endpoints:                                                                                    |
|     * /api/v1/patients/{hn} & /search (Patient demographics and encounter history)                |
|     * /api/v1/documents/tree/{hn} (Hierarchical multi-level nested tree with search & doctor filter)|
|     * /api/v1/documents/{id} & pages/{num}/file (Streaming file & dynamic watermarking via Pillow)|
|     * /api/v1/audit/log (Mandatory compliance audit trail on VIEW, PRINT, DOWNLOAD)               |
+-------------------------------------------------+-------------------------------------------------+
                                                  | Connection Pool (psycopg / SQLAlchemy 2.0)
                                                  v
+---------------------------------------------------------------------------------------------------+
|                            PostgreSQL Database Server (10.200.11.2:5432)                          |
|   - Database: yanhee_escan_db                                                                     |
|   - User: dev_admin (Password: it240)                                                             |
|   - Tables: patients, encounters, document_categories, documents, document_pages, audit_logs     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Core Concepts: Doctor vs. Non-Doctor & Scanner Attribution

### 2.1 Streamlined Tab Taxonomy (Doctor vs. Not Doctor):
In real-world hospital document workflows, patients do not have cluttered/fragmented tabs. Instead, the interface naturally and cleanly bifurcates into 2 primary views:
* **`Doctor` (เอกสารแพทย์)**:
  - Clinical documents created, examined, or authorized by physicians.
  - Grouping options available:
    1. **`Visit Date`**: Ordered by latest visit date first (`scan_date.desc()`) -> documents.
    2. **`Caregiver`**: Physician name -> nested Visit Date -> documents.
    3. **`Category`**: Clinical category (OPD, Operative Note, etc.) -> nested Visit Date -> documents.
  - Also displays the **"เฉพาะเอกสารของฉัน (My Documents)"** filter for attending physicians.
* **`Not Doctor` (เอกสารทั่วไป / พยาบาล / ธุรการ)**:
  - Non-physician documents recorded by nurses, registration staff, cashier, or patient consents.
  - Grouping options available:
    1. **`Visit Date`**: Ordered by latest visit date first (`scan_date.desc()`) -> documents.
    2. **`Category`**: Category (Consent, Registration, Deposit, Pharmacy) -> nested Visit Date -> documents.
  - *(Note: `Caregiver` is intentionally omitted because non-doctor documents do not belong to an attending physician).*

### 2.2 Physician Workflow ("ถ้าเป็นหมอเข้ามา..."):
* When a doctor accesses the chart (e.g. `user=YH00412` or physician role):
  1. The **"เฉพาะเอกสารของฉัน (My Documents)"** toggle allows the doctor to instantly isolate records where they are the attending physician (`doctor_code == YH00412`).
  2. The **Caregiver** grouping mode surfaces their name (`นพ. สุทธิพงษ์ วิริยะสกุล`) with all patient visits under their care nested by visit date.
  3. Viewer Header prominently displays **"แพทย์ผู้ตรวจ: นพ. ..."** with a dedicated stethoscope badge.

### 2.3 Scanner Role Attribution ("ผู้สแกนเป็นใครได้บ้าง"):
Hospital best practice distinguishes between **Attending Physician (แพทย์ผู้ตรวจ)** and **Scanner/Uploader (ผู้สแกนนำเข้า)**:
- `Doctor` (แพทย์สแกนเอง): For private surgical sketches, external clinic records brought by patient.
- `Nurse` (พยาบาลประจำจุดตรวจ): For point-of-care emergency consents and ward documents.
- `Staff` (เจ้าหน้าที่เวชระเบียน / ธุรการ): For post-discharge chart batch scanning and administrative deposits.

### 2.4 Demo User Personas (1-Click Switcher):
The system provides 4 built-in personas in the TopNavbar:
1. **👨‍⚕️ นายแพทย์ สุทธิพงษ์ วิริยะสกุล** (ID: `YH00412`, บทบาท: `แพทย์ผู้ตรวจ`, แผนก: `อายุรกรรมทั่วไป`)
   - Direct Link: `http://localhost:3000/view?hn=08-24-00030&user=YH00412&role=doctor`
   - Activates "เฉพาะเอกสารของฉัน (My Documents)" filter to isolate their consultation charts.
2. **👨‍⚕️ นายแพทย์ สุรชัย พัฒนากูล** (ID: `YH00355`, บทบาท: `ศัลยแพทย์`, แผนก: `ศัลยกรรม`)
   - Direct Link: `http://localhost:3000/view?hn=08-24-00030&user=YH00355&role=doctor`
   - Shows surgical charts & Operative Notes under Dr. Surachai.
3. **👩‍⚕️ พว. วราภรณ์ แสนดี** (ID: `NURSE-04`, บทบาท: `พยาบาลวิชาชีพ`, แผนก: `OPD พยาบาล`)
   - Direct Link: `http://localhost:3000/view?hn=08-24-00030&user=NURSE-04&role=nurse`
   - Shows consent forms and nurse-scanned documents with violet badge.
4. **🏢 Yanhee Staff** (ID: `YH1005`, บทบาท: `เจ้าหน้าที่เวชระเบียน`, แผนก: `ศูนย์สแกนและเวชระเบียน`)
   - Direct Link: `http://localhost:3000/view?hn=08-24-00030&user=YH1005&role=staff`
   - Default master scanning staff role.

### 2.5 Next.js Reverse Proxy Architecture:
To prevent CORS and broken relative image/thumbnail URLs (`/api/v1/...`):
- `next.config.ts` rewrites `/api/v1/:path*` to `http://127.0.0.1:8000/api/v1/:path*`.
- Both relative URLs (`/api/v1/...`) and absolute URLs (`http://localhost:8000/api/v1/...`) resolve seamlessly.
- Thumbnail card and canvas handle `onLoad` + `onError` with `key={fileUrl}` to guarantee zero infinite spinners.

---

## 3. Multi-Level Hierarchical Tree Structure

### Dynamic Grouping Modes:
1. **`Visit Date` (Always Available)**:
   - Level 1: `📅 วันที่ Visit` (เรียงตามวันที่ Visit ล่าสุดขึ้นก่อน เช่น `02-10-2026`, `28-02-2020`, `15-11-2019`, `24-06-2019`, `18-12-2018`)
   - Level 2: Document Leaf Nodes with `[แพทย์]` หรือ `[ทั่วไป/พยาบาล]` badges and page counts.

2. **`Caregiver` (Doctor Tab Only)**:
   - Level 1: Physician Name (e.g. `👨‍⚕️ นพ. สุทธิพงษ์ วิริยะสกุล`, `👨‍⚕️ นพ. สุรชัย พัฒนากูล`)
   - Level 2: **Visit Date!** (e.g. `📅 Visit: 28-02-2020`, `📅 Visit: 18-12-2018`)
   - Level 3: Documents for that visit under that caregiver.

3. **`Category` (Always Available)**:
   - Level 1: Document Category (e.g. `📁 ประวัติการรักษา / OPD Record`, `📁 หนังสือยินยอมผ่าตัด (Consent)`, `📁 ใบรับฝากทรัพย์สิน`)
   - Level 2: **Visit Date!** (e.g. `📅 Visit: 28-02-2020`, `📅 Visit: 15-11-2019`)
   - Level 3: Documents for that category on that visit date.

---

## 4. In-Chart Document Search

The sidebar search input is strictly an **In-Chart Document Search** (ค้นหาเอกสารในเวชระเบียนนี้):
- Matches document title, document code (e.g. `RT_Common_267`, `CLINICAL_CHART_02`), physician name, category name, or scanner name.
- Real-time instant filtering of the tree with active document count feedback (`พบ X เอกสาร`).

---

## 5. Sample Document Assets Mapping

| Asset Name | Source File | Description | Type / Pages |
| :--- | :--- | :--- | :--- |
| `OPD-MED-01` | `doc_opd_clinical_chart.png` | Doctor's Clinical Record & Physical Exam (นพ. สุทธิพงษ์) | Doctor (1 Page A4) |
| `SURG-NOTE-01` | `doc_operative_note.png` | Operative Note & Surgical Record - ผ่าตัดไส้ติ่งผ่านกล้อง (นพ. สุรชัย) | Doctor (1 Page A4) |
| `SUR-CONSENT-01` | `doc_consent_surgery.png` | Consent for Surgery & Procedures (พว. วราภรณ์ สแกน) | Non-Doctor (1 Page A4) |
| `LAB-2019-06` | `doc_lab_report.png` | Clinical Laboratory Report (CBC & Chemistry - ทนพ. พิเชษฐ์) | Doctor (1 Page A4) |
| `XRAY-CHEST-01` | `doc_xray_chest.png` | Chest X-Ray Digital PA Report (นพ. ชาญวิทย์ รังสีแพทย์) | Doctor (1 Page A4) |
| `PROGRESS-NOTE-18`| `doc_progress_note.png` | Follow-up Clinical Progress Note - SOAP (นพ. สุทธิพงษ์) | Doctor (1 Page A4) |
| `PHARM-DISP-01` | `doc_pharm_dispense.png` | Pharmacy Prescription & Dispensing Record (ภก. รัตนชัย) | Non-Doctor (1 Page A4) |
| `RECEIPT-2018-08`| `doc_finance_receipt.png` | Official Medical Fee Receipt (เจ้าหน้าที่การเงิน) | Non-Doctor (1 Page A4) |
| `REG-2020-001` | `doc_p1_reg_page1.png`, `doc_p1_reg_page2.png` | Patient Registration Form & ID Card Copy (เจ้าหน้าที่เวชระเบียน) | Non-Doctor (2 Pages A4) |
| `RT_Common_267` | `doc_property_deposit.jpg` | Patient Property Deposit Form (สแกนจริง 1428x2020 จาก docx) | Non-Doctor (1 Page A4) |
| `QA_CLINICAL_03` | `doc_03_page1.jpg` ~ `page3.jpg` | Clinical Quality Committee & Accreditation Report (3 หน้า) | Doctor (3 Pages A4) |
| `CONSENT-ALC-01`| `doc_suphapong_consent.jpg` | หนังสือแสดงความยินยอมตรวจสารเสพติด (นาย ศุภพงศ์) | Non-Doctor (1 Page A4) |
| `MED-CERT-01` | `doc_jiraporn_medcert.png` | Medical Certificate Record (นางสาว จิราพร - พญ. น้ำมณี) | Doctor (1 Page A4) |
| `REG-2020-002` | `doc_nattaporn_reg.jpg` | AAD_New Patient Registration Form (นางสาว ณัฐพร) | Non-Doctor (1 Page A4) |
| `PED-SURG-01` | `doc_weeritphol_pedsurg.jpg` | Pediatric Surgery Consultation Form (เด็กชาย วีริทธิ์พล) | Doctor (1 Page A4) |

---

## 6. Operational Runbooks & Commands

### 1-Click Startup:
Double click `start_dev.bat` in the repository root.

### Manual Backend Commands:
```bash
cd backend
uv sync
uv run python scripts/init_db.py
uv run python scripts/seed_mock_data.py
uv run uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### Manual Frontend Commands:
```bash
cd frontend
bun install
bun run typecheck
bun run build
bun run dev --port 3000
```

---

## 7. Mobile & Tablet Responsiveness & Touch Architecture

### 7.1 The Mobile Screen Real-Estate Challenge:
On standard mobile devices (viewport width 360px – 430px), maintaining an inline 2-column or 3-column layout (such as a 160px right thumbnail strip alongside the canvas) eats up over 45% of the screen. This severely compresses the medical document canvas down to ~180px–200px, rendering scanned charts unreadable.

### 7.2 Strict Responsive Rules & Implementation:
1. **Full-Width Canvas (`hidden md:flex` on Right Thumbnail Column)**:
   - The desktop inline thumbnail strip is strictly hidden on mobile with `hidden md:flex`.
   - The canvas expands to 100% full width (`max-w-[96vw]` on mobile vs `md:max-w-[85vw]` on desktop), allowing physicians to read clinical charts at full legibility without constant pinching.

2. **Mobile Thumbnail Sheet (Slide-Over Drawer)**:
   - On mobile, clicking **"หน้ารวม (X)"** on the toolbar triggers an overlay `Sheet` (`side="right"`, `w-72 max-w-[85vw]`).
   - Tapping any page card calls `viewerControls.setPage(pageNumber)` and **automatically closes the drawer**, returning the user directly to the full-screen document view.

3. **Smart Contextual Page Switcher `< 1 / 2 >`**:
   - **Desktop (`md:`)**: Hidden when the right thumbnail strip is open (to eliminate visual redundancy); automatically reappears when the user folds the right strip (`!rightSidebarOpen`).
   - **Mobile (`< md`)**: **Always visible** in the toolbar (`rightSidebarOpen ? "flex md:hidden" : "flex"`), ensuring 1-tap thumb navigation without having to open the drawer.

4. **Native Touch Gestures & Ergonomics**:
   - **Touch Pan (1-finger drag)**: Smooth panning across large documents with `touchAction: "none"` to prevent unwanted mobile browser pull-to-refresh or rubber-banding.
   - **Horizontal Swipe (Page Flip)**: Quick flick/swipe left (`dx < -50px`, `dt < 350ms`) advances to next page; swipe right returns to previous page (active when zoom $\le 1.2\times$).
   - **Double-Tap**: Quick double-tap toggles between fit-to-screen and 100% actual size.

5. **Responsive Toolbar & Header**:
   - Desktop-only buttons (like the left sidebar toggle in the toolbar) are hidden on mobile with `hidden md:flex`, preventing redundant clutter since mobile uses the TopNavbar hamburger menu.
   - Toolbar uses `overflow-x-auto no-scrollbar` to guarantee no ugly wrapping or clipped buttons on small viewports.
   - Header truncates title and doctor badge cleanly (`max-w-[85px] xs:max-w-[120px] sm:max-w-[160px]`).

6. **React 19 & Next.js Dev Warning Prevention**:
   - Never assign `ref.current` during render (e.g. `selectedDocIdRef.current = selectedDocId;`).
   - Always wrap in `useEffect(() => { ref.current = value; }, [value])` to prevent React 19 render warnings and the red Next.js dev overlay badge (`(N) 2 Issues`).

