import os
import tempfile
import base64
import time
import gc
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pythoncom
import win32com.client

app = FastAPI(title="Yanhee DMS - Scanner Bridge", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Access-Control-Allow-Private-Network"],
)

class ScanRequest(BaseModel):
    dpi: int = Field(default=200, ge=75, le=1200)
    color_mode: str = Field(default='color', pattern='^(color|grayscale|bw)$')
    device_id: str | None = Field(default=None, description="WIA Device ID — ถ้าไม่ระบุจะเลือกเครื่องแรกอัตโนมัติ")

WIA_FORMAT_JPEG = "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}"
WIA_IPS_CUR_INTENT = 6146
WIA_IPS_XRES = 6147
WIA_IPS_YRES = 6148

COLOR_MAPPING = {
    'color': 1,
    'grayscale': 2,
    'bw': 4
}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Scanner Bridge", "version": "1.1.0"}

@app.get("/devices")
def list_devices():
    pythoncom.CoInitialize()
    dev_manager = None
    try:
        dev_manager = win32com.client.Dispatch("WIA.DeviceManager")
        raw_devices = []
        for i in range(1, dev_manager.DeviceInfos.Count + 1):
            info = dev_manager.DeviceInfos(i)
            raw_devices.append({
                "id": info.DeviceID,
                "name": info.Properties("Name").Value,
                "type": info.Type
            })
            
        # กรองและจัดระเบียบอุปกรณ์ป้องกันอุปกรณ์ซ้ำซ้อน (เช่น Brother ที่มีทั้ง native WIA และ eSCL)
        devices = []
        for dev in raw_devices:
            name = dev["name"]
            is_escl = "escl" in dev["id"].lower() or dev["type"] != 1
            # ถ้าเป็น eSCL ให้ตรวจสอบว่ามี Native WIA driver สำหรับชื่อเครื่องนี้อยู่แล้วหรือไม่
            if is_escl:
                has_native = any(
                    d["name"] == name and d["type"] == 1 and "escl" not in d["id"].lower()
                    for d in raw_devices
                )
                if has_native:
                    # ข้าม eSCL ที่ซ้ำซ้อน เพราะ Native WIA เสถียรกว่าและป้องกันชื่อซ้ำ
                    continue
            devices.append({
                "id": dev["id"],
                "name": dev["name"]
            })
            
        return {"devices": devices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        dev_manager = None
        gc.collect()
        pythoncom.CoUninitialize()

@app.post("/scan")
def scan_document(request: ScanRequest):
    pythoncom.CoInitialize()
    temp_file = None
    dev_manager = None
    device_info = None
    device = None
    item = None
    common_dialog = None
    image = None
    try:
        dev_manager = win32com.client.Dispatch("WIA.DeviceManager")
        if dev_manager.DeviceInfos.Count == 0:
            raise HTTPException(status_code=404, detail="No scanner connected")
        
        print(f"[SCAN] Request received: device_id={repr(request.device_id)}, dpi={request.dpi}, color={request.color_mode}")
        
        # ถ้าระบุ device_id มา ให้ค้นหาเครื่องนั้นโดยเฉพาะ
        if request.device_id:
            req_id_clean = request.device_id.strip()
            for i in range(1, dev_manager.DeviceInfos.Count + 1):
                cur_info = dev_manager.DeviceInfos(i)
                # เปรียบเทียบทั้งแบบตรงตัว, แบบ normalized slashes, และแบบตัวพิมพ์เล็ก
                if (cur_info.DeviceID == req_id_clean or 
                    cur_info.DeviceID.lower() == req_id_clean.lower() or
                    cur_info.DeviceID.replace('\\', '/') == req_id_clean.replace('\\', '/')):
                    device_info = cur_info
                    break
            
            if not device_info:
                print(f"[SCAN WARN] Device ID {repr(request.device_id)} not found, falling back to first scanner.")
        
        # ถ้าไม่ระบุ หรือหา ID ที่ระบุไม่พบ ให้เลือก scanner ตัวแรก (Type=1)
        if not device_info:
            for i in range(1, dev_manager.DeviceInfos.Count + 1):
                if dev_manager.DeviceInfos(i).Type == 1:
                    device_info = dev_manager.DeviceInfos(i)
                    break
        
        if not device_info:
            device_info = dev_manager.DeviceInfos(1)
            
        scanner_name = device_info.Properties("Name").Value
        print(f"[SCAN] Using scanner: {scanner_name} (ID: {device_info.DeviceID})")
            
        device = device_info.Connect()
        item = device.Items(1)
        
        intent = COLOR_MAPPING.get(request.color_mode, 1)
        
        for prop in item.Properties:
            if prop.PropertyID == WIA_IPS_CUR_INTENT:
                try: prop.Value = intent
                except: pass
            elif prop.PropertyID == WIA_IPS_XRES:
                try: prop.Value = request.dpi
                except: pass
            elif prop.PropertyID == WIA_IPS_YRES:
                try: prop.Value = request.dpi
                except: pass
                
        common_dialog = win32com.client.Dispatch("WIA.CommonDialog")
        image = common_dialog.ShowTransfer(item, WIA_FORMAT_JPEG, False)
        
        if not image:
            raise HTTPException(status_code=500, detail="Scan failed, no image returned")
            
        temp_dir = tempfile.gettempdir()
        temp_file = os.path.join(temp_dir, f"scan_{os.getpid()}_{int(time.time() * 1000)}.jpg")
        
        if os.path.exists(temp_file):
            try: os.remove(temp_file)
            except: pass
            
        image.SaveFile(temp_file)
        file_size = os.path.getsize(temp_file)
        
        with open(temp_file, "rb") as f:
            base64_data = base64.b64encode(f.read()).decode('utf-8')
            
        print(f"[SCAN SUCCESS] Transferred {file_size} bytes from {scanner_name}")
        return {
            "status": "success",
            "device_name": scanner_name,
            "format": "jpeg",
            "dpi": request.dpi,
            "file_size": file_size,
            "base64_data": f"data:image/jpeg;base64,{base64_data}"
        }
        
    except Exception as e:
        print(f"[SCAN ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_file and os.path.exists(temp_file):
            try: os.remove(temp_file)
            except: pass
        image = None
        common_dialog = None
        item = None
        device = None
        device_info = None
        dev_manager = None
        gc.collect()
        pythoncom.CoUninitialize()
