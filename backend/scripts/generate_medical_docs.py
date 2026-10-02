import os
import sys
import zipfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import pymupdf

backend_dir = Path(__file__).resolve().parent.parent
SAMPLE_DIR = backend_dir.parent / "ตัวอย่าง"
STORAGE_DOCS_DIR = backend_dir / "storage" / "documents"

def get_fonts():
    font_path = "C:/Windows/Fonts/tahoma.ttf"
    font_bold_path = "C:/Windows/Fonts/tahomabd.ttf"
    if not os.path.exists(font_bold_path):
        font_bold_path = font_path

    return {
        "title": ImageFont.truetype(font_bold_path, 28),
        "subtitle": ImageFont.truetype(font_path, 15),
        "header_bold": ImageFont.truetype(font_bold_path, 18),
        "section": ImageFont.truetype(font_bold_path, 17),
        "bold": ImageFont.truetype(font_bold_path, 15),
        "regular": ImageFont.truetype(font_path, 15),
        "small": ImageFont.truetype(font_path, 13),
        "mono": ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 13),
    }

def draw_header(draw, fonts, doc_title_th, doc_code, doc_date="28/02/2020", doctor_name="นพ. สุทธิพงษ์ วิริยะสกุล"):
    # Hospital Top Header
    draw.rectangle([(0, 0), (1240, 6)], fill="#1e40af")
    
    # Emblem Box
    draw.rectangle([(50, 35), (95, 80)], fill="#1e3a8a", outline="#1e40af")
    draw.text((58, 42), "YH", fill="#ffffff", font=fonts["header_bold"])
    
    draw.text((110, 36), "โรงพยาบาลยันฮี (Yanhee Hospital)", fill="#0f172a", font=fonts["title"])
    draw.text((110, 72), "454 ถนนจรัญสนิทวงศ์ แขวงบางอ้อ เขตบางพลัด กรุงเทพมหานคร 10700 | โทร. 1723, 02-879-0300", fill="#64748b", font=fonts["subtitle"])
    
    # Document Type Banner
    draw.rectangle([(50, 100), (1190, 140)], fill="#f1f5f9", outline="#cbd5e1", width=1)
    draw.text((65, 110), f"แบบฟอร์มเวชระเบียน: {doc_title_th}", fill="#1e3a8a", font=fonts["section"])
    draw.text((950, 110), f"รหัสเอกสาร: {doc_code}", fill="#475569", font=fonts["bold"])
    
    # Patient Banner
    draw.rectangle([(50, 150), (1190, 245)], outline="#94a3b8", width=1, fill="#f8fafc")
    draw.text((65, 158), "HN: 08-24-00030", fill="#0f172a", font=fonts["bold"])
    draw.text((260, 158), "EN: 08-24-110023", fill="#0f172a", font=fonts["bold"])
    draw.text((500, 158), f"วันที่รับบริการ: {doc_date}", fill="#0f172a", font=fonts["regular"])
    draw.text((850, 158), f"แพทย์ผู้ตรวจ: {doctor_name}", fill="#1e3a8a", font=fonts["bold"])
    
    draw.text((65, 185), "ชื่อ-นามสกุล: นาย สมชาย ดีใจ (Mr. Somchai Deejai)", fill="#0f172a", font=fonts["regular"])
    draw.text((500, 185), "เพศ: ชาย    อายุ: 48 ปี 9 เดือน    วันเกิด: 12/05/2518", fill="#0f172a", font=fonts["regular"])
    draw.text((850, 185), "เลขประจำตัว ปชช: 1-5062-97167-50-1", fill="#475569", font=fonts["regular"])
    
    draw.text((65, 212), "สิทธิการรักษา: บุคคลทั่วไป (ชำระเงินเอง) / CASH AA OPD", fill="#0f172a", font=fonts["regular"])
    draw.text((500, 212), "ประวัติแพ้ยา: ไม่มีประวัติแพ้ยา (NKDA)", fill="#b91c1c", font=fonts["bold"])
    draw.text((850, 212), "แผนก: อายุรกรรมทั่วไป (Internal Medicine)", fill="#0f172a", font=fonts["regular"])

def draw_footer(draw, fonts, signer_title, signer_name, license_no="ว.44120"):
    # Signature Box
    draw.line([(50, 1600), (1190, 1600)], fill="#cbd5e1", width=1)
    
    # Hospital Stamp Simulation
    draw.rectangle([(100, 1620), (320, 1690)], outline="#2563eb", width=2)
    draw.text((120, 1632), "โรงพยาบาลยันฮี", fill="#1d4ed8", font=fonts["section"])
    draw.text((125, 1660), "YANHEE HOSPITAL", fill="#1d4ed8", font=fonts["small"])
    draw.text((250, 1660), "VERIFIED", fill="#059669", font=fonts["small"])
    
    # Signature Right
    draw.line([(780, 1660), (1140, 1660)], fill="#475569", width=1)
    draw.text((790, 1668), f"ลงชื่อ.......................................................... ({signer_title})", fill="#334155", font=fonts["regular"])
    draw.text((850, 1695), f"{signer_name}  (เลขที่ใบอนุญาต {license_no})", fill="#0f172a", font=fonts["bold"])
    
    draw.text((50, 1720), "เอกสารนี้ได้รับการบันทึกและจัดเก็บในระบบเวชระเบียนสแกนอิเล็กทรอนิกส์ Yanhee e-Scan System", fill="#94a3b8", font=fonts["small"])
    draw.text((1050, 1720), "หน้า 1 จาก 1", fill="#94a3b8", font=fonts["small"])

