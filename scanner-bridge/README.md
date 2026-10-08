# Yanhee DMS — Local Scanner Bridge (Windows WIA)

บริการเชื่อมต่อเครื่องสแกนเนอร์ทางคลินิก (เช่น EPSON Perfection V39, Brother MFC) เข้ากับระบบ Yanhee DMS ผ่านพอร์ต `http://127.0.0.1:18000`

---

## 🛠️ ไฟล์และการใช้งาน

| ไฟล์ | หน้าที่ |
|---|---|
| **`install_autostart.bat`** | **(แนะนำสำหรับหน้างาน)** ดับเบิลคลิกครั้งเดียวเพื่อติดตั้งให้รันอัตโนมัติทุกครั้งที่เปิดเครื่อง Windows แบบซ่อนหน้าต่างดำ (Silent Background) |
| **`uninstall_autostart.bat`** | ยกเลิกการเปิดตอนบูตเครื่อง และหยุดการทำงานของเซอร์วิส |
| **`run_silent.vbs`** | สคริปต์สั่งรันเบื้องหลังแบบไม่มีหน้าต่างคอนโซล CMD โผล่มากวนสายตา |
| **`start_bridge.bat`** | รันแบบแสดงหน้าต่าง CMD สำหรับการทดสอบ (Debug / Test) |
| **`stop_bridge.bat`** | สั่งหยุดโปรเซสที่พอร์ต 18000 ทันที |

---

## 🚀 3 วิธีตั้งค่าให้รันอัตโนมัติเมื่อเปิดเครื่อง (Auto-Start)

### วิธีที่ 1: ติดตั้งผ่าน Windows Startup (ง่ายที่สุด แนะนำ 🌟)
1. ดับเบิลคลิกไฟล์ **`install_autostart.bat`**
2. ระบบจะสร้างทางลัดไว้ในโฟลเดอร์ Startup (`shell:startup`) ให้อัตโนมัติ และสั่งเปิดโปรแกรมให้ทันที
3. ข้อดี: 
   * ทำงานเงียบๆ ในพื้นหลัง (Background) ไม่มีหน้าต่างดำกวนใจเจ้าหน้าที่
   * เจ้าหน้าที่ไม่ต้องเปิดเอง และไม่สามารถเผลอกดปิดหน้าต่างได้

---

### วิธีที่ 2: ตั้งค่าผ่าน Windows Task Scheduler (สำหรับ IT Admin)
สามารถเปิด Command Prompt (Run as Administrator) แล้วสั่ง:
```cmd
schtasks /create /tn "YanheeScannerBridge" /tr "wscript.exe \"%CD%\run_silent.vbs\"" /sc onlogon /rl highest /f
```
* **ข้อดี**: รันด้วยสิทธิ์สูงสุด (Highest privileges) เมื่อเจ้าหน้าที่ Login เข้า Windows

---

### วิธีที่ 3: ติดตั้งเป็น Windows Service ระดับระบบผ่าน NSSM (สำหรับ Enterprise)
หากต้องการให้ทำงานเป็น Windows Service ที่รันตั้งแต่เครื่องเปิด (แม้ไม่มีใครล็อกอิน):
1. ดาวน์โหลด [NSSM (Non-Sucking Service Manager)](https://nssm.cc/)
2. รันคำสั่ง:
   ```cmd
   nssm install YanheeScannerBridge "cmd.exe" "/c python -m uvicorn scan_bridge:app --host 127.0.0.1 --port 18000"
   nssm set YanheeScannerBridge AppDirectory "%CD%"
   nssm set YanheeScannerBridge Start SERVICE_AUTO_START
   nssm start YanheeScannerBridge
   ```
3. จัดการเปิด/ปิดผ่าน `services.msc` ได้ทันที
