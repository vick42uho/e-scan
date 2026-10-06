---
name: yanhee-dms
description: >-
  Master knowledge base and operational blueprint for the Yanhee Hospital Document Management System (DMS)
  and Yanhee e-Scan System v3.2 Secured (FastAPI + PostgreSQL + Next.js 16 + Tailwind CSS + shadcn sidebar-10).
  Covers end-to-end architecture, clean HIS/EMR URL integration (/view?hn=...), strict UI/UX anti-redundancy rules,
  compact single-line segmented controls, natural proximity layout, secured document viewer with dynamic watermarking
  ("สำเนาถูกต้อง COPY"), zoom/pan/rotate/color filters canvas, zero-disk PDF direct streaming (PyMuPDF),
  right-hand thumbnail strip, in-chart document search, doctor attribution de-duplication, multi-level patient document tree
  (Visit Date with OPD/IPD/O+I in descending order, Care provider, Doc Type), HN-partitioned storage (backend/storage/documents/{HN}/),
  visit_date synchronization with HIS encounters, 100% offline hospital typography (Sarabun & TH Sarabun PSK localFont),
  Radix ScrollArea table-expansion containment ([&>div]:!block), high-contrast scrollbars (type="always"),
  single-row document tree truncation (...), zero-native-tooltip anti-stacking, comprehensive mobile/tablet responsiveness,
  slide-over sheets (left tree & right thumbnails), touch gestures (swipe flip, double-tap zoom), and strict modular component architecture.
---

# Yanhee Hospital e-Scan System (DMS) v3.2 — Knowledge Base & Architecture Blueprint

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
|     * PatientProfileCard: Ultra-compact demographics (Name TH/EN, HN, Gender, Age, Thai DOB - NO VN)|
|     * DocumentSearchInput: Live in-chart search (by document name, code, doctor, category)        |
|     * DocumentGroupFilter: Sleek single-line segmented control:                                   |
|       - Visit Date (with natural inline sub-filter: ประเภทคนไข้: [ OPD | IPD | O+I ])               |
|       - Care provider (Physician / Caregiver grouping - Doctors only)                             |
|       - Doc Type (Document category grouping)                                                     |
|     * DocumentTreeView: 1-row truncated items (...), Radix Viewport contained, [แพทย์] / [Xน.]    |
|   - Center: DocumentViewerCanvas - Interactive Canvas (Zoom 20%-400%, Pan, Rotate 90°, Filters)   |
|   - Dynamic Watermark: SVG/Canvas overlay with "สำเนาถูกต้อง COPY", Staff ID, Date/Time Stamp    |
|   - Collapsible Sidebars: 1-click fold/expand for Left Tree (key: `[`) & Right Thumbnails (key: `]`)|
|     * Floating Edge Tab Handles (`เปิดเมนู` / `หน้ารวม`) for instant restoration on hover/click   |
|   - Mobile Responsiveness & Touch Architecture:                                                   |
|     * Canvas expands to 100% full width on mobile (`max-w-[100vw]`) for maximum reading area     |
|     * Left tree sidebar adapts to an overlay Slide-over Sheet (`Sheet side="left"`) via Hamburger  |
|     * Right thumbnail strip adapts to an overlay Slide-over Sheet (`Sheet side="right"`) on mobile|
|     * Always-visible compact page switcher `< 1 / 2 >` in mobile toolbar for quick 1-tap navigation|
|     * Native Touch Gestures: 1-finger touch pan, horizontal swipe for Prev/Next, double-tap zoom   |
|     * Mobile Toolbar single-row layout with `overflow-x-auto no-scrollbar`                        |
|   - Right: ThumbnailStrip - Desktop width 192-224px (w-48 sm:w-52 md:w-56) with active A4 card   |
|   - Top: TopNavbar - Yanhee branding ("Yanhee e-Scan v3.1"), online status badge, fullscreen      |
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
|                            PostgreSQL Database Server (10.200.120.33:5434)                        |
|   - Database: yanhee_escan_db                                                                     |
|   - User: admin (Password: it240)                                                                 |
|   - Tables: patients, encounters, document_categories, documents, document_pages, audit_logs     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Strict UI/UX Standards & Anti-Redundancy Rules

Hospital clinicians, nurses, and medical record officers require an uncluttered, high-density, and ergonomically sound interface. The following strict UI/UX rules are enforced across the codebase:

### 2.1 Zero Redundant Information (ป้องกันการแสดงข้อมูลซ้ำซ้อน)
- **TopNavbar Branding**:
  - Branding in TopNavbar is strictly: **"Yanhee e-Scan v3.1"** (clean, high contrast, uncluttered).
- **TopNavbar vs. Left Sidebar Patient Banner**:
  - `PatientProfileCard` in the left sidebar already displays the patient's name, HN, age, gender, and DOB.
  - Therefore, `TopNavbar` **must NOT** duplicate the patient banner when the sidebar is open.
  - The patient banner in `TopNavbar` is conditionally rendered **only when `!isSidebarOpen`** (when the sidebar is collapsed to maximize reading area).
  - On mobile screens (`< 640px`), the TopNavbar patient banner is hidden (`hidden sm:flex`) to preserve navbar space for essential controls.
- **Physician vs. Scanner Attribution in ViewerHeader**:
  - In clinical records authored and scanned by the same physician (e.g. `doctor_name === scan_by_name`), **suppress the duplicate scanner badge**.
  - Show only `แพทย์: {doctor_name}`. Do NOT print the identical person's name twice side-by-side.
  - Only show `ผู้สแกน: {scan_by_name}` if the physical uploader is genuinely a different person (e.g. nurse, medical record staff).
- **Removal of Confidential / Secret Documents Badge**:
  - Scanned charts in this DMS are all active medical records; the hospital does not classify them as "เอกสารลับ" (`[ความลับ]`).
  - Completely remove `[ความลับ]` badges from `ViewerHeader` and all search filters to avoid UI distraction.