def generate_opd_clinical_chart():
    fonts = get_fonts()
    im = Image.new("RGB", (1240, 1754), color="#ffffff")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, fonts, "บันทึกการตรวจรักษาของแพทย์ (Doctor's Clinical Record)", "OPD-MED-01")
    
    # Section 1: Vital Signs Box
    y = 265
    draw.rectangle([(50, y), (1190, y + 60)], fill="#f8fafc", outline="#cbd5e1")
    draw.text((65, y + 10), "สัญญาณชีพ (Vital Signs):", fill="#1e3a8a", font=fonts["bold"])
    draw.text((260, y + 10), "BP: 122/78 mmHg", fill="#0f172a", font=fonts["regular"])
    draw.text((450, y + 10), "PR: 76 bpm", fill="#0f172a", font=fonts["regular"])
    draw.text((600, y + 10), "Temp: 36.6 °C", fill="#0f172a", font=fonts["regular"])
    draw.text((750, y + 10), "RR: 18 /min", fill="#0f172a", font=fonts["regular"])
    draw.text((890, y + 10), "SpO2: 99% RA", fill="#0f172a", font=fonts["regular"])
    
    draw.text((65, y + 35), "น้ำหนัก (BW): 68.0 kg", fill="#475569", font=fonts["small"])
    draw.text((260, y + 35), "ส่วนสูง (Ht): 172 cm", fill="#475569", font=fonts["small"])
    draw.text((450, y + 35), "BMI: 22.98 kg/m²", fill="#475569", font=fonts["small"])
    draw.text((600, y + 35), "ระดับความปวด (Pain Score): 3/10", fill="#475569", font=fonts["small"])
    
    # Section 2: Chief Complaint & Present Illness
    y += 80
    draw.text((50, y), "1. อาการสำคัญที่มาโรงพยาบาล (Chief Complaint):", fill="#0f172a", font=fonts["section"])
    y += 26
    draw.text((75, y), "• แน่นจุกแสบใต้ลิ้นปี่ แสบร้อนกลางอก เรอเปรี้ยว เป็นมา 3 วันก่อนมาโรงพยาบาล", fill="#334155", font=fonts["regular"])
    
    y += 40
    draw.text((50, y), "2. ประวัติการเจ็บป่วยปัจจุบัน (Present Illness):", fill="#0f172a", font=fonts["section"])
    y += 26
    lines_pi = [
        "ผู้ป่วยชายไทยอายุ 48 ปี ให้ประวัติว่า 3 วันก่อนเริ่มมีอาการแน่นจุกบริเวณลิ้นปี่และแสบร้อนกลางอก (Heartburn)",
        "อาการมักเป็นมากขึ้นหลังรับประทานอาหารมื้อเย็นและเมื่อนอนราบ ดื่มน้ำอุ่นและยาลดกรดชนิดน้ำบรรเทาได้เล็กน้อย",
        "ไม่มีไข้ ไม่มีอาการคลื่นไส้อาเจียนรุนแรง ไม่มีอาเจียนเป็นเลือดหรือถ่ายดำ ถ่ายอุจจาระและปัสสาวะปกติ",
        "ปฏิเสธประวัติเจ็บแน่นหน้าอกร้าวไปกรามหรือแขน ไม่เหนื่อยหอบ ไม่มีโรคประจำตัวเบาหวาน ความดัน หรือหัวใจ",
        "สูบบุหรี่เป็นครั้งคราว (Social smoker) ไม่ดื่มสุรา ดื่มกาแฟวันละ 1-2 แก้ว"
    ]
    for line in lines_pi:
        draw.text((75, y), line, fill="#334155", font=fonts["regular"])
        y += 24

    # Section 3: Physical Examination
    y += 15
    draw.text((50, y), "3. การตรวจร่างกาย (Physical Examination):", fill="#0f172a", font=fonts["section"])
    y += 26
    lines_pe = [
        "• General Appearance : Good consciousness, well-cooperative, not pale, no jaundice.",
        "• Head & Neck        : HEENT normal, pharynx not injected, thyroid gland not enlarged, no lymphadenopathy.",
        "• Cardiovascular      : Normal S1 S2, regular rhythm, no murmur or gallop.",
        "• Respiratory         : Normal vesicular breath sounds, no rhonchi, no wheezing.",
        "• Abdomen             : Soft, mild tenderness at epigastric area, no guarding, no rebound tenderness.",
        "                        Liver and spleen are not palpable. Normal active bowel sounds.",
        "• Extremities         : No pretibial edema, pulses full and equal bilaterally, CRT < 2 sec.",
        "• Neurological        : Fully alert, motor power grade V all extremities, intact sensory."
    ]
    for line in lines_pe:
        draw.text((75, y), line, fill="#334155", font=fonts["regular"])
        y += 24

    # Section 4: Diagnosis
    y += 15
    draw.text((50, y), "4. การวินิจฉัยโรค (Clinical Diagnosis):", fill="#0f172a", font=fonts["section"])
    y += 26
    draw.rectangle([(70, y), (1190, y + 60)], fill="#eff6ff", outline="#93c5fd")
    draw.text((85, y + 10), "Primary Diagnosis   : Gastroesophageal Reflux Disease (GERD) with Dyspepsia", fill="#1e3a8a", font=fonts["bold"])
    draw.text((85, y + 34), "ICD-10 Code         : K21.9 (GERD without esophagitis), K30 (Dyspepsia)", fill="#1e40af", font=fonts["regular"])

    # Section 5: Orders & Treatment Plan
    y += 80
    draw.text((50, y), "5. การรักษาและรายการสั่งยา (Orders & Treatment Plan):", fill="#0f172a", font=fonts["section"])
    y += 26
    meds = [
        "1. Omeprazole 20 mg capsule  | 1 cap po bid ac (รับประทานครั้งละ 1 เม็ด ก่อนอาหารเช้าและเย็น 30 นาที) #28 caps",
        "2. Algycon chewable tablet    | 1 tab po tid pc & hs (เคี้ยวครั้งละ 1 เม็ด หลังอาหาร 3 มื้อและก่อนนอน) #30 tabs",
        "3. Motilium (Domperidone) 10mg| 1 tab po tid ac (รับประทานครั้งละ 1 เม็ด ก่อนอาหาร 3 มื้อ 15 นาที) #30 tabs"
    ]
    for m in meds:
        draw.text((75, y), m, fill="#0f172a", font=fonts["regular"])
        y += 24

    # Section 6: Doctor's Advice
    y += 15
    draw.text((50, y), "6. คำแนะนำและการนัดหมาย (Physician Recommendation & Follow-up):", fill="#0f172a", font=fonts["section"])
    y += 24
    draw.text((75, y), "• แนะนำปรับพฤติกรรม: หลีกเลี่ยงอาหารมัน ของทอด ชา กาแฟ น้ำอัดลม และงดรับประทานอาหารก่อนนอนอย่างน้อย 3 ชั่วโมง", fill="#334155", font=fonts["regular"])
    y += 22
    draw.text((75, y), "• นัดตรวจติดตามอาการ (Follow-up) อีก 2 สัปดาห์ (13/03/2020) หากมีอาการแน่นหน้าอกรุนแรงหรืออาเจียนให้มาพบแพทย์ทันที", fill="#334155", font=fonts["regular"])

    draw_footer(draw, fonts, "แพทย์ผู้ตรวจ", "นพ. สุทธิพงษ์ วิริยะสกุล", "ว.44120")
    
    out_file = STORAGE_DOCS_DIR / "doc_opd_clinical_chart.png"
    im.save(str(out_file), "PNG")
    print(f"Generated {out_file.name}")

