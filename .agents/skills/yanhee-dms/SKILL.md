---
name: yanhee-dms
description: >-
  Master knowledge base and operational blueprint for the Yanhee Hospital Document Management System (DMS)
  and Yanhee e-Scan System v3.1 Secured (FastAPI + PostgreSQL + Next.js 16 + Tailwind CSS + shadcn sidebar-10).
  Covers end-to-end architecture, clean HIS/EMR URL integration (/view?hn=...), strict UI/UX anti-redundancy rules,
  compact single-line segmented controls, natural proximity layout, secured document viewer with dynamic watermarking
  ("สำเนาถูกต้อง COPY"), zoom/pan/rotate/color filters canvas, zero-disk PDF direct streaming (PyMuPDF),
  right-hand thumbnail strip, in-chart document search, doctor attribution de-duplication, multi-level patient document tree
  (Visit Date with OPD/IPD/O+I, Care provider, Doc Type), database schema (patients, encounters, documents, pages, audit_logs),
  and strict modular component-driven frontend architecture.
---

# Yanhee Hospital e-Scan System (DMS) v3.1 — Knowledge Base & Architecture Blueprint

## 1. System Overview & Architecture

The **Yanhee e-Scan System (DMS)** is the mission-critical hospital document management and electronic medical record scanning system for **Yanhee Hospital (โรงพยาบาลยันฮี)**. It bridges the hospital Information System (HIS / Arcus Air OPD EMR) with high-resolution scanned medical charts, surgical consents, clinical examination notes, lab slips, and administrative deposit documents.

```
+---------------------------------------------------------------------------------------------------+
|                                  HIS / OPD EMR (Arcus Air / Hospital App)                         |
|   - "DMS" Launch Button triggers: http://<dms-host>/view?hn={HN}                                  |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                Next.js 16 App Router Frontend (Port 3000)                         |
|   - Stack: Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS, shadcn/ui (Radix)         |
|   - Left: EscanSidebar (sidebar-10 pattern):                                                      |
|     * PatientProfileCard: Clean patient demographics (Name TH/EN, HN, VN/EN, Gender, Age, Thai DOB)|
|     * DocumentSearchInput: Live in-chart search (by document name, code, doctor, category)        |
|     * DocumentGroupFilter: Sleek single-line segmented control:                                   |
|       - Visit Date (with natural inline sub-filter: ประเภทคนไข้: [ OPD | IPD | O+I ])               |
|       - Care provider (Physician / Caregiver grouping)                                            |
|       - Doc Type (Document category grouping)                                                     |
|     * DocumentTreeView: Multi-level collapsible tree with [แพทย์] / [ทั่วไป] badges & page counts |
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
|   - Top: TopNavbar - Yanhee branding ("v3.1 Secured"), online status badge, fullscreen toggle     |
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
|     * /api/v1/documents/tree/{hn} (Hierarchical tree with grouping & encounter filters)           |
|     * /api/v1/documents/{id}/pages/{num}/file (Direct PyMuPDF streaming & dynamic watermarking)   |
|     * /api/v1/documents/{id}/raw (Original raw PDF streaming for external viewer tab)             |
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

## 2. Strict UI/UX Standards & Anti-Redundancy Rules

Hospital clinicians, nurses, and medical record officers require an uncluttered, high-density, and ergonomically sound interface. The following strict UI/UX rules are enforced across the codebase:

### 2.1 Zero Redundant Information (ป้องกันการแสดงข้อมูลซ้ำซ้อน)
- **TopNavbar vs. Left Sidebar Patient Banner**:
  - `PatientProfileCard` in the left sidebar already displays the patient's name, HN, age, gender, and DOB.
  - Therefore, `TopNavbar` **must NOT** duplicate the patient banner when the sidebar is open.
  - The patient banner in `TopNavbar` is conditionally rendered **only when `!isSidebarOpen`** (when the sidebar is collapsed to maximize reading area).
- **Physician vs. Scanner Attribution in ViewerHeader**:
  - In clinical records authored and scanned by the same physician (e.g. `doctor_name === scan_by_name`), **suppress the duplicate scanner badge**.
  - Show only `แพทย์: {doctor_name}`. Do NOT print the identical person's name twice side-by-side.
  - Only show `ผู้สแกน: {scan_by_name}` if the physical uploader is genuinely a different person (e.g. nurse, medical record staff).
- **Clean Patient Demographics**:
  - Do NOT clutter the sidebar patient card with superfluous badges (e.g. allergies, national ID card number, payment schemes).
  - Keep the card strictly focused on essential medical identifiers: Avatar, Name (TH & EN), HN, Gender, Age, and Date of Birth in Thai Buddhist Era (`12 พ.ค. 2518`).

### 2.2 Gestalt Proximity & Layout Ergonomics (การจัดวางที่กระชับ ไม่ชิดขวา ไม่เกิดช่องว่างเคว้งคว้าง)
- **Sub-filters directly attached to labels**:
  - Never use `justify-between` blindly between a label and its button group if it creates a giant, disconnected void.
  - Example: `ประเภทคนไข้:` must be placed directly adjacent to `[ OPD | IPD | O+I ]` with `gap-2` (`flex items-center gap-2`), keeping them visually and cognitively grouped together.
- **Single-Line Segmented Control (ป้องกันปุ่มบวมหนาและ Text-Wrapping)**:
  - Document grouping tabs (`Visit Date`, `Care provider`, `Doc Type`) must live in a unified `grid grid-cols-3` segmented pill container (`bg-slate-200/80 rounded-lg`).
  - All button labels must have `whitespace-nowrap` to prevent awkward 2-line wrapping that balloons button height into bulky square blocks.
  - Buttons must be compact (`py-1`, `text-[11px] font-medium`), flat, and modern.

### 2.3 Clean Production URL Architecture
- The application URL must be strictly minimal:
  **`http://localhost:3000/view?hn={HN}`** (e.g. `/view?hn=08-24-00030`)