- **Ultra-Compact Patient Profile Micro-Stack (`PatientProfileCard`)**:
  - Total card height is strictly ~48px (compact single card).
  - Proximity layout immediately adjacent to the 40px Patient Avatar:
    * Row 1: Thai Name (`text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate`)
    * Row 2: English Name (`text-[11px] text-muted-foreground truncate`)
    * Row 3: HN badge (`bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-mono text-[10px]`) + Demographic text (`{gender} • {age} • เกิด {dob_thai}`)
  - **Strict Zero VN in UI**: VN (Visit Number) is completely removed from the UI. Reason: In hospital scanning / DMS, VN and Visit Date describe the exact same encounter; showing both confused clinicians and bloated UI space.
  - **Zero Bulky Well Cards**: No separate multi-row demographic boxes that eat up vertical sidebar space.

### 2.2 Gestalt Proximity & Layout Ergonomics
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

### 2.4 Mandatory shadcn/ui Component Architecture
- **Every UI/UX design workflow must execute**:
  ```bash
  bunx --bun skills add shadcn/ui
  ```
- **Strictly use pre-installed components at `frontend/components/ui/` (`@/components/ui/*`)**:
  - No raw HTML controls (`<button>`, `<input>`, `<select>`, `<dialog>`, raw checkboxes, raw badges/spans) where shadcn components exist.
  - If a needed component is missing from `frontend/components/ui/`, ask the user first or install it via `bunx --bun shadcn@latest add <component>` inside `frontend/`.
- Maintain unified tokens (`bg-card`, `text-card-foreground`, `border-border`, `focus-visible:ring-1`).

### 2.5 Radix ScrollArea Viewport Table-Expansion Rule (Critical Architectural Fix)
- **The Issue**: Radix `ScrollAreaPrimitive.Viewport` internally injects a child container with inline styles:
  ```html
  <div style="min-width: 100%; display: table;">
  ```
- In flexbox/grid containers (such as the document tree sidebar), any unconstrained long title inside this `display: table` element forces the table width to expand to its `max-content` width (e.g., 550px for an 80-character title).
- This produces 3 severe UI defects:
  1. Leaf node button elements stretch hundreds of pixels outside the visible sidebar boundary.
  2. Right-side badges (`[แพทย์]`, `[Xน.]`) get pushed off-screen.
  3. Radix `<Tooltip>` anchors calculate coordinates based on the over-expanded 550px button bounding box, causing tooltips to float 200px+ to the right into the document canvas.
- **Mandatory Solution**:
  In `frontend/components/ui/scroll-area.tsx`, `ScrollAreaPrimitive.Viewport` must always include:
  ```tsx
  <ScrollAreaPrimitive.Viewport
    className={cn(
      "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-1",
      "[&>div]:!block [&>div]:w-full [&>div]:max-w-full overflow-x-hidden",
      className
    )}
  >
  ```
  This forces the internal table container to `display: block` with strict 100% width, eliminating unbounded horizontal expansion.

### 2.6 Mandatory Scrollbar Visibility in Clinical Systems (`type="always"`)
- By default, Radix ScrollArea uses `type="hover"`, which hides scrollbars until user mouseover.
- In medical EMR / DMS interfaces, scrollbars provide vital visual orientation regarding record length and position. Clinicians must know immediately if a record has more pages or visits below the fold.
- `ScrollArea` must default to `type="always"`:
  ```tsx
  <ScrollArea type="always" className="...">
  ```
- ScrollBar track must have a visible left border (`border-l border-slate-200/80 dark:border-slate-800`), and the thumb must have high contrast (`bg-slate-400/80 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500`) with minimum thickness (`w-2.5`).

### 2.7 Tooltip Anti-Stacking & Bounded Positioning Rule
- **Zero Native `title="..."`**: Never attach HTML `title="..."` attributes to elements wrapped in Radix `<TooltipTrigger>`. Doing so causes both the native OS browser tooltip and the Radix tooltip to fire simultaneously ("tooltips ซ้อนกัน").
- **Tooltip Geometry & Offsets**:
  - Tooltips on document tree items must use `side="right"`, `sideOffset={6}`, and `align="center"`.
  - Tooltip container must be strictly bounded: `max-w-[280px] text-xs px-2.5 py-1.5 break-words`.
  - Tooltips should display only necessary descriptive information without repeating redundant badges already visible in the item.

### 2.8 Document Tree Item Single-Row Truncation Standard
- Document leaf items must be strictly 1 row (`h-7.5` / ~30px) with `truncate` (`...`) on the document title to prevent multi-line card bloat and preserve high information density.
- Leaf node button standard:
  ```tsx
  <Button
    variant={isSelected ? "secondary" : "ghost"}
    size="sm"
    className="w-full max-w-full box-border overflow-hidden h-7.5 px-2 justify-start font-normal text-left"
  >
    <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
      <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      <span className="text-[12px] truncate flex-1 min-w-0">
        {doc.document_name}
      </span>
    </div>
    <div className="flex items-center gap-1 shrink-0 ml-1.5">
      <Badge className="shrink-0 text-[10px] px-1 py-0">{doc.category_name}</Badge>
      <Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0">{doc.page_count}น.</Badge>
    </div>
  </Button>
  ```
- Crucial flex constraints:
  * `min-w-0 flex-1 overflow-hidden` on the label container.
  * `truncate min-w-0 flex-1` on the text span.
  * `shrink-0` on badges so they are never clipped or pushed out.