def generate_operative_note():
    fonts = get_fonts()
    im = Image.new("RGB", (1240, 1754), color="#ffffff")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, fonts, "บันทึกการผ่าตัดศัลยกรรม (Operative Note & Surgical Record)", "SURG-NOTE-01", "15/11/2019", "นพ. สุรชัย พัฒนากูล")
    
    y = 265
    draw.rectangle([(50, y), (1190, y + 85)], fill="#f8fafc", outline="#cbd5e1")
    draw.text((65, y + 10), "ศัลยแพทย์ผู้ผ่าตัด (Surgeon):", fill="#1e3a8a", font=fonts["bold"])
    draw.text((320, y + 10), "นพ. สุรชัย พัฒนากูล (ว.35512)", fill="#0f172a", font=fonts["regular"])
    draw.text((650, y + 10), "ผู้ช่วยผ่าตัด (Assistant):", fill="#1e3a8a", font=fonts["bold"])
    draw.text((860, y + 10), "พว. ศิริพร หวานสนิท", fill="#0f172a", font=fonts["regular"])
    
    draw.text((65, y + 35), "วิสัญญีแพทย์ (Anesthesiologist):", fill="#1e3a8a", font=fonts["bold"])
    draw.text((320, y + 35), "พญ. กาญจนา อุดมศิลป์", fill="#0f172a", font=fonts["regular"])
    draw.text((650, y + 35), "วิธีระงับความรู้สึก (Anesthesia):", fill="#1e3a8a", font=fonts["bold"])
    draw.text((860, y + 35), "General Anesthesia (ET-Tube)", fill="#0f172a", font=fonts["regular"])
    
    draw.text((65, y + 60), "เวลาเริ่มผ่าตัด (Start): 14:00 น.", fill="#475569", font=fonts["small"])
    draw.text((320, y + 60), "เวลาเสร็จสิ้น (Finish): 15:15 น.", fill="#475569", font=fonts["small"])
    draw.text((650, y + 60), "ระยะเวลาผ่าตัด (Duration): 1 ชม. 15 นาที", fill="#475569", font=fonts["small"])

    y += 105
    draw.rectangle([(50, y), (1190, y + 70)], fill="#eff6ff", outline="#93c5fd")
    draw.text((65, y + 10), "การวินิจฉัยก่อนผ่าตัด (Pre-operative Diagnosis) :", fill="#1e3a8a", font=fonts["bold"])
    draw.text((450, y + 10), "Acute Appendicitis (K35.8)", fill="#0f172a", font=fonts["bold"])
    draw.text((65, y + 38), "การวินิจฉัยหลังผ่าตัด (Post-operative Diagnosis):", fill="#1e3a8a", font=fonts["bold"])
    draw.text((450, y + 38), "Acute suppurative appendicitis with localized peritonitis", fill="#b91c1c", font=fonts["bold"])

    y += 90
    draw.text((50, y), "ชื่อหัตถการผ่าตัด (Operation Performed):", fill="#0f172a", font=fonts["section"])
    y += 26
    draw.text((75, y), "Laparoscopic Appendectomy (การผ่าตัดไส้ติ่งอักเสบผ่านกล้องส่องตรวจ)", fill="#1d4ed8", font=fonts["header_bold"])

    y += 45
    draw.text((50, y), "สิ่งที่ตรวจพบขณะผ่าตัด (Operative Findings):", fill="#0f172a", font=fonts["section"])
    y += 24
    findings = [
        "1. ไส้ติ่งมีลักษณะบวมแดงอักเสบอย่างชัดเจน (Hyperemic and edematous appendix), ขนาดประมาณ 1.2 x 8.0 cm",
        "2. ตำแหน่งไส้ติ่งอยู่ด้านหลังลำไส้ใหญ่ส่วนต้น (Retrocecal position) มีพังผืดเล็กน้อยรอบโคนไส้ติ่ง",
        "3. มีหนองเคลือบบริเวณผิวไส้ติ่ง (Purulent exudate) แต่ยังไม่มีการแตกทะลุ (No perforation)",
        "4. พบน้ำใสปนขุ่นเล็กน้อยบริเวณอุ้งเชิงกราน (Minimal seropurulent fluid in pelvis ~ 15 mL)",
        "5. ลำไส้ใหญ่ส่วน Cecum และลำไส้เล็กส่วนปลาย (Terminal ileum) มีลักษณะปกติ ไม่มีรอยโรคอื่น"
    ]
    for f in findings:
        draw.text((75, y), f, fill="#334155", font=fonts["regular"])
        y += 22

    y += 20
    draw.text((50, y), "ขั้นตอนและเทคนิคการผ่าตัด (Surgical Technique & Procedure):", fill="#0f172a", font=fonts["section"])
    y += 24
    steps = [
        "1. ผู้ป่วยอยู่ในท่านอนหงาย (Supine position) ภายใต้การดมยาสลบแบบ General Anesthesia",
        "2. ทำความสะอาดช่องท้องด้วย 10% Povidone iodine และปูผ้าปราศจากเชื้อตามมาตรฐานศัลยกรรม",
        "3. เปิดแผลขนาด 10 mm บริเวณใต้สะดือ สอดใส่ Hasson trocar สร้างแรงดันก๊าซ CO2 ในช่องท้องที่ 12 mmHg",
        "4. ส่องกล้อง 30-degree laparoscope สำรวจช่องท้อง และเปิดแผล Trocar 5 mm อีก 2 ตำแหน่ง (LLQ และ Suprapubic)",
        "5. ทำการแยก Mesoappendix ด้วย Harmonic scalpel และหนีบเส้นเลือด Appendicular artery ด้วย Hem-o-lok clip",
        "6. ผูกโคนไส้ติ่งด้วย Endoloop suture 2 เส้น และตัดไส้ติ่งออก นำชิ้นเนื้อใส่ Endo-catch bag และดึงออกทางแผลสะดือ",
        "7. ล้างทำความสะอาดบริเวณช่องท้องส่วนขวาล่างและอุ้งเชิงกรานด้วย Normal saline อุ่น 500 mL ดูดออกจนแห้งและใส",
        "8. ตรวจสอบความเรียบร้อย (Hemostasis): ไม่มีเลือดออก (No active bleeding), ปริมาณเลือดที่เสียประมาณ 20 mL",
        "9. เย็บปิดชั้น Fascia แผลสะดือด้วย Vicryl 2-0 และเย็บปิดผิวหนังทุกแผลด้วย Monocryl 4-0 Subcuticular ปิดแผลปราศจากเชื้อ"
    ]
    for s in steps:
        draw.text((75, y), s, fill="#334155", font=fonts["small"])
        y += 20

    y += 15
    draw.rectangle([(50, y), (1190, y + 45)], fill="#fef2f2", outline="#fecaca")
    draw.text((65, y + 12), "ชิ้นเนื้อส่งตรวจพยาธิวิทยา (Specimen):", fill="#991b1b", font=fonts["bold"])
    draw.text((360, y + 12), "Appendix in 10% formalin ส่งตรวจ Pathological Exam", fill="#0f172a", font=fonts["regular"])

    draw_footer(draw, fonts, "ศัลยแพทย์ผู้ผ่าตัด", "นพ. สุรชัย พัฒนากูล", "ว.35512")
    
    out_file = STORAGE_DOCS_DIR / "doc_operative_note.png"
    im.save(str(out_file), "PNG")
    print(f"Generated {out_file.name}")

