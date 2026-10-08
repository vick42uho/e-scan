@echo off
title Yanhee DMS - Scanner Bridge Auto-Start Installer
cd /d "%~dp0"

echo ========================================================
echo   Yanhee DMS: Scanner Bridge Auto-Start Installer
echo ========================================================

echo [1/3] Checking dependencies...
pip install -r requirements.txt --quiet

echo [2/3] Registering shortcut to Windows Startup...
powershell -NoProfile -Command "$ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\YanheeScannerBridge.lnk\"); $s.TargetPath='wscript.exe'; $s.Arguments='\"%~dp0run_silent.vbs\"'; $s.WorkingDirectory='%~dp0'; $s.Save()"

echo [3/3] Launching background service (Port 18000)...
wscript.exe "%~dp0run_silent.vbs"

echo.
echo ========================================================
echo [SUCCESS] Auto-Start configured successfully!
echo - Scanner Bridge is now running in the background.
echo - It will start automatically every time this PC boots.
echo - No command prompt window will be displayed.
echo ========================================================
echo.
pause