### 2.9 Document Viewer Header Visual Hierarchy
- The document title has primary visual hierarchy: container is `min-w-0 flex-1`, title text is `truncate flex-1 min-w-0`.
- Secondary scanner details are deferred to ultra-wide screens (`hidden 2xl:flex items-center gap-1.5 text-xs text-muted-foreground`) to avoid crushing document titles on mobile, tablet, and standard clinical 1080p monitors.
- Remove redundant `[ความลับ]` badges.

### 2.10 Right Thumbnail Strip Ergonomics & Anti-Clipping
- Desktop thumbnail strip width must be `w-48 sm:w-52 md:w-56` (192-224px).
- Thumbnail cards must use `box-border overflow-hidden` and `ring-1` with proper padding (`p-2.5 pr-3.5`) so A4 preview cards, page numbers, titles, and vertical scrollbars are never clipped on the right edge.

---

## 3. Multi-Level Hierarchical Tree Structure

### Dynamic Grouping Modes:
1. **`Visit Date` (Default Mode)**:
   - Accompanied by inline sub-filter: `ประเภทคนไข้: [ OPD | IPD | O+I ]`
     * `OPD`: Filters encounters of type Out-Patient.
     * `IPD`: Filters encounters of type In-Patient (e.g. Surgery, Ward admission).
     * `O+I`: Shows all visits combined.
   - Level 1: `📅 วันที่ Visit` (sorted descending by latest visit date first, e.g. `28-02-2020`, `15-11-2019`, `24-06-2019`, `18-12-2018`, `10-08-2018`).
   - Level 2: Document Leaf Nodes with `[แพทย์]` or `[ทั่วไป]` badges and page count pill (`Xน.`), single-row truncated with ellipsis (`...`).

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

## 8. Comprehensive Mobile, Tablet & Touch Ergonomics

Hospital clinicians, mobile ward nurses, and rounding physicians frequently access e-Scan on smartphones (iPhone / Android) and mobile tablets (iPad / Samsung Tab). The system enforces a strict responsive and touch architecture:

### 8.1 Breakpoint Taxonomy & Screen Size Classes
| Device Class | Breakpoint | Layout Strategy |
| :--- | :--- | :--- |
| **Mobile Smartphone** | `< 768px` (`< md`) | 100% Canvas reading width; Left Sidebar & Right Thumbnails convert to Slide-over Sheets; Page switcher in Toolbar; Single-row scrollable toolbar |
| **Tablet (Portrait / Landscape)** | `768px - 1024px` (`md` to `lg`) | Collapsible left sidebar (`w-80`); right thumbnail strip hidden or collapsible; Canvas `min-w-0 flex-1` |
| **Desktop Workstation** | `≥ 1024px` (`lg`, `xl`, `2xl`) | Full 3-column view: Left Tree (`w-80` to `340px`), Center Canvas, Right Thumbnails (`w-48` to `56`) |

### 8.2 Canvas Dominance: 100% Reading Area Guarantee
- Scanned medical records (A4 physical charts, doctor handwriting, surgical forms) require maximum screen space.
- **Strict Rule**: On mobile (`< 768px`), both the left document tree and the right thumbnail strip **must NEVER be rendered as persistent side columns**. Persistent columns squeeze the scanned chart into an unreadable sliver.
- The canvas expands to **100% full viewport width** (`w-full min-w-0 max-w-[100vw]`).

### 8.3 Slide-Over Sheets for Secondary Navigation (`@/components/ui/sheet`)
- **Left Patient & Tree Drawer (`Sheet side="left"`)**:
  * Triggered by the Hamburger Menu button (`<Menu className="h-5 w-5" />`) in `TopNavbar`.
  * Dimensions: `w-80 sm:w-[340px] max-w-full p-0`.
  * **Auto-Dismiss on Document Selection**: Tapping any document in the tree automatically triggers `setMobileDrawerOpen(false)` so the clinician immediately views the selected chart without manual drawer dismissal.
- **Right Multi-Page Thumbnail Drawer (`Sheet side="right"`)**:
  * For multi-page records (e.g. 3-page committee notes), tapping the toolbar button **`"หน้ารวม ({totalPages})"`** opens the drawer.
  * Dimensions: `w-72 max-w-[85vw] p-0 flex flex-col`.
  * **Auto-Dismiss on Page Selection**: Tapping a thumbnail navigates to that page and auto-closes the sheet (`setMobileThumbnailsOpen(false)`).

### 8.4 Contextual Mobile Page Switcher `< 1 / 2 >` in Toolbar
- Since the right thumbnail column is hidden on mobile, clinicians must NOT be forced to open a drawer just to flip between page 1 and page 2.
- The compact page switcher `< 1 / 2 >` is **always visible in the mobile toolbar** (`flex md:hidden` when desktop sidebar is open, or `flex` when collapsed).
- Provides instant 1-tap previous/next buttons directly above the chart.

### 8.5 Single-Row Horizontal Scroll Toolbar (`overflow-x-auto no-scrollbar`)
- To prevent toolbars from wrapping onto multiple rows and eating up vertical chart reading space on mobile, `ViewerToolbar` enforces:
  ```tsx
  <div className="h-10 sm:h-11 px-2 sm:px-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs select-none overflow-x-auto no-scrollbar gap-1.5">
  ```
- All controls (Zoom, 1:1, Fit Screen, Rotate, Color Mode, Page Switcher, Thumbnails) stay on a clean single line.

### 8.6 TopNavbar Mobile Adaptations
- TopNavbar height is fixed at `h-14` (56px) for thumb ergonomics.
- Hospital subtext ("โรงพยาบาลยันฮี • ระบบจัดเก็บ...") is hidden on `< 640px` (`hidden sm:block`) to avoid line wrapping.
- Patient duplicate banner is hidden on `< 640px` (`hidden sm:flex`), as full patient info is accessible with 1 tap on the hamburger button.
- Brand logo + **"Yanhee e-Scan v3.1"** remains bold, prominent, and legible.