def generate_consent_surgery():
    fonts = get_fonts()
    im = Image.new("RGB", (1240, 1754), color="#ffffff")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, fonts, "หนังสือแสดงความยินยอมรับการผ่าตัดและระงับความรู้สึก", "SUR-CONSENT-01", "28/02/2020", "นพ. สุทธิพงษ์ วิริยะสกุล")
    
    y = 265
    draw.rectangle([(50, y), (1190, y + 55)], fill="#f1f5f9", outline="#cbd5e1")
    draw.text((65, y + 15), "ข้าพเจ้า นาย สมชาย ดีใจ  อายุ 48 ปี  ขอทำหนังสือยินยอมฉบับนี้ให้ไว้แก่ โรงพยาบาลยันฮี", fill="#0f172a", font=fonts["bold"])

    y += 75
    draw.text((50, y), "ข้อความแสดงความยินยอมและการรับทราบข้อมูลการรักษา:", fill="#0f172a", font=fonts["section"])
    y += 28
    clauses = [
        "1. ข้าพเจ้าได้รับคำอธิบายและเข้าใจถึงวัตถุประสงค์ ขั้นตอนการตรวจรักษา และการผ่าตัด/ทำหัตถการทางการแพทย์เป็นอย่างดี",
        "2. แพทย์ได้อธิบายถึงประโยชน์ ผลการตรวจ ผลข้างเคียง ตลอดจนความเสี่ยงและภาวะแทรกซ้อนที่อาจเกิดขึ้น ทั้งในขณะทำและหลังทำ",
        "3. ข้าพเจ้าเข้าใจดีว่าการตรวจรักษาและการผ่าตัดทุกชนิดมีความเสี่ยง แม้ว่าแพทย์และบุคลากรทางการแพทย์จะได้ปฏิบัติหน้าที่อย่างระมัดระวัง",
        "4. ข้าพเจ้ายินยอมให้แพทย์ผู้รักษาและคณะแพทย์ ทำการผ่าตัดหรือหัตถการเพิ่มเติมตามดุลยพินิจของแพทย์ หากมีความจำเป็นเร่งด่วนในขณะผ่าตัด",
        "5. ข้าพเจ้ายินยอมให้วิสัญญีแพทย์และคณะให้ยาระงับความรู้สึก (ดมยาสลบ/ฉีดยาชาเฉพาะที่) ตามวิธีที่เหมาะสมแก่ความปลอดภัยของผู้ป่วย",
        "6. ข้าพเจ้าได้มีโอกาสซักถามข้อสงสัยเกี่ยวกับการผ่าตัดและข้อควรปฏิบัติ และได้รับคำตอบเป็นที่พอใจและเข้าใจอย่างครบถ้วนแล้ว"
    ]
    for c in clauses:
        draw.text((75, y), c, fill="#334155", font=fonts["regular"])
        y += 28

    y += 30
    draw.rectangle([(50, y), (1190, y + 90)], fill="#f8fafc", outline="#cbd5e1")
    draw.text((65, y + 12), "หัตถการที่ยินยอมเข้ารับการรักษา:", fill="#1e3a8a", font=fonts["bold"])
    draw.text((320, y + 12), "การตรวจส่องกล้องทางเดินอาหารส่วนบน (Esophagogastroduodenoscopy - EGD)", fill="#0f172a", font=fonts["bold"])
    draw.text((65, y + 42), "แพทย์ผู้อธิบายการรักษา:", fill="#1e3a8a", font=fonts["bold"])
    draw.text((320, y + 42), "นพ. สุทธิพงษ์ วิริยะสกุล (ว.44120) แผนกอายุรกรรม", fill="#0f172a", font=fonts["regular"])

    # Signatures
    y += 120
    draw.rectangle([(50, y), (1190, y + 250)], fill="#ffffff", outline="#cbd5e1")
    draw.text((65, y + 15), "การลงนามแสดงความยินยอม (Signatures of Consent):", fill="#0f172a", font=fonts["section"])
    
    # Sig 1: Patient
    draw.line([(80, y + 110), (560, y + 110)], fill="#475569", width=1)
    draw.text((80, y + 118), "ลงชื่อ.......................................................... ผู้ป่วย/ผู้ให้ความยินยอม", fill="#334155", font=fonts["regular"])
    draw.text((150, y + 145), "( นาย สมชาย ดีใจ )", fill="#0f172a", font=fonts["bold"])
    
    # Sig 2: Witness / Relative
    draw.line([(680, y + 110), (1160, y + 110)], fill="#475569", width=1)
    draw.text((680, y + 118), "ลงชื่อ.......................................................... พยาน / ญาติผู้ป่วย", fill="#334155", font=fonts["regular"])
    draw.text((750, y + 145), "( นางสาว อรทัย ดีใจ )  เกี่ยวข้องเป็น: ภรรยา", fill="#0f172a", font=fonts["bold"])

    # Sig 3: Doctor Explainer
    draw.line([(80, y + 200), (560, y + 200)], fill="#475569", width=1)
    draw.text((80, y + 208), "ลงชื่อ.......................................................... แพทย์ผู้อธิบายข้อมูล", fill="#334155", font=fonts["regular"])
    draw.text((150, y + 235), "( นพ. สุทธิพงษ์ วิริยะสกุล ) ว.44120", fill="#0f172a", font=fonts["bold"])

    # Sig 4: Nurse Witness
    draw.line([(680, y + 200), (1160, y + 200)], fill="#475569", width=1)
    draw.text((680, y + 208), "ลงชื่อ.......................................................... พยาบาลพยาน / ผู้สแกน", fill="#334155", font=fonts["regular"])
    draw.text((750, y + 235), "( พว. วราภรณ์ แสนดี ) พยาบาลวิชาชีพ OPD", fill="#0f172a", font=fonts["bold"])

    draw_footer(draw, fonts, "พยาบาลวิชาชีพผู้บันทึก", "พว. วราภรณ์ แสนดี", "พ.84120")
    
    out_file = STORAGE_DOCS_DIR / "doc_consent_surgery.png"
    im.save(str(out_file), "PNG")
    print(f"Generated {out_file.name}")

