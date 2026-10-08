@echo off
title Yanhee DMS - Install Auto-Start Bridge
echo ========================================================
echo   Yanhee DMS: Installing Scanner Bridge to Windows Auto-Start
echo ========================================================
cd /d "%~dp0"

echo [1/3] Checking dependencies...
pip install -r requirements.txt --quiet

echo [2/3] Adding shortcut to Windows Startup folder...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\YanheeScannerBridge.lnk\"); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%~dp0run_silent.vbs\"'; $s.WorkingDirectory = '%~dp0'; $s.Save()"

echo [3/3] Starting Scanner Bridge silently in background right now...
wscript.exe "%~dp0run_silent.vbs"

echo.
echo ========================================================
echo [SUCCESS] ติดตั้งระบบ Auto-Start สำเร็จเรียบร้อย!
echo - บริการ Scanner Bridge ทำงานในพื้นหลังแล้ว (พอร์ต 18000)
echo - ครั้งต่อไปเมื่อเปิดเครื่อง Windows จะรันอัตโนมัติทันที
echo - ไม่มีหน้าต่าง CMD ดำปรากฏรบกวนการทำงานของเจ้าหน้าที่
echo ========================================================
echo.
pause