### 8.7 Native Touch & Ergonomic Gestures
1. **1-Finger Touch Pan**:
   - `touchAction: "none"` on the canvas enables effortless 1-finger panning of zoomed charts with natural inertia.
2. **Horizontal Swipe Page Flip**:
   - Quick horizontal swipe (`dx < -50px, dt < 350ms`) flips to the Next Page.
   - Quick horizontal swipe (`dx > 50px, dt < 350ms`) flips to the Previous Page.
3. **Double-Tap Zoom Toggle**:
   - Quick double-tap switches smoothly between Fit-to-Screen and 100% actual size (`1:1`).
4. **Touch Target Sizing**:
   - All interactive touch buttons must provide a minimum visual or touch area of 36px-44px to accommodate gloved hands or ward rounds.

---

## 9. Document Scanning & Ingestion Standards (Scan Module)

The Document Scanning & Ingestion module (`/scan`) is the physical-to-digital gateway for medical record officers and ward nurses:

### 9.1 Brand TopBar Consistency & Hardware Scanner Selector
- Matches the DMS hospital header theme (`bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white`).
- Features the **YH Medical Emblem**, **"Yanhee e-Scan v3.1"** title, and an explicit **"สแกนเอกสาร"** badge.
- Live Scanner Device selector with hardware connection status tooltips (`Wifi` / `WifiOff`) and a direct return link to `/view`.
- **Hardware Disambiguation & Key Uniqueness**: Scanner Bridge filters out redundant eSCL virtual devices when native WIA drivers exist, preventing duplicate printer names. The frontend Combobox enforces unique keys using `dev.id` (`key={dev?.id || name}`) and unique display names, eliminating React key collisions.
- **Visual Device Confirmation on Scan Button**: The main scan action button (`สแกนเอกสาร (Scanner)`) dynamically displays the currently selected hardware device name below the label (e.g. `เครื่อง: EPSON Perfection V39 #2`), giving clinicians immediate visual confirmation of which physical device will execute the scan.

### 9.2 Strict Medical Form Architecture (`ScanForm`)
- **Encounter Types**: Must offer **`[ OPD | IPD | O+I ]`** as an instant 1-tap segmented pill button group (`grid grid-cols-3 p-0.5 bg-slate-200/80 rounded-lg`).
- **Strict Zero Confidential Level**: Hospital scanned charts have no confidential classification; do NOT include "ระดับความลับ" or confidential checkboxes in the UI.
- **Doctor Attribution**: Dedicated section for attending physician (`แพทย์ผู้ตรวจรักษา`) with an optional checkbox `เป็นเอกสารบันทึกของแพทย์โดยตรง`.
- **ScrollArea Containment**: Form content is wrapped in `<ScrollArea type="always">` with `[&>div]:!block [&>div]:w-full overflow-x-hidden`.

### 9.3 Responsive Workspace Architecture
- **Desktop (`≥ 768px`)**: 2-column layout (Left: Form `w-[380px] lg:w-[420px]`, Right: Preview Canvas).
- **Mobile (`< 768px`)**: Single-column responsive layout featuring an accessible mobile tab switcher at the top:
  * `[ 📝 ข้อมูล & สแกน | 📄 ตัวอย่าง ({pages.length}) ]`
  * Automatically switches to the `preview` tab upon scanning or file upload so mobile users immediately review scanned charts.

### 9.4 Strict File Extension Restriction
- **Allowed Formats**: Strictly `.pdf`, `.jpg`, `.jpeg`, `.png`.
- File input element must enforce `accept=".pdf,.png,.jpg,.jpeg"`.
- Event handler `handleFileChange` must programmatically validate each selected file against allowed extensions and MIME types via `DataTransfer`, filtering out unsupported files (TIFF, BMP, WEBP, GIF, executables) and notifying the user.

### 9.5 Mandatory Fields & Dynamic Age Calculation
- **Patient Name**: Marked as mandatory with red asterisk `<span className="text-rose-500">*</span>` and validated on save.
- **Dynamic Age from DOB**:
  * Medical charts often specify DOB in Thai Buddhist Era (`15 พ.ค. 2535`, `15/05/2535`) or Gregorian Era (`1992-05-15`).
  * Utilizes `calculateAgeFromDob(dob)`:
    - Automatically converts Buddhist Era years (`> 2400`) to Gregorian by subtracting 543.
    - Resolves Thai month abbreviations (`ม.ค.` to `ธ.ค.`).
    - Calculates exact age in years/months against `new Date()`, ensuring age remains accurate and up-to-date with the current year.
    - Automatically computes age when DOB is extracted via OCR or typed manually.

### 9.6 Dynamic Document Categories & Searchable Combobox Selection
- **Database Model**: `DocumentCategory` (`id`, `code`, `name_th`, `name_en`, `category_type`, `sort_order`).
- **Backend API**: `POST /api/v1/scan/categories` takes `DocumentCategoryCreate` (`name_th`, `name_en`, `code`, `category_type`), auto-generates unique uppercase codes, and saves to database.
- **Searchable Combobox Standard**: In accordance with project UX standards, document category selection, extraction mode, scanner device, and modal options utilize shadcn `<Combobox>` (`@/components/ui/combobox`) with searchable `<ComboboxInput>`, `<ComboboxContent>`, `<ComboboxList>`, and `<ComboboxEmpty>`.
- **Frontend Dialog**: Accessible via `+ เพิ่มหมวดหมู่` button beside the category label, using shadcn/ui `<Dialog>`, `<Input>`, `<Label>`, and `<Combobox>`.
- Automatically appends the new category to dropdown options and selects it immediately upon creation.

### 9.7 Patient & Encounter Auto-Fill Lookup API
- **Endpoint**: `GET /api/v1/scan/patient-lookup?query={hn_or_en}`
- **Search Precedence**:
  1. Checks `Encounter` table for exact VN/EN match.
  2. If not found, checks `Patient` table by HN and fetches their latest encounter.