def generate_lab_report():
    fonts = get_fonts()
    im = Image.new("RGB", (1240, 1754), color="#ffffff")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, fonts, "ใบรายงานผลการตรวจทางห้องปฏิบัติการ (Clinical Laboratory Report)", "LAB-2019-06", "24/06/2019", "พญ. น้ำมณี มณีนิล")
    
    y = 265
    draw.rectangle([(50, y), (1190, y + 45)], fill="#f8fafc", outline="#cbd5e1")
    draw.text((65, y + 12), "วัน-เวลาเก็บสิ่งส่งตรวจ: 24/06/2019 09:30 น.", fill="#0f172a", font=fonts["regular"])
    draw.text((450, y + 12), "วัน-เวลารายงานผล: 24/06/2019 11:15 น.", fill="#0f172a", font=fonts["regular"])
    draw.text((850, y + 12), "ห้องปฏิบัติการ: Clinical Pathology Unit", fill="#1e3a8a", font=fonts["bold"])

    # Table Header
    y += 60
    draw.rectangle([(50, y), (1190, y + 32)], fill="#1e3a8a")
    draw.text((65, y + 6), "รายการตรวจ (Test Name)", fill="#ffffff", font=fonts["bold"])
    draw.text((450, y + 6), "ผลตรวจ (Result)", fill="#ffffff", font=fonts["bold"])
    draw.text((650, y + 6), "หน่วย (Unit)", fill="#ffffff", font=fonts["bold"])
    draw.text((800, y + 6), "ค่าอ้างอิงปกติ (Reference Range)", fill="#ffffff", font=fonts["bold"])
    draw.text((1070, y + 6), "สถานะ (Flag)", fill="#ffffff", font=fonts["bold"])
    
    tests = [
        # Hematology
        ("[ หมวดโลหิตวิทยา : Complete Blood Count - CBC ]", "", "", "", ""),
        ("Hemoglobin (Hb)", "14.8", "g/dL", "13.0 - 17.5", "Normal"),
        ("Hematocrit (Hct)", "44.2", "%", "40.0 - 52.0", "Normal"),
        ("WBC Count", "6,450", "cells/uL", "4,000 - 10,000", "Normal"),
        ("Neutrophil", "58.2", "%", "40.0 - 70.0", "Normal"),
        ("Lymphocyte", "32.1", "%", "20.0 - 45.0", "Normal"),
        ("Monocyte", "6.5", "%", "2.0 - 10.0", "Normal"),
        ("Eosinophil", "2.8", "%", "1.0 - 5.0", "Normal"),
        ("Basophil", "0.4", "%", "0.0 - 1.0", "Normal"),
        ("Platelet Count", "265,000", "cells/uL", "150,000 - 450,000", "Normal"),
        # Chemistry
        ("[ หมวดชีวเคมี : Blood Chemistry & Renal/Liver Function ]", "", "", "", ""),
        ("Fasting Blood Sugar (FBS)", "92", "mg/dL", "70 - 99", "Normal"),
        ("Blood Urea Nitrogen (BUN)", "12.4", "mg/dL", "7.0 - 20.0", "Normal"),
        ("Creatinine", "0.94", "mg/dL", "0.70 - 1.20", "Normal"),
        ("eGFR (CKD-EPI)", "98.6", "mL/min/1.73m²", ">= 90.0", "Normal (Stage 1)"),
        ("Uric Acid", "5.6", "mg/dL", "3.5 - 7.2", "Normal"),
        ("Total Cholesterol", "185", "mg/dL", "< 200", "Normal"),
        ("Triglycerides", "138", "mg/dL", "< 150", "Normal"),
        ("HDL-Cholesterol", "48", "mg/dL", "> 40", "Normal"),
        ("LDL-Cholesterol (Direct)", "109", "mg/dL", "< 130", "Normal"),
        ("SGOT (AST)", "22", "U/L", "0 - 40", "Normal"),
        ("SGPT (ALT)", "25", "U/L", "0 - 41", "Normal"),
        ("Alkaline Phosphatase (ALP)", "64", "U/L", "40 - 130", "Normal"),
    ]
    
    y += 32
    for t_name, res, unit, ref, flag in tests:
        if t_name.startswith("["):
            draw.rectangle([(50, y), (1190, y + 26)], fill="#e2e8f0")
            draw.text((65, y + 4), t_name, fill="#1e3a8a", font=fonts["bold"])
            y += 26
            continue
            
        bg = "#ffffff" if (len(t_name) % 2 == 0) else "#f8fafc"
        draw.rectangle([(50, y), (1190, y + 26)], fill=bg, outline="#e2e8f0", width=1)
        draw.text((65, y + 3), t_name, fill="#0f172a", font=fonts["regular"])
        draw.text((450, y + 3), res, fill="#0f172a", font=fonts["bold"])
        draw.text((650, y + 3), unit, fill="#64748b", font=fonts["regular"])
        draw.text((800, y + 3), ref, fill="#475569", font=fonts["regular"])
        draw.text((1070, y + 3), flag, fill="#059669", font=fonts["bold"])
        y += 26

    draw_footer(draw, fonts, "นักเทคนิคการแพทย์ผู้รายงานผล", "ทนพ. พิเชษฐ์ ศรีวิชัย", "ทนพ.8841")
    
    out_file = STORAGE_DOCS_DIR / "doc_lab_report.png"
    im.save(str(out_file), "PNG")
    print(f"Generated {out_file.name}")

def generate_xray_report():
    fonts = get_fonts()
    im = Image.new("RGB", (1240, 1754), color="#ffffff")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, fonts, "รายงานผลการตรวจทางรังสีวินิจฉัย (Radiology Report)", "XRAY-CHEST-01", "24/06/2019", "พญ. น้ำมณี มณีนิล")
    
    y = 265
    draw.rectangle([(50, y), (1190, y + 60)], fill="#f8fafc", outline="#cbd5e1")
    draw.text((65, y + 10), "ประเภทการตรวจ (Examination):", fill="#1e3a8a", font=fonts["bold"])
    draw.text((320, y + 10), "Chest PA Upright (Digital Radiography)", fill="#0f172a", font=fonts["bold"])
    draw.text((700, y + 10), "เลขที่ภาพฟิล์ม (Film No):", fill="#1e3a8a", font=fonts["bold"])
    draw.text((920, y + 10), "XR-2019-0624-0881", fill="#0f172a", font=fonts["regular"])
    
    draw.text((65, y + 35), "ข้อบ่งชี้ทางคลินิก (Clinical Indication):", fill="#475569", font=fonts["regular"])
    draw.text((320, y + 35), "Annual Physical Health Check-up (ตรวจสุขภาพประจำปี ไม่มีอาการผิดปกติ)", fill="#0f172a", font=fonts["regular"])

    # Findings
    y += 80
    draw.text((50, y), "ผลการตรวจและคำบรรยายภาพถ่ายรังสี (Radiological Findings):", fill="#0f172a", font=fonts["section"])
    y += 28
    findings = [
        "• Trachea is midline. Normal tracheal and bronchial branching pattern.",
        "• The heart size and cardio-thoracic ratio (CTR) are within normal limits (CTR = 0.46).",
        "• The aortic knob, mediastinal contours, and both hilar shadows appear normal.",
        "• Both lung fields are clear and well-expanded without focal pulmonary infiltration, mass, consolidation, or nodule.",
        "• Both costophrenic angles and hemidiaphragmatic contours are sharp and clear. No pleural effusion or thickening.",
        "• Bony thorax (ribs, clavicles, thoracic spine) and visual soft tissues show no significant pathological finding.",
        "• No pneumothorax, no pneumomediastinum detected."
    ]
    for f in findings:
        draw.text((75, y), f, fill="#334155", font=fonts["regular"])
        y += 26

    # Impression Box
    y += 35
    draw.rectangle([(50, y), (1190, y + 90)], fill="#f0fdf4", outline="#bbf7d0", width=2)
    draw.text((65, y + 12), "ผลการสรุปและวินิจฉัย (Impression):", fill="#166534", font=fonts["section"])
    draw.text((80, y + 42), "1. Normal Chest PA Radiograph.", fill="#15803d", font=fonts["bold"])
    draw.text((80, y + 64), "2. No active pulmonary infiltration, cardiomegaly, or pleural pathology.", fill="#15803d", font=fonts["regular"])

    draw_footer(draw, fonts, "รังสีแพทย์ผู้แปลผล", "นพ. ชาญวิทย์ สุวรรณโชติ", "ว.28441")
    
    out_file = STORAGE_DOCS_DIR / "doc_xray_chest.png"
    im.save(str(out_file), "PNG")
    print(f"Generated {out_file.name}")

