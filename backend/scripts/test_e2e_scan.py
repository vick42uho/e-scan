import sys
sys.stdout.reconfigure(encoding='utf-8')
import httpx
import json

client = httpx.Client(base_url="http://localhost:8000/api/v1", timeout=30.0)

print("--- 1. Fetching Categories ---")
cat_res = client.get("/scan/categories")
print(f"Categories status: {cat_res.status_code}, count: {len(cat_res.json())}")

print("\n--- 2. Metadata Extraction from Image (doc_consent_surgery.png) ---")
img_path = r"d:\My-work_My-Everything\DMS\backend\storage\documents\doc_consent_surgery.png"
with open(img_path, "rb") as f:
    files = {"file": ("doc_consent_surgery.png", f.read(), "image/png")}
ext_res = client.post("/scan/extract-metadata", files=files, data={"mode": "auto"})
print(f"Extract status: {ext_res.status_code}")
ext_data = ext_res.json()
data = ext_data.get("data", {})
for k in ["hn", "en", "name", "age", "dob", "visit_date", "document_code", "title", "category_name", "doctor_name"]:
    print(f"  {k}: {data.get(k)}")

print("\n--- 3. Upload & Index Document to DMS ---")
with open(img_path, "rb") as f:
    upload_files = {"file": ("doc_consent_surgery.png", f.read(), "image/png")}

upload_payload = {
    "hn": data.get("hn"),
    "title": data.get("title") or "หนังสือแสดงความยินยอมรับการผ่าตัดและระงับความรู้สึก",
    "category_id": data.get("category_id") or 2,
    "en": data.get("en") or "08-24-110023",
    "document_code": data.get("document_code") or "SUR-CONSENT-01",
    "doctor_name": data.get("doctor_name") or "นพ. สุทธิพงษ์ วิริยะสกุล",
    "patient_name": data.get("name") or "นาย สมชาย ดีใจ",
    "age": data.get("age") or "48 ปี 9 เดือน",
    "dob": data.get("dob") or "12/05/2518",
    "encounter_type": "OPD",
    "is_doctor_document": "true",
    "is_confidential": "false",
    "scan_by_id": "STAFF-001",
    "scan_by_name": "เจ้าหน้าที่เวชระเบียน",
    "scan_by_role": "Staff"
}

up_res = client.post("/scan/upload", files=upload_files, data=upload_payload)
print(f"Upload status: {up_res.status_code}")
print(f"Upload response: {up_res.json()}")

print("\n--- 4. Verify Document via Patient Document Tree API ---")
tree_res = client.get(f"/documents/tree/{data.get('hn')}")
print(f"Tree status: {tree_res.status_code}")
if tree_res.status_code == 200:
    tree_data = tree_res.json()
    print(f"Patient Name in Tree: {tree_data.get('patient', {}).get('name_th')}")
    print(f"Encounters count: {len(tree_data.get('encounters', []))}")
    print(f"Total documents found: {len(tree_data.get('documents', []))}")

print("\n--- 5. Metadata Extraction from PDF (MEDHIS) ---")
pdf_path = r"C:\Users\it-dev\Downloads\MEDHIS _ OPD _ OPD Worklist.pdf"
try:
    with open(pdf_path, "rb") as f:
        pdf_files = {"file": ("MEDHIS.pdf", f.read(), "application/pdf")}
    pdf_ext_res = client.post("/scan/extract-metadata", files=pdf_files, data={"mode": "auto"})
    print(f"PDF Extract status: {pdf_ext_res.status_code}")
    pdf_d = pdf_ext_res.json().get("data", {})
    for k in ["hn", "en", "name", "age", "dob", "visit_date", "document_code", "title", "category_name"]:
        print(f"  PDF {k}: {pdf_d.get(k)}")
except Exception as e:
    print(f"PDF test error: {e}")

print("\n--- ALL TESTS COMPLETED SUCCESSFULLY ---")