- **Response**: Unified `PatientLookupResult` with `hn`, `name_th`, `name_en`, `gender`, `dob`, dynamic current `age`, `en`, `visit_date`, `encounter_type`, `department_name`, and `doctor_name`.
- **UI Integration**: 1-click "ดึงข้อมูลอัตโนมัติ" button and Enter key trigger in both HN and VN inputs.

---

## 10. Secure Vendor Document Ingestion Architecture

External hospital vendors (e.g., outsourced lab centers, imaging clinics, specialized pathology systems) must securely submit document metadata and digitized files directly into the DMS database.

```
+---------------------------------------------------------------------------------------------------+
|                                External Medical Vendor System                                     |
|   - HTTP Multipart POST: /api/v1/scan/vendor-upload                                                |
|   - Header: X-API-Key: {SECURE_VENDOR_API_KEY}                                                    |
|   - Payload: file (.pdf/.jpg/.png) + metadata (hn, title, category_code, en, ref_id)              |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 6-Layer Security & Ingestion Shield                               |
+---------------------------------------------------------------------------------------------------+
| 1. Authentication Layer: Verify Header 'X-API-Key' against settings.VENDOR_API_KEY                |
| 2. Deep File Inspection (Magic Bytes):                                                            |
|    - PDF: starts with b"%PDF-"                                                                    |
|    - JPEG: starts with b"\xFF\xD8\xFF"                                                            |
|    - PNG: starts with b"\x89PNG\r\n\x1a\n"                                                         |
|    - Rejects polyglot / executable files disguising as images or PDFs                             |
| 3. File Size & Quota: Hard ceiling of 50 MB per file (52,428,800 bytes)                           |
| 4. Idempotency Protection: If external_reference_id exists, return existing record without dupes   |
| 5. Storage Sanitization: Store file as VENDOR_{code}_{safe_hn}_{timestamp}_{doc_id[:8]}{ext}      |
| 6. Audit Logging: Record VENDOR_UPLOAD in audit_logs with Vendor Name, IP, User Agent, & SHA-256 |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                             PostgreSQL Database & Storage Ingestion                               |
|   - Upsert Patient (by HN) & Encounter (by EN)                                                    |
|   - Save Document & DocumentPage records                                                          |
|   - Log full compliance trace into audit_logs                                                     |
+---------------------------------------------------------------------------------------------------+
```

### Security Recommendations for Production Deployment:
1. **API Key Rotation & Vendor Scoping**: Store unique per-vendor API keys in a database table (`api_credentials`) with hashed secrets (bcrypt/argon2), expiration dates, and assigned vendor permissions.
2. **IP Whitelisting & Reverse Proxy**: In production Nginx/Caddy or Cloudflare WAF, whitelist the fixed public IPs or CIDR blocks of authorized vendors.
3. **mTLS (Mutual TLS)**: For enterprise lab vendors exchanging high-volume sensitive clinical records, enable client certificate authentication (mTLS).
4. **Rate Limiting**: Enforce a strict rate limit (e.g. 60 requests/minute per API key or IP) to prevent DoS attacks.
5. **Antivirus & Malware Scanning**: Integrate an async worker (e.g., ClamAV daemon) to scan incoming files before making them accessible in clinical viewers.

---

## 11. Scanner Bridge & High-Performance Thai OCR Architecture

### 11.1 Local Hardware Scanner Bridge (Port 18000)
- **Technology**: Lightweight Python FastAPI daemon (`scanner-bridge/scan_bridge.py`) running on the client Windows machine.
- **Windows WIA Integration**: Uses `win32com.client.Dispatch("WIA.DeviceManager")` to query and drive physical TWAIN/WIA flatbed and sheetfed document scanners (e.g. EPSON Perfection V39, Brother MFC-J2330DW).
- **Device Disambiguation & Anti-Duplication**:
  - Filters out redundant eSCL network endpoints when a native WIA driver exists for the same device name.
  - Strict scanner target matching: matches by device ID, normalized backslash/slash path, and device name, ensuring the user's selected scanner in the DMS top bar is always used rather than the Windows system default printer/scanner.
  - High-contrast dropdown styles (`data-highlighted:bg-blue-600 data-highlighted:text-white`) prevent unreadable black-on-black hover states in Radix Combobox.

### 11.2 High-Performance Thai OCR Engine
- **Engine**: PaddleOCR Thai ONNX Recognition Model (`backend/models/ocr/thai/rec.onnx` + `dict.txt`) loaded via `RapidOCR`.
- **Auto-Orientation Detection**:
  - Flatbed scanners (e.g. EPSON V39) scan documents in landscape orientation (270° relative to upright portrait).
  - Evaluates rotation candidates (0°, 270°, 90°, 180°) dynamically based on Thai character density and length (`score = thai_chars * 3 + text_length`).
  - Automatically selects the upright orientation without manual operator intervention.

### 11.3 Thai Clinical Slip Metadata Extraction & Normalization
- **Thai Patient Name**:
  - Regex detects standard Thai honorifics and prefixes: `น.ส.`, `นางสาว`, `นาย`, `นาง`, `ด.ช.`, `ด.ญ.`, `คุณ`.
  - Normalizes common OCR artifacts: `U.a.`, `u.a.`, `น.a.` -> `น.ส.`.
  - Prioritizes Thai name (`name_th`) over English name (`name_en`) on Thai hospital forms.
- **Patient Age**:
  - Normalizes Thai age indicators: `อายุ: 24 ปี`, `อาย: 24 ป`, `24 ปี`.
  - Dynamically calculates age from DOB and the current year to ensure age remains perpetually up-to-date.