def generate_progress_note():
    fonts = get_fonts()
    im = Image.new("RGB", (1240, 1754), color="#ffffff")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, fonts, "บันทึกการติดตามอาการผู้ป่วยนอก (Clinical Progress Note)", "PROGRESS-NOTE-18", "18/12/2018", "นพ. สุทธิพงษ์ วิริยะสกุล")
    
    y = 265
    draw.rectangle([(50, y), (1190, y + 50)], fill="#f8fafc", outline="#cbd5e1")
    draw.text((65, y + 12), "วัน-เวลานัดหมายติดตามอาการ: 18/12/2018 11:45 น.", fill="#0f172a", font=fonts["bold"])
    draw.text((500, y + 12), "BP: 118/76 mmHg    PR: 72 bpm    BW: 67.5 kg", fill="#0f172a", font=fonts["regular"])

    y += 70
    draw.text((50, y), "แบบฟอร์มการบันทึก SOAP Note:", fill="#0f172a", font=fonts["section"])
    
    soap = [
        ("S (Subjective) - อาการที่ผู้ป่วยแจ้ง :", [
            "ผู้ป่วยมารับการตรวจติดตามอาการแน่นลิ้นปี่และแสบร้อนกลางอกตามนัดหมาย",
            "ผู้ป่วยแจ้งว่าหลังรับประทานยา Omeprazole ครบ 2 สัปดาห์ อาการดีขึ้นมาก ไม่แสบร้อนกลางอกแล้ว",
            "ไม่มีอาการเรอเปรี้ยว รับประทานอาหารได้ปกติ ไม่มีคลื่นไส้ ไม่มีอาการแน่นหน้าอก"
        ]),
        ("O (Objective) - สิ่งที่ตรวจพบทางคลินิก :", [
            "Vital Signs: BP 118/76 mmHg, PR 72 bpm, RR 16/min, Temp 36.5 °C, SpO2 99%",
            "Abdomen: Soft, non-distended, no tenderness at epigastrium, liver & spleen not palpable.",
            "Normal bowel sounds, no guarding, no rebound tenderness."
        ]),
        ("A (Assessment) - การประเมินสภาพโรค :", [
            "Gastroesophageal Reflux Disease (GERD) with Dyspepsia - Markedly improved.",
            "ผู้ป่วยตอบสนองต่อการรักษาด้วยยา Proton Pump Inhibitor (PPI) เป็นอย่างดี"
        ]),
        ("P (Plan) - แผนการรักษาและคำแนะนำ :", [
            "1. Continue Omeprazole 20 mg 1 cap po bid ac ต่ออีก 2 สัปดาห์ จากนั้นปรับเป็นรับประทานเฉพาะเวลาที่มีอาการ (PRN)",
            "2. ให้ความรู้และเน้นย้ำเรื่องสุขอนามัยการรับประทานอาหาร: รับประทานอาหารตรงเวลา ไม่นอนหลังอาหารทันที 3 ชม.",
            "3. นัดตรวจซ้ำเมื่อมีอาการผิดปกติ (PRN)"
        ])
    ]
    
    y += 28
    for title, lines in soap:
        draw.rectangle([(50, y), (1190, y + 28)], fill="#f1f5f9")
        draw.text((65, y + 4), title, fill="#1e3a8a", font=fonts["bold"])
        y += 34
        for l in lines:
            draw.text((75, y), f"• {l}", fill="#334155", font=fonts["regular"])
            y += 24
        y += 10

    draw_footer(draw, fonts, "แพทย์ผู้ตรวจรักษา", "นพ. สุทธิพงษ์ วิริยะสกุล", "ว.44120")
    
    out_file = STORAGE_DOCS_DIR / "doc_progress_note.png"
    im.save(str(out_file), "PNG")
    print(f"Generated {out_file.name}")

def generate_pharm_dispense():
    fonts = get_fonts()
    im = Image.new("RGB", (1240, 1754), color="#ffffff")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, fonts, "ใบสั่งยาและบันทึกการส่งมอบยา (Pharmacy Prescription & Dispensing)", "PHARM-DISP-01", "18/12/2018", "นพ. สุทธิพงษ์ วิริยะสกุล")
    
    y = 265
    draw.rectangle([(50, y), (1190, y + 45)], fill="#f8fafc", outline="#cbd5e1")
    draw.text((65, y + 12), "ห้องจ่ายยาผู้ป่วยนอก: OPD Pharmacy Room (ชั้น 1)", fill="#1e3a8a", font=fonts["bold"])
    draw.text((500, y + 12), "เวลาจ่ายยา: 18/12/2018 12:30 น.", fill="#0f172a", font=fonts["regular"])
    draw.text((850, y + 12), "ตรวจสอบการแพ้ยา: ผ่าน (NKDA)", fill="#059669", font=fonts["bold"])

    y += 65
    draw.rectangle([(50, y), (1190, y + 32)], fill="#1e3a8a")
    draw.text((65, y + 6), "ลำดับ", fill="#ffffff", font=fonts["bold"])
    draw.text((120, y + 6), "ชื่อยาและรูปแบบยา (Medication & Dosage Form)", fill="#ffffff", font=fonts["bold"])
    draw.text((600, y + 6), "วิธีใช้ยา (Sig / Instructions)", fill="#ffffff", font=fonts["bold"])
    draw.text((950, y + 6), "จำนวนที่จ่าย", fill="#ffffff", font=fonts["bold"])
    draw.text((1080, y + 6), "ผลตรวจซ้ำ", fill="#ffffff", font=fonts["bold"])
    
    meds = [
        ("1", "Omeprazole 20 mg Capsule (MIRACID)", "รับประทานครั้งละ 1 เม็ด วันละ 2 ครั้ง ก่อนอาหารเช้าและเย็น 30 นาที", "28 แคปซูล", "Pass"),
        ("2", "Algycon Chewable Tablet", "เคี้ยวครั้งละ 1 เม็ด เมื่อมีอาการแสบร้อนกลางอก หลังอาหารหรือก่อนนอน", "20 เม็ด", "Pass"),
        ("3", "Simethicone 80 mg Chewable (Air-X)", "เคี้ยวครั้งละ 1-2 เม็ด เมื่อมีอาการแน่นท้อง ท้องอืด มีลมในกระเพาะ", "20 เม็ด", "Pass"),
    ]
    
    y += 32
    for no, name, sig, qty, chk in meds:
        draw.rectangle([(50, y), (1190, y + 45)], fill="#ffffff", outline="#e2e8f0", width=1)
        draw.text((70, y + 12), no, fill="#0f172a", font=fonts["regular"])
        draw.text((120, y + 12), name, fill="#0f172a", font=fonts["bold"])
        draw.text((600, y + 12), sig, fill="#334155", font=fonts["small"])
        draw.text((950, y + 12), qty, fill="#0f172a", font=fonts["bold"])
        draw.text((1090, y + 12), chk, fill="#059669", font=fonts["bold"])
        y += 45

    y += 40
    draw.text((50, y), "บันทึกการให้คำแนะนำการใช้ยา (Pharmacist Counseling Note):", fill="#0f172a", font=fonts["section"])
    y += 26
    counsels = [
        "• ได้อธิบายให้ผู้ป่วยทราบว่ายา Omeprazole ต้องรับประทานก่อนอาหารอย่างน้อย 30 นาที เพื่อประสิทธิภาพสูงสุดในการยับยั้งการหลั่งกรด",
        "• ยา Algycon เป็นยาเม็ดชนิดเคี้ยว ต้องเคี้ยวให้ละเอียดก่อนกลืน เพื่อให้เกิดชั้นเจลปกป้องหลอดอาหารจากกรดในกระเพาะ",
        "• ตรวจสอบ Drug Interaction แล้ว ไม่พบปฏิกิริยาระหว่างยา ผู้ป่วยเข้าใจวิธีใช้ยาและข้อควรปฏิบัติดี"
    ]
    for c in counsels:
        draw.text((75, y), c, fill="#334155", font=fonts["regular"])
        y += 24

    draw_footer(draw, fonts, "เภสัชกรผู้ตรวจสอบและส่งมอบยา", "ภก. รัตนชัย แซ่ตั้ง", "ภ.19420")
    
    out_file = STORAGE_DOCS_DIR / "doc_pharm_dispense.png"
    im.save(str(out_file), "PNG")
    print(f"Generated {out_file.name}")

