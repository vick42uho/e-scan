# 📖 คู่มือการติดตั้งและอัปเดตระบบ Yanhee e-Scan DMS (v3.2 Secured)
**คู่มือปฏิบัติการ (Operational Runbook) สำหรับ Ubuntu 24.04 LTS (GNU/Linux 6.8.0 x86_64)**

---

## 📑 สารบัญ
1. [ข้อมูลสถาปัตยกรรมและเซิร์ฟเวอร์ (Architecture Overview)](#1-ข้อมูลสถาปัตยกรรมและเซิร์ฟเวอร์-architecture-overview)
2. [ขั้นตอนการติดตั้งระบบครั้งแรก (Initial Deployment)](#2-ขั้นตอนการติดตั้งระบบครั้งแรก-initial-deployment)
   - [2.1 ติดตั้ง Docker & Compose บน Ubuntu](#21-ติดตั้ง-docker--compose-บน-ubuntu-ทำทั้ง-2-เครื่อง)
   - [2.2 ติดตั้ง Server 2: Backend + Database (10.200.120.33)](#22-ติดตั้ง-server-2-backend--database-1020012033)
   - [2.3 ติดตั้ง Server 1: Frontend Server (10.200.120.31)](#23-ติดตั้ง-server-1-frontend-server-1020012031)
3. [ขั้นตอนการอัปเดตโค้ดเมื่อมีการแก้ไข (Code Update & Re-deploy)](#3-ขั้นตอนการอัปเดตโค้ดเมื่อมีการแก้ไข-code-update--re-deploy)
   - [3.1 อัปเดตเฉพาะ Backend / Database](#31-กรณีแก้ไขเฉพาะ-backend--database-ทำที่-1020012033)
   - [3.2 อัปเดตเฉพาะ Frontend UI](#32-กรณีแก้ไขเฉพาะ-frontend-ทำที่-1020012031)
   - [3.3 อัปเดตระบบทั้งหมดพร้อมกัน (Full Update)](#33-กรณีอัปเดตทั้งสองฝั่ง-full-system-update)
4. [คำสั่งดูแลระบบและตรวจสอบสถานะ (Maintenance & Useful Commands)](#4-คำสั่งดูแลระบบและตรวจสอบสถานะ-maintenance-commands)
5. [การแก้ไขปัญหาที่พบบ่อย (Troubleshooting & FAQ)](#5-การแก้ไขปัญหาที่พบบ่อย-troubleshooting)

---

## 1. ข้อมูลสถาปัตยกรรมและเซิร์ฟเวอร์ (Architecture Overview)

ระบบถูกออกแบบแยก 2 เซิร์ฟเวอร์ในเครือข่ายภายในโรงพยาบาลยันฮี พร้อมกำหนดพอร์ตแยกเฉพาะเพื่อไม่ให้ชนกับแอปพลิเคชันอื่น:

```
[ เครื่องลูกข่ายเจ้าหน้าที่ / ห้องบัตร (Browser) ]
                  │
                  │ เรียกใช้งานผ่าน Port 8031
                  ▼
┌────────────────────────────────────────────────────────┐
│ 🌐 Server 1: Frontend Server (10.200.120.31)           │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Nginx Gateway Container (Port 8031:80)           │  │
│  │                                                  │  │
│  │   • "/"           ──► Next.js (Port 3000)        │  │
│  │   • "/api/v1/"    ──► http://10.200.120.33:8033  │──┼──┐ (LAN โรงพยาบาล)
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
│ ⚙️ Server 2: Backend & Database Server (10.200.120.33)     │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ FastAPI Backend Container (Port 8033:8000)           │  │
│  │ (Python 3.13 + uv + Uvicorn 4 workers)               │  │
│  │                                                      │  │
│  │   • Volume: ./backend/storage/documents              │  │
│  │   • Volume: ./backend/storage/thumbnails             │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │ Local connection                │
│                          │ (:5434)                         │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │ PostgreSQL 14+ Instance                              │  │
│  │ (Port 5434, Database: yanhee_escan_db)               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### ตารางพอร์ตที่กำหนด (Port Allocation)

| เซิร์ฟเวอร์ | บริการ | พอร์ตที่เปิด | ไฟล์คอนฟิก Docker | ตัวแปรใน `.env` |
|---|---|:---:|---|---|
| **`10.200.120.31`** | Frontend Web & Nginx Gateway | **`8031`** | `docker-compose.frontend.yml` | `FRONTEND_PORT=8031` |
| **`10.200.120.33`** | Backend API (FastAPI) | **`8033`** | `docker-compose.backend.yml` | `BACKEND_PORT=8033` |
| **`10.200.120.33`** | PostgreSQL Instance | **`5434`** | (รันบน Host/Service) | `DATABASE_URL` |

---

## 2. ขั้นตอนการติดตั้งระบบครั้งแรก (Initial Deployment)

> **คำแนะนำ**: ติดตั้ง **Server 2 (`10.200.120.33`)** ให้เสร็จก่อน จากนั้นค่อยติดตั้ง **Server 1 (`10.200.120.31`)**

### 2.1 ติดตั้ง Docker & Compose บน Ubuntu (ทำทั้ง 2 เครื่อง)
หากเครื่องเซิร์ฟเวอร์ยังไม่มี Docker ให้รันคำสั่งชุดนี้:

```bash
# อัปเดตและติดตั้งเครื่องมือจำเป็น
sudo apt update && sudo apt install -y ca-certificates curl gnupg lsb-release

# เพิ่ม Docker GPG Key ทางการ
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# เพิ่ม Repository สำหรับ Ubuntu 24.04 (Noble)
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# ติดตั้ง Docker Engine และ Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# อนุญาตให้ user ปัจจุบันสั่ง docker ได้โดยไม่ต้อง sudo
sudo usermod -aG docker $USER

# โหลด group ใหม่ทันที
newgrp docker
```

---

### 2.2 ติดตั้ง Server 2: Backend + Database (`10.200.120.33`)

#### ขั้นตอนที่ 1: Clone โปรเจกต์
```bash
git clone https://github.com/vick42uho/e-scan.git dms
cd dms
```

#### ขั้นตอนที่ 2: ตั้งค่า `.env` สำหรับ Backend
```bash
cp .env.backend.example .env
```
*(ค่าเริ่มต้นในไฟล์จะชี้ไปที่ `postgresql://admin:it240@10.200.120.33:5434/yanhee_escan_db` และพอร์ต `8033` เรียบร้อยแล้ว หากต้องการแก้ไขใช้ `nano .env`)*

#### ขั้นตอนที่ 3: เปิด Firewall พอร์ต 8033
```bash
sudo ufw allow 8033/tcp comment "Yanhee DMS Backend API"
```

#### ขั้นตอนที่ 4: สั่ง Build และ Start Backend Container
```bash
docker compose -f docker-compose.backend.yml up -d --build
```

#### ขั้นตอนที่ 5: ตรวจสอบและสร้างฐานข้อมูล + ตารางอัตโนมัติ
```bash
# รันสคริปต์สร้าง Database (ถ้ายังไม่มี) และสร้างตารางทั้งหมดในฐานข้อมูล
docker compose -f docker-compose.backend.yml exec backend uv run python scripts/init_db.py

# (ทางเลือก) สั่งสร้าง Mock Data สำหรับทดสอบระบบ
docker compose -f docker-compose.backend.yml exec backend uv run python scripts/seed_mock_data.py
```

#### ขั้นตอนที่ 6: ตรวจสอบสถานะ Backend
```bash
# ทดสอบ Health Check (ต้องตอบกลับเป็น JSON สถานะ ok)
curl http://localhost:8033/health

# ตรวจสอบ log ของ container
docker compose -f docker-compose.backend.yml logs -f --tail=30
```

---

### 2.3 ติดตั้ง Server 1: Frontend Server (`10.200.120.31`)

#### ขั้นตอนที่ 1: Clone โปรเจกต์
```bash
git clone https://github.com/vick42uho/e-scan.git dms
cd dms
```

#### ขั้นตอนที่ 2: ตั้งค่า `.env` สำหรับ Frontend
```bash
cp .env.frontend.example .env
```
*(ค่าเริ่มต้นในไฟล์ตั้งค่า `FRONTEND_PORT=8031`, `BACKEND_HOST=10.200.120.33`, `BACKEND_PORT=8033` ไว้เรียบร้อยแล้ว)*

#### ขั้นตอนที่ 3: เปิด Firewall พอร์ต 8031
```bash
sudo ufw allow 8031/tcp comment "Yanhee DMS Frontend Web"
```

#### ขั้นตอนที่ 4: สั่ง Build และ Start Frontend Container
```bash
docker compose -f docker-compose.frontend.yml up -d --build
```

#### ขั้นตอนที่ 5: ตรวจสอบสถานะ Frontend
```bash
# ตรวจสอบว่า Container ขึ้นสถานะ Up และ healthy ทั้งคู่
docker compose -f docker-compose.frontend.yml ps

# ทดสอบว่า Nginx Gateway ส่งต่อข้ามเครื่องไปดึง Health Check จาก 10.200.120.33:8033 ได้สำเร็จ
curl http://localhost:8031/health
```

---

### 🌐 การเข้าใช้งานระบบ
- **หน้าเว็บระบบสแกนและเปิดดูเอกสาร**: `http://10.200.120.31:8031/`
  - หน้าดูเอกสารเวชระเบียน: `http://10.200.120.31:8031/view`
  - หน้าสแกนเอกสาร: `http://10.200.120.31:8031/scan`
- **Swagger API Documentation**:
  - ผ่าน Gateway: `http://10.200.120.31:8031/docs`
  - ตรงที่ Backend: `http://10.200.120.33:8033/docs`

---

## 3. ขั้นตอนการอัปเดตโค้ดเมื่อมีการแก้ไข (Code Update & Re-deploy)

เมื่อทีมพัฒนาแก้ไขโค้ดและ push ขึ้น GitHub แล้ว สามารถอัปเดตขึ้นเครื่องเซิร์ฟเวอร์ได้ดังนี้:

### 3.1 กรณีแก้ไขเฉพาะ Backend / Database (ทำที่ `10.200.120.33`)

```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd ~/dms

# 2. ดึงโค้ดล่าสุดจาก Git
git pull origin main

# 3. สั่ง Rebuild และเริ่มบริการใหม่เฉพาะ Backend
docker compose -f docker-compose.backend.yml up -d --build backend

# 4. (ถ้ามีการเพิ่มตารางหรือโมเดลใหม่ใน DB) สั่งอัปเดตฐานข้อมูล
docker compose -f docker-compose.backend.yml exec backend uv run python scripts/init_db.py

# 5. ดู Log ตรวจสอบว่า Backend ทำงานปกติ
docker compose -f docker-compose.backend.yml logs -f --tail=50 backend
```
> **หมายเหตุ**: ไฟล์เอกสารสแกนที่อยู่ใน `./backend/storage/documents` จะ **ไม่สูญหาย** เพราะถูกผูกด้วย Docker Volume ไว้บนเครื่องโฮสต์อย่างปลอดภัย

---

### 3.2 กรณีแก้ไขเฉพาะ Frontend (ทำที่ `10.200.120.31`)

```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd ~/dms

# 2. ดึงโค้ดล่าสุดจาก Git
git pull origin main

# 3. สั่ง Rebuild และเริ่มบริการใหม่เฉพาะ Frontend
docker compose -f docker-compose.frontend.yml up -d --build frontend

# 4. ดู Log ตรวจสอบว่า Frontend รันสำเร็จ
docker compose -f docker-compose.frontend.yml logs -f --tail=50 frontend
```
*(ถ้ามีการแก้ไขคอนฟิก Nginx ด้วย ให้สั่ง `docker compose -f docker-compose.frontend.yml up -d --build` เพื่อให้ Nginx โหลดคอนฟิกใหม่)*

---

### 3.3 กรณีอัปเดตทั้งสองฝั่ง (Full System Update)

แนะนำให้ทำตามลำดับดังนี้:
1. **ไปที่เครื่อง Server 2 (`10.200.120.33`)**:
   ```bash
   cd ~/dms && git pull origin main
   docker compose -f docker-compose.backend.yml up -d --build
   docker compose -f docker-compose.backend.yml exec backend uv run python scripts/init_db.py
   ```
2. **จากนั้นไปที่เครื่อง Server 1 (`10.200.120.31`)**:
   ```bash
   cd ~/dms && git pull origin main
   docker compose -f docker-compose.frontend.yml up -d --build
   ```

---

## 4. คำสั่งดูแลระบบและตรวจสอบสถานะ (Maintenance Commands)

### ตรวจสอบสถานะการทำงานของ Container
```bash
# บน Server 1 (Frontend)
docker compose -f docker-compose.frontend.yml ps

# บน Server 2 (Backend)
docker compose -f docker-compose.backend.yml ps
```

### ดู Log แบบ Real-time
```bash
# ดู log ทั้งหมด
docker compose -f docker-compose.frontend.yml logs -f

# ดูเฉพาะ 100 บรรทัดล่าสุดและเกาะติดการทำงาน
docker compose -f docker-compose.backend.yml logs -f --tail=100 backend
```

### รีสตาร์ทบริการ (Restart)
```bash
# รีสตาร์ท Backend
docker compose -f docker-compose.backend.yml restart backend

# รีสตาร์ท Frontend หรือ Nginx
docker compose -f docker-compose.frontend.yml restart frontend
docker compose -f docker-compose.frontend.yml restart nginx
```

### การหยุดและล้างบริการ (Stop & Cleanup)
```bash
# หยุดการทำงานของ Containers
docker compose -f docker-compose.frontend.yml down
docker compose -f docker-compose.backend.yml down

# ล้าง Image หรือ Cache ที่ไม่ได้ใช้ เพื่อคืนพื้นที่ดิสก์
docker image prune -f
docker builder prune -f
```

### สำรองข้อมูลไฟล์เอกสารสแกน (Storage Backup)
ไฟล์สแกนทั้งหมดของคนไข้จะเก็บอยู่ที่ Server 2 (`10.200.120.33`):
```bash
# สั่งบีบอัดสำรองข้อมูลโฟลเดอร์เก็บเอกสารสแกน
tar -czvf backup_dms_documents_$(date +%Y%m%d).tar.gz backend/storage/documents/
```

---

## 5. การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)

### ปัญหาที่ 1: หน้าเว็บฟ้อง `502 Bad Gateway`
- **สาเหตุ**: Nginx บน `10.200.120.31` ไม่สามารถเชื่อมต่อไปยัง `10.200.120.33:8033` ได้
- **วิธีแก้**:
  1. ตรวจสอบว่า Backend บน `10.200.120.33` รันอยู่หรือไม่:
     ```bash
     docker compose -f docker-compose.backend.yml ps
     ```
  2. ตรวจสอบ Firewall บนเครื่อง `10.200.120.33` ว่าเปิดพอร์ต 8033 แล้วหรือยัง:
     ```bash
     sudo ufw status
     # ถ้ายังไม่มี ให้สั่ง:
     sudo ufw allow 8033/tcp
     ```
  3. ทดสอบยิง `curl` จากเครื่อง `10.200.120.31` ไปที่เครื่อง `10.200.120.33`:
     ```bash
     curl http://10.200.120.33:8033/health
     ```

### ปัญหาที่ 2: เชื่อมต่อ Database ไม่สำเร็จ (`Connection refused` หรือ `FATAL: database "yanhee_escan_db" does not exist`)
- **สาเหตุ**: PostgreSQL ยังไม่ได้เปิดรับการเชื่อมต่อ หรือพอร์ตไม่ถูกต้อง
- **วิธีแก้**:
  1. ตรวจสอบว่า PostgreSQL รันอยู่ที่พอร์ต `5434` จริงหรือไม่:
     ```bash
     sudo netstat -tlpn | grep 5434
     ```
  2. สั่งรันสคริปต์สร้าง Database อีกครั้ง:
     ```bash
     docker compose -f docker-compose.backend.yml exec backend uv run python scripts/init_db.py
     ```

### ปัญหาที่ 3: ต้องการเปลี่ยนพอร์ตหนีแอปอื่น
- **วิธีแก้**:
  1. แก้ไขเลขพอร์ตในไฟล์ `.env` ได้ทันที เช่น เปลี่ยน `FRONTEND_PORT=8080`
  2. สั่ง Re-create Container:
     ```bash
     docker compose -f docker-compose.frontend.yml up -d
     ```
  3. เปิด Firewall ตามเลขพอร์ตใหม่: `sudo ufw allow <พอร์ตใหม่>/tcp`