- **Date of Birth (DOB)**:
  - Normalizes OCR Thai month abbreviations: `เม.0.` / `เม.1.` -> `เม.ย.`, `ม.n.` -> `ม.ค.`, `ก.w.` -> `ก.พ.`.
  - Formats date into standard Thai Buddhist Era (BE) string (e.g. `03 เม.ย. 2545`) and CE date (`2002-04-03`).
- **Doctor Name**:
  - Matches hospital doctor patterns: `DOCTOR YANHEE`, department + doctor lines (`อายุรกรรม , DOCTOR YANHEE , Cath Lab`), `นพ.`, `พญ.`, `Dr.`, `แพทย์`.
- **Database Enrichment**:
  - Matches detected HN (or barcode) against the database and enriches with registered official Thai names and latest encounter info.

### 11.4 Clinical Significance of `is_doctor_document` Checkbox
- **Hospital Regulatory Standard (HA / JCI)**:
  - **Direct Physician Charting (`is_doctor_document = true`)**: Clinical Progress Notes, Doctor's Orders, Operative Notes, Discharge Summaries authored directly by physicians.
  - **Auxiliary Records with Doctor Attribution (`is_doctor_document = false`)**: Visit Slips, Lab Slips, X-Ray Requests, Financial Billing Sheets printed by nurses or front-desk staff containing the ordering doctor's name.
- **System Automation**: The system auto-checks this flag whenever a doctor's name is detected or selected, while providing clinical clerks the flexibility to toggle it based on document nature.

### 11.5 Multi-Field Key-Value Barcode / QR Code Parsing & Auto-Population
- **Payload Structure**:
  Hospital clinical forms may print structured QR codes or 2D barcodes containing pipe-delimited Key=Value pairs:
  `HN=00000001|VN=OP26070000001|Doctype=OPD-NOTE|DOB=2006-01-08 17:00:00.000`
- **Dual-Engine Auto-Population (Frontend + Backend)**:
  1. **HN**: Normalizes patient hospital number (handles leading zeros, e.g. `00000001` or `000000001`) and populates the HN form field.
  2. **VN / EN**: Populates encounter number (`OP26070000001`) and auto-switches encounter type Segmented Pill to `OPD` (for `OP`/`VN`) or `IPD` (for `IP`).
  3. **Doctype**: Matches `OPD-NOTE` against `document_categories` by `code`, `category_type`, `name_en`, or `name_th`. Automatically sets `category_id` in the Combobox, updates `category_name`, and fills document `title` (e.g. `บันทึกการตรวจรักษาผู้ป่วยนอก`).
  4. **DOB & Dynamic Age**: Cleans timestamp (`17:00:00.000`), formats date (`2006-01-08`), and computes current age (e.g. `20 ปี`) dynamically relative to the current year.
  5. **Instant Patient Enrichment**: Queries database by HN or VN to automatically enrich patient Thai name, gender, and attending physician (`นพ. สุทธิพร จุลกะ`).

### 11.6 Grouped Dual-Language Category Combobox & Dynamic Category Types
- **Dual-Language Formatting**: If both Thai and English names are present and distinct, formats as `ชื่อไทย (English Name)`. If only one language is available, displays that language directly.
- **ComboboxGroup & ComboboxSeparator Ergonomics**: Categories are grouped by `category_type` (e.g. `Core Clinical Documents`, `Assessment`, `Orders / Treatment`, `Procedure / Operation`, `Consent`, `Medication-related`, `Nursing / Care Plan`, `Investigation / Diagnostic`, `Administration`). Uses inline group headers (non-sticky to avoid header collision when scrolling to the bottom) and clean separators between groups.
- **showClear & Clean Document Replacement**: Both main form and dialog Combobox inputs feature `showClear` for 1-click clearing. When uploading a new document or clicking the preview "ล้างเอกสาร" button, all previous patient metadata and form states are completely reset to prevent stale data cross-contamination.
- **Dialog Combobox Scrolling & Dismissal Shield (`container={dialogRef}`)**:
  - In Radix Dialogs, `ComboboxContent` accepts `container={dialogRef}`, portalling the dropdown popup directly inside `<DialogContent ref={dialogRef}>`. This keeps the DOM tree contained within the dialog, allowing `react-remove-scroll` to recognize mouse wheel events and scroll smoothly at 60 FPS without being blocked.
  - `DialogContent` implements an outside interaction shield (`onPointerDownOutside` and `onInteractOutside`) checking `e.detail.originalEvent.target?.closest('[data-slot*="combobox"]')`. This ensures clicking on Combobox items or scrollbars never causes Radix Dialog to dismiss unexpectedly.
  - `data-remove-scroll-lock-ignore="true"` and `data-radix-scroll-lock-ignore="true"` are attached to `ComboboxPositioner`, `ComboboxPopup`, and `ComboboxList`.
- **Dynamic Category Types in Creation Dialog**:
  - `category_type` options are dynamically extracted from all existing records in `document_categories` via `useMemo` (zero hardcoding).
  - Provides a toggle `+ พิมพ์ใหม่` / `← เลือกที่มีอยู่` allowing operators to either select from existing categories or enter a brand new custom category type without backend schema restrictions.
  - Automatically refreshes the Category Combobox and selects the newly created category upon submission.

### 11.7 Hospital-Grade Save Confirmation & Validation Feedback Dialog
- **Pre-flight Validation Alert**: Before sending files, checks that `pages.length > 0`, `hn`, `patient_name`, `category_id`, and `title` are present. If anything is missing, immediately pops up a clear Amber Warning Dialog detailing the exact missing fields as bullet points, rather than a silent failure or clipped inline banner.
- **Success Confirmation Modal**: On successful document upload:
  - Displays a centered, prominent Emerald Success Dialog with `CheckCircle2` icon.
  - Summarizes clinical document metadata: HN, Patient Name, Category Name, Title, Total Pages, and Document ID.
  - Provides two distinct action buttons:
    1. **"เปิดดูใน Viewer"**: Opens `/view?hn={hn}` in a new browser tab for immediate verification in the clinical E-Scan Viewer.
    2. **"สแกน / นำเข้าเคสถัดไป"**: Automatically clears the form, frees document blob memory, and resets the interface ready for the next patient chart.