def generate_finance_receipt():
    fonts = get_fonts()
    im = Image.new("RGB", (1240, 1754), color="#ffffff")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, fonts, "ใบเสร็จรับเงินค่ารักษาพยาบาล (Official Medical Fee Receipt)", "RECEIPT-2018-08", "10/08/2018", "เจ้าหน้าที่การเงิน")
    
    y = 265
    draw.rectangle([(50, y), (1190, y + 50)], fill="#f8fafc", outline="#cbd5e1")
    draw.text((65, y + 12), "เลขที่ใบเสร็จรับเงิน (Receipt No): REC-2018-0810-0442", fill="#1e3a8a", font=fonts["bold"])
    draw.text((550, y + 12), "วันที่ชำระเงิน: 10/08/2018 14:35 น.", fill="#0f172a", font=fonts["regular"])
    draw.text((880, y + 12), "สถานะ: ชำระครบถ้วน (Paid)", fill="#059669", font=fonts["bold"])

    y += 70
    draw.rectangle([(50, y), (1190, y + 32)], fill="#1e3a8a")
    draw.text((65, y + 6), "ลำดับ", fill="#ffffff", font=fonts["bold"])
    draw.text((120, y + 6), "รายการค่าบริการทางการแพทย์ (Billing Item Description)", fill="#ffffff", font=fonts["bold"])
    draw.text((650, y + 6), "จำนวน", fill="#ffffff", font=fonts["bold"])
    draw.text((850, y + 6), "ราคาต่อหน่วย", fill="#ffffff", font=fonts["bold"])
    draw.text((1050, y + 6), "จำนวนเงิน (บาท)", fill="#ffffff", font=fonts["bold"])

    items = [
        ("1", "ค่าบริการตรวจวินิจฉัยและให้คำปรึกษาของแพทย์ (Doctor Examination Fee)", "1", "500.00", "500.00"),
        ("2", "ค่ายาและเวชภัณฑ์ผู้ป่วยนอก (Outpatient Pharmacy & Medications)", "1", "780.00", "780.00"),
        ("3", "ค่าบริการทางการแพทย์และบริการโรงพยาบาล (Hospital Service Fee)", "1", "150.00", "150.00"),
    ]
    y += 32
    for no, desc, qty, price, amt in items:
        draw.rectangle([(50, y), (1190, y + 38)], fill="#ffffff", outline="#e2e8f0", width=1)
        draw.text((70, y + 10), no, fill="#0f172a", font=fonts["regular"])
        draw.text((120, y + 10), desc, fill="#0f172a", font=fonts["regular"])
        draw.text((660, y + 10), qty, fill="#0f172a", font=fonts["regular"])
        draw.text((860, y + 10), price, fill="#0f172a", font=fonts["regular"])
        draw.text((1060, y + 10), amt, fill="#0f172a", font=fonts["bold"])
        y += 38

    # Total Box
    draw.rectangle([(50, y), (1190, y + 50)], fill="#f1f5f9", outline="#cbd5e1", width=1)
    draw.text((120, y + 14), "จำนวนเงินรวมทั้งสิ้น (ตัวอักษร):  หนึ่งพันสี่ร้อยสามสิบบาทถ้วน", fill="#1e3a8a", font=fonts["bold"])
    draw.text((850, y + 14), "รวมเงินสุทธิ (TOTAL) :", fill="#0f172a", font=fonts["bold"])
    draw.text((1050, y + 14), "1,430.00 บาท", fill="#b91c1c", font=fonts["bold"])

    y += 75
    draw.rectangle([(50, y), (1190, y + 50)], fill="#ffffff", outline="#cbd5e1")
    draw.text((65, y + 14), "วิธีการชำระเงิน (Payment Method):  เงินสด (CASH)", fill="#059669", font=fonts["bold"])
    draw.text((550, y + 14), "ผู้รับเงิน: นางสาว รัตนา เงินดี (เจ้าหน้าที่การเงิน)", fill="#0f172a", font=fonts["regular"])

    draw_footer(draw, fonts, "เจ้าหน้าที่การเงินผู้รับเงิน", "นางสาว รัตนา เงินดี", "FIN-0214")
    
    out_file = STORAGE_DOCS_DIR / "doc_finance_receipt.png"
    im.save(str(out_file), "PNG")
    print(f"Generated {out_file.name}")