- Never push dummy persona query parameters (`&user=...&role=...`) into the browser address bar.
- Remove all dummy persona switcher dropdowns from the UI to ensure enterprise production readiness.
- Internal fallback (`user = "Staff"`) handles watermark stamps and audit logs gracefully without URL pollution.

---

## 3. Multi-Level Hierarchical Tree Structure

### Dynamic Grouping Modes:
1. **`Visit Date` (Default Mode)**:
   - Accompanied by inline sub-filter: `ประเภทคนไข้: [ OPD | IPD | O+I ]`
     * `OPD`: Filters encounters of type Out-Patient.
     * `IPD`: Filters encounters of type In-Patient (e.g. Surgery, Ward admission).
     * `O+I`: Shows all visits combined.
   - Level 1: `📅 วันที่ Visit` (sorted descending by latest visit date first, e.g. `28-02-2020`, `15-11-2019`, `24-06-2019`, `18-12-2018`, `10-08-2018`).
   - Level 2: Document Leaf Nodes with `[แพทย์]` or `[ทั่วไป]` badges and page count pill (`Xน.`).

2. **`Care provider` (Grouping by Attending Physician / Caregiver)**:
   - **กฎการแสดงผล**: แสดงเฉพาะเอกสารที่มีแพทย์ผู้ตรวจรักษาเท่านั้น (`doctor_name` ไม่เป็นค่าว่าง) โดยเอกสารธุรการ/การเงินที่ไม่มีแพทย์จะถูกกรองออก ไม่นำชื่อเจ้าหน้าที่หรือการเงินมาแสดงในกลุ่มนี้
   - Level 1: Physician Name (e.g. `👨‍⚕️ นพ. สุทธิพงษ์ วิริยะสกุล`, `👨‍⚕️ นพ. สุรชัย พัฒนากูล`, `👩‍⚕️ พญ. น้ำมณี มณีนิล`).
   - Level 2: **Visit Date!** (e.g. `📅 Visit: 28-02-2020`, `📅 Visit: 18-12-2018`).
   - Level 3: Documents for that visit under that caregiver.

3. **`Doc Type` (Grouping by Document Category)**:
   - Level 1: Document Category (e.g. `📁 ประวัติการรักษา / OPD Record`, `📁 บันทึกการผ่าตัด (Operative Note)`, `📁 หนังสือแสดงความยินยอม (Consent Form)`, `📁 ใบรับฝากทรัพย์สิน`).
   - Level 2: **Visit Date!** (e.g. `📅 Visit: 28-02-2020`, `📅 Visit: 15-11-2019`).
   - Level 3: Documents for that category on that visit date.

---

## 4. In-Chart Document Search

The sidebar search input is strictly an **In-Chart Document Search** (ค้นหาเอกสารในเวชระเบียนนี้):
- Matches document title, document code (e.g. `RT_Common_267`, `OPD-MED-01`), physician name, category name, or scanner name.
- Real-time instant filtering of the tree with active document count feedback (`พบ X เอกสาร`).