- **Error Handling**: Extracts server JSON error details (`errorData.detail`) and presents actionable error messages directly to the operator in a Rose Error Dialog.

### 11.8 Visit Date & Encounter Synchronization (`visit_date`)
- **Clinical Rationale**: Medical charts in DMS are organized primarily by clinical encounter dates (`Visit Date`). Without an explicit Visit Date in the ingestion form, documents risked being misattributed or falling back to the technical scan timestamp (`scan_date`), causing timeline divergence.
- **Form Integration**:
  - Located directly under the *Encounter Section* of `ScanForm`.
  - **HIS Lock Shield**: When an encounter number (`VN / EN`) exists in the patient's registered encounters in DMS, the system automatically pulls `visit_date` from `Encounter`, locks the input (`disabled`), and displays an emerald badge: `🔒 จากระบบ HIS`. This prevents accidental modification or human error.
  - **New Encounter Date Selection**: For new visits or manual entries, operators can specify the exact clinical encounter date (constrained to `max={today}`). Displays Thai Buddhist Era preview (e.g. `พ.ศ.: 5 ต.ค. 2569`).
- **Descending Chronological Tree View**:
  - `document_service.py` sorts Visit Date groups in strict **descending order** (newest visit first: e.g. `05-10-2026`, `03-10-2026`, `28-02-2020`...) across all 3 view modes (`visit_date`, `caregiver`, and `category`).
  - Utilizes `joinedload(Document.encounter)` for single-roundtrip query performance without N+1 bottlenecks.

---

## 12. HN-Partitioned Document Storage Architecture

### 12.1 Directory Structure & Segregation
To prevent filesystem degradation and directory index bloat when handling hundreds of thousands of clinical documents:
- Documents are partitioned into subdirectories named strictly after the patient's Hospital Number (HN):
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
- No clinical files remain at the root storage directory (except `.gitkeep`).

### 12.2 Storage Resolver Engine (`backend/app/core/storage.py`)
- **`hn_folder(hn: str) -> Path`**: Sanitizes the HN string (stripping illegal filesystem characters and directory traversal tokens `../`), creates the destination directory if not yet present, and returns the resolved `Path`.
- **`build_storage_path(hn: str, filename: str) -> Tuple[Path, str]`**: Generates the full filesystem path for new writes, and returns the **Relative Path** (`{HN}/{filename}`) to be persisted in `document_pages.file_path` in the database.
- **`resolve_storage_path(file_path: Optional[str]) -> Optional[Path]`**: Safe, triple-fallback resolver:
  1. Checks if `file_path` is a relative path inside `STORAGE_DIR / file_path` (Primary mode).
  2. Checks if `file_path` is an existing absolute path (Legacy mode).
  3. Checks if filename exists directly at root `STORAGE_DIR / filename` (Fallback mode).
  4. Guarantees that the resolved path resides strictly within `STORAGE_DIR.resolve()`, actively preventing Path Traversal security vulnerabilities.

### 12.3 Backward-Compatible Migration Script (`migrate_storage_by_hn.py`)
- Migrates existing databases with zero downtime and zero file loss.
- **Copy-Then-Cleanup Pattern**: Uses `shutil.copy2` first across all records, and performs cleanup of root files only after all page records have been verified and database transactions committed. This safely handles shared mock files across multiple test patients.
- Idempotent: Can be re-run safely at any time.

---

## 13. System-Wide Offline Typography Architecture

### 13.1 Hospital Intranet Independence (100% Offline)
- Clinical hospital environments frequently operate on isolated intranets with restricted or zero public internet access.
- All web fonts are bundled locally in `frontend/public/fonts/`:
  - **Google Fonts Sarabun**: `Sarabun-Regular.ttf`, `Sarabun-Medium.ttf`, `Sarabun-SemiBold.ttf`, `Sarabun-Bold.ttf`.
  - **TH Sarabun PSK**: `THSarabunPSK-Regular.ttf`, `THSarabunPSK-Bold.ttf`, `THSarabunPSK-Italic.ttf`, `THSarabunPSK-BoldItalic.ttf`.
- Registered via Next.js `next/font/local` in `app/layout.tsx`. Zero external CDN requests (`fonts.googleapis.com` or `fonts.gstatic.com`).

### 13.2 Zero Hydration Mismatch & Anti-FOUT
- Eliminates Next.js React hydration mismatches caused by browser extensions or asynchronous font stylesheet injection.
- Consistent typography and baseline alignment across all medical form controls and clinical report viewers.

---

## 14. Document Naming & Auto-Population Standards

### 14.1 Zero-Typing by Default, Editable on Exception
- Scanning operators process hundreds of charts daily; typing titles manually causes severe operational bottlenecks and spelling inconsistencies.
- **Standard Formula (Recommended)**: `[ชื่อหมวดหมู่ภาษาไทย] ([ประเภทเคส OPD/IPD])`
  - Example: `บันทึกการตรวจรักษา (OPD)`, `หนังสือแสดงความยินยอมรับการผ่าตัด (OPD)`.
  - Clean, concise, and non-redundant when displayed inside date-grouped tree nodes.
- **Document Code (`document_code`)**:
  - Automatically populated from `category.code` (e.g. `OPD-NOTE`, `SUR-CONSENT`) upon selecting a category.
  - Automatically overridden by Form Barcode/QR Code when detected on the physical document header.
  - Operator retains the ability to append specifics if needed (e.g. adding `- ตาขวา`).