def generate_reg_pages():
    fonts = get_fonts()
    
    # Page 1: Registration Form
    im1 = Image.new("RGB", (1240, 1754), color="#ffffff")
    draw1 = ImageDraw.Draw(im1)
    draw_header(draw1, fonts, "ใบขึ้นทะเบียนประวัติเวชระเบียนผู้ป่วยใหม่ (Patient Registration Form)", "REG-2020-001", "28/02/2020", "เจ้าหน้าที่เวชระเบียน")
    
    y = 265
    draw1.text((50, y), "1. ข้อมูลทั่วไปและประวัติส่วนตัวผู้ป่วย (Personal Demographics):", fill="#0f172a", font=fonts["section"])
    y += 28
    demographics = [
        "ชื่อ-นามสกุล : นาย สมชาย ดีใจ (Mr. Somchai Deejai)",
        "เลขประจำตัวประชาชน : 1-5062-97167-50-1    สัญชาติ : ไทย    ศาสนา : พุทธ",
        "วันเกิด : 12 พฤษภาคม 2518 (12/05/1975)    อายุ : 48 ปี    สถานภาพ : สมรส",
        "อาชีพ : พนักงานบริษัทเอกชน    สถานที่ทำงาน : บริษัท กรุงเทพ อุตสาหกรรม จำกัด",
        "ที่อยู่ปัจจุบัน : 88/14 หมู่ที่ 4 ถนนจรัญสนิทวงศ์ แขวงบางอ้อ เขตบางพลัด กรุงเทพมหานคร 10700",
        "เบอร์โทรศัพท์ติดต่อ : 081-445-9872    อีเมล : somchai.deejai@gmail.com"
    ]
    for d in demographics:
        draw1.text((75, y), f"• {d}", fill="#334155", font=fonts["regular"])
        y += 26

    y += 20
    draw1.text((50, y), "2. ข้อมูลผู้ติดต่อกรณีฉุกเฉิน (Emergency Contact Person):", fill="#0f172a", font=fonts["section"])
    y += 28
    draw1.text((75, y), "• ชื่อ-นามสกุล : นางสาว อรทัย ดีใจ    เกี่ยวข้องเป็น : ภรรยา", fill="#334155", font=fonts["regular"])
    y += 26
    draw1.text((75, y), "• เบอร์โทรศัพท์ : 089-223-1189    ที่อยู่ : ที่อยู่เดียวกับผู้ป่วย", fill="#334155", font=fonts["regular"])

    y += 35
    draw1.text((50, y), "3. ประวัติสุขภาพและข้อมูลทางการแพทย์เบื้องต้น (Initial Health History):", fill="#0f172a", font=fonts["section"])
    y += 28
    draw1.text((75, y), "• ประวัติแพ้ยา / แพ้อาหาร : ไม่มีประวัติแพ้ยา (No Known Drug Allergy - NKDA)", fill="#b91c1c", font=fonts["bold"])
    y += 26
    draw1.text((75, y), "• โรคประจำตัว : ไม่มีโรคประจำตัวเรื้อรัง", fill="#334155", font=fonts["regular"])
    y += 26
    draw1.text((75, y), "• ประวัติการผ่าตัด : ปฏิเสธประวัติการผ่าตัดในอดีต", fill="#334155", font=fonts["regular"])

    draw_footer(draw1, fonts, "เจ้าหน้าที่เวชระเบียนผู้รับลงทะเบียน", "Yanhee Staff (ID: YH1005)", "MR-1005")
    
    out_file1 = STORAGE_DOCS_DIR / "doc_p1_reg_page1.png"
    im1.save(str(out_file1), "PNG")
    print(f"Generated {out_file1.name}")

    # Page 2: Copy of Thai National ID Card
    im2 = Image.new("RGB", (1240, 1754), color="#ffffff")
    draw2 = ImageDraw.Draw(im2)
    draw_header(draw2, fonts, "สำเนาบัตรประจำตัวประชาชนผู้ป่วย (Copy of Thai National ID Card)", "REG-2020-001", "28/02/2020", "เจ้าหน้าที่เวชระเบียน")
    
    y = 350
    # Draw simulated ID Card frame
    draw2.rectangle([(250, y), (990, y + 460)], fill="#e0f2fe", outline="#0284c7", width=2)
    draw2.text((275, y + 20), "บัตรประจำตัวประชาชนไทย (Thai National ID Card)", fill="#0369a1", font=fonts["header_bold"])
    draw2.text((275, y + 55), "เลขประจำตัวประชาชน : 1 5062 97167 50 1", fill="#0f172a", font=fonts["bold"])
    
    # ID Photo box
    draw2.rectangle([(780, y + 70), (950, y + 290)], fill="#cbd5e1", outline="#64748b")
    draw2.text((820, y + 170), "[ รูปถ่าย ]", fill="#475569", font=fonts["bold"])

    draw2.text((275, y + 100), "ชื่อตัวและชื่อสกุล : นาย สมชาย ดีใจ", fill="#0f172a", font=fonts["bold"])
    draw2.text((275, y + 130), "Name : Mr. Somchai Deejai", fill="#334155", font=fonts["regular"])
    draw2.text((275, y + 165), "เกิดวันที่ : 12 พ.ค. 2518    Date of Birth : 12 May 1975", fill="#0f172a", font=fonts["regular"])
    draw2.text((275, y + 195), "ที่อยู่ : 88/14 หมู่ที่ 4 ถ.จรัญสนิทวงศ์ แขวงบางอ้อ เขตบางพลัด กรุงเทพมหานคร", fill="#0f172a", font=fonts["small"])
    draw2.text((275, y + 225), "วันออกบัตร : 10 มิ.ย. 2560    วันหมดอายุ : 11 พ.ค. 2568", fill="#475569", font=fonts["small"])

    # Blue Pen Certification Signature across the ID Card
    y_sig = y + 540
    draw2.text((320, y_sig), "สำเนาถูกต้อง เพื่อใช้ประกอบการขึ้นทะเบียนเวชระเบียน รพ.ยันฮี เท่านั้น", fill="#1d4ed8", font=fonts["header_bold"])
    y_sig += 45
    draw2.text((450, y_sig), "นาย สมชาย ดีใจ", fill="#1d4ed8", font=fonts["title"])
    y_sig += 40
    draw2.text((480, y_sig), "( 28 กุมภาพันธ์ 2563 )", fill="#1d4ed8", font=fonts["bold"])

    draw_footer(draw2, fonts, "เจ้าหน้าที่เวชระเบียนผู้ตรวจสอบสำเนา", "Yanhee Staff (ID: YH1005)", "MR-1005")
    
    out_file2 = STORAGE_DOCS_DIR / "doc_p1_reg_page2.png"
    im2.save(str(out_file2), "PNG")
    print(f"Generated {out_file2.name}")

def extract_property_deposit_docx():
    docx_path = SAMPLE_DIR / "RT_Common_267_ใบรับฝากทรัพย์สิน.docx"
    if docx_path.exists():
        with zipfile.ZipFile(docx_path) as z:
            if "word/media/image1.jpeg" in z.namelist():
                data = z.read("word/media/image1.jpeg")
                out_path = STORAGE_DOCS_DIR / "doc_property_deposit.jpg"
                with open(out_path, "wb") as f:
                    f.write(data)
                print(f"Extracted real high-res {out_path.name} from docx (size: {len(data)} bytes)")

def convert_doc03_pdf():
    pdf_path = SAMPLE_DIR / "doc-03.pdf"
    if pdf_path.exists():
        doc = pymupdf.open(str(pdf_path))
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=150)
            out_path = STORAGE_DOCS_DIR / f"doc_03_page{i+1}.jpg"
            pix.save(str(out_path))
        print(f"Converted doc-03.pdf -> 3 pages")

def generate_all():
    STORAGE_DOCS_DIR.mkdir(parents=True, exist_ok=True)
    print("--- Generating Professional Realistic Medical Documents ---")
    generate_opd_clinical_chart()
    generate_operative_note()
    generate_consent_surgery()
    generate_lab_report()
    generate_xray_report()
    generate_progress_note()
    generate_pharm_dispense()
    generate_finance_receipt()
    generate_reg_pages()
    extract_property_deposit_docx()
    convert_doc03_pdf()
    print("--- All sample documents generated successfully! ---")

if __name__ == "__main__":
    generate_all()