---

## 5. High-Performance Direct PDF & Image Streaming Architecture

To prevent disk bloat, slow conversions, and duplicate files:
1. **Zero-Disk PDF Conversion**:
   - The backend utilizes **PyMuPDF (`fitz`)** to render PDF pages on-the-fly in memory.
   - When a page of a multi-page PDF (e.g. `QA_CLINICAL_03` 3-page report) is requested, PyMuPDF renders the requested page into a crisp PNG byte stream directly into the HTTP response.
   - No temporary images are written to the disk.
2. **Original PDF Viewing**:
   - Documents with PDF source files feature a direct **"PDF ต้นฉบับ"** button in `ViewerHeader`, allowing physicians to open the original uncompressed vector PDF in a native browser tab via `/api/v1/documents/{id}/raw`.
3. **Pillow High-Speed Watermarking**:
   - Transparent dynamic hospital watermark overlays ("สำเนาถูกต้อง COPY") are stamped on-the-fly with staff attribution and timestamps.

---

## 6. Physical Document Storage Mapping (100% Synchronized)

All files reside in `backend/storage/documents/`. Every database document maps to a genuine physical asset:

| Document Code | File Name | Format | Description / Care Provider | Type / Pages |
| :--- | :--- | :--- | :--- | :--- |
| `OPD-MED-01` | `doc_opd_clinical_chart.png` | PNG | Doctor's Clinical Record & Physical Exam (นพ. สุทธิพงษ์) | Doctor (1 Page A4) |
| `SURG-NOTE-01`| `doc_operative_note.png` | PNG | Operative Note & Surgical Record (นพ. สุรชัย) | Doctor (1 Page A4) |
| `SUR-CONSENT-01`| `doc_consent_surgery.png` | PNG | Consent for Surgery & Procedures (พว. วราภรณ์) | Non-Doctor (1 Page A4) |
| `LAB-2019-06` | `doc_lab_report.png` | PNG | Clinical Laboratory Report (CBC & Chemistry) | Doctor (1 Page A4) |
| `XRAY-CHEST-01`| `doc_xray_chest.png` | PNG | Chest X-Ray Digital PA Report | Doctor (1 Page A4) |
| `PROGRESS-NOTE-18`| `doc_progress_note.png` | PNG | Follow-up Clinical Progress Note - SOAP (นพ. สุทธิพงษ์) | Doctor (1 Page A4) |
| `PHARM-DISP-01`| `doc_pharm_dispense.png` | PNG | Pharmacy Prescription & Dispensing Record | Non-Doctor (1 Page A4) |
| `RECEIPT-2018-08`| `doc_finance_receipt.png` | PNG | Official Medical Fee Receipt | Non-Doctor (1 Page A4) |
| `REG-2020-001` | `doc_p1_reg_page1.png` | PNG | Patient Registration Form & ID Card Copy | Non-Doctor (1 Page A4) |
| `RT_Common_267`| `doc_property_deposit.jpg` | JPG | Patient Property Deposit Form (ใบรับฝากทรัพย์สิน) | Non-Doctor (1 Page A4) |
| `QA_CLINICAL_03`| `doc_qa_clinical_committee.pdf` | PDF | Clinical Quality Committee & Accreditation (3 หน้า) | Doctor (3 Pages A4 Direct PDF) |

---

## 7. Operational Runbooks & Commands

### 1-Click Startup:
Double-click `start_dev.bat` in the repository root.

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

## 8. Mobile & Tablet Touch Ergonomics

1. **Full-Width Canvas (`hidden md:flex` on Right Thumbnail Column)**:
   - On mobile viewports, the desktop thumbnail column is hidden, giving scanned charts 100% reading width (`max-w-[96vw]`).
2. **Mobile Thumbnail Sheet**:
   - Tapping "หน้ารวม" opens an overlay Slide-over Sheet (`side="right"`). Selecting a page navigates and auto-closes the sheet.
3. **Smart Contextual Page Switcher `< 1 / 2 >`**:
   - Always visible in mobile toolbar; automatically emerges on desktop when the right sidebar is collapsed.
4. **Native Touch Gestures**:
   - 1-finger touch pan (`touchAction: "none"`).
   - Horizontal swipe for next/previous page flip (`dx < -50px`, `dt < 350ms`).
   - Quick double-tap zoom between fit-to-screen and 100%.