---

## 15. Verified Milestones & Production Readiness Checklist

| Category | Component / Milestone | Verification Status |
|---|---|:---:|
| **Frontend UI** | Next.js 16 (Turbopack) + React 19 + shadcn/ui | ✅ Verified (0 TypeScript errors) |
| **Viewer Engine** | 3-Column Layout, Canvas Zoom/Pan/Rotate, Dynamic Watermarking | ✅ Production Ready |
| **PDF Streaming** | PyMuPDF Zero-Disk Byte Streaming + Raw PDF Button | ✅ Production Ready |
| **Hardware Scanning** | FastAPI WIA Bridge on Port 18000 (EPSON, Brother) | ✅ Tested & Working |
| **OCR & Barcode** | PaddleOCR ONNX Thai Model + 2D Key-Value Pipe Barcode | ✅ Tested & Working |
| **Category System** | Dynamic DB Categories + Scrollable Dialog + Free-text Add | ✅ Tested & Working |
| **Encounter & Visit** | Encounter Date Synchronization + Descending Chronological Tree | ✅ Tested & Working |
| **Storage Architecture**| HN-Partitioned (`documents/{HN}/`) + Relative DB Paths | ✅ 100% Migrated (28/28 verified) |
| **Offline Typography** | LocalFont Sarabun / TH Sarabun PSK (Intranet 100%) | ✅ Production Ready |
| **Docker Multi-Server** | 2-Server Stack (Frontend: 8031, Backend: 8033, DB: 5434) | ✅ Verified & Automated |

---

## 16. Distributed 2-Server Production Deployment & Multi-App Coexistence

### 16.1 Server Roles & Port Allocation Scheme
To guarantee zero port collision with current and future hospital applications sharing the same Ubuntu 24.04 hosts:

```
[ Hospital Staff Browser ]
          │
          │ HTTP (:8031)
          ▼
┌────────────────────────────────────────────────────────┐
│ Server 1: Frontend Server (10.200.120.31)              │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Nginx Gateway Container (Port 8031:80)           │  │
│  │                                                  │  │
│  │   • "/"           ──► Next.js (Port 3000)        │  │
│  │   • "/api/v1/"    ──► http://10.200.120.33:8033  │──┼──┐ (Intranet LAN)
│  │   • "/health"     ──► http://10.200.120.33:8033  │  │  │
│  │   • "/docs"       ──► http://10.200.120.33:8033  │  │  │
│  └───────────────────┬──────────────────────────────┘  │  │
│                      │                                 │  │
│  ┌───────────────────▼──────────────────────────────┐  │  │
│  │ Next.js 16 App Container (Port 3000 Standalone)  │  │  │
│  └──────────────────────────────────────────────────┘  │  │
└────────────────────────────────────────────────────────┘  │
                                                            │
┌───────────────────────────────────────────────────────────▼┐
│ Server 2: Backend & Database Server (10.200.120.33)        │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ FastAPI Backend Container (Port 8033:8000)           │  │
│  │ (Python 3.13 + uv + Uvicorn 4 workers)               │  │
│  │                                                      │  │
│  │   • Volume: ./backend/storage/documents              │  │
│  │   • Volume: ./backend/storage/thumbnails             │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │ Local socket / port             │
│                          │ (:5434)                         │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │ PostgreSQL 14+ Instance (Port 5434)                  │  │
│  │ (Database: yanhee_escan_db, User: admin)             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

| Host IP | Service Role | Exposed Port | Config Variable | Notes |
|---|---|:---:|---|---|
| **10.200.120.31** | Frontend Web & Nginx Gateway | **`8031`** | `FRONTEND_PORT` | Mnemonic matches .31; no collision with port 80/8080 |
| **10.200.120.33** | Backend API (FastAPI) | **`8033`** | `BACKEND_PORT` | Mnemonic matches .33; Uvicorn 4 workers |
| **10.200.120.33** | PostgreSQL Instance | **`5434`** | `DATABASE_URL` | Dedicated non-standard DB port |

### 16.2 Dynamic Nginx Template Configuration
- `nginx/nginx.frontend.conf.template`:
  - Uses `server ${BACKEND_HOST}:${BACKEND_PORT};` in `upstream backend_service`.
  - Configures `NGINX_ENVSUBST_FILTER="BACKEND_HOST BACKEND_PORT"`.
  - Nginx Docker entrypoint substitutes only these two variables, preventing variable contamination with Nginx internal variables (`$host`, `$remote_addr`, `$proxy_add_x_forwarded_for`, `$http_upgrade`).
  - Sets `client_max_body_size 100M;` and `proxy_read_timeout 180s;` for reliable scanning and large multi-page PDF streaming.

### 16.3 Automated Database Provisioning (`init_db.py`)
- Automatically checks if target database `yanhee_escan_db` exists on `10.200.120.33:5434`.
- If absent, connects with `AUTOCOMMIT` to default admin DB (`postgres`), creates `yanhee_escan_db` with `UTF8` encoding, and provisions all relational tables (`patients`, `encounters`, `document_categories`, `documents`, `document_pages`, `audit_logs`).
- 100% idempotent and safe for repeated executions.

### 16.4 Deployment Commands Summary
- **On Server 2 (`10.200.120.33`)**:
  ```bash
  cp .env.backend.example .env
  sudo ufw allow 8033/tcp
  docker compose -f docker-compose.backend.yml up -d --build
  docker compose -f docker-compose.backend.yml exec backend uv run python scripts/init_db.py
  ```
- **On Server 1 (`10.200.120.31`)**:
  ```bash
  cp .env.frontend.example .env
  sudo ufw allow 8031/tcp
  docker compose -f docker-compose.frontend.yml up -d --build
  ```



