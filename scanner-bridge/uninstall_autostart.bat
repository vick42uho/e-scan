@echo off
title Yanhee DMS - Uninstall Auto-Start Bridge
echo ========================================================
echo   Removing Yanhee Scanner Bridge from Windows Auto-Start
echo ========================================================

if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\YanheeScannerBridge.lnk" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\YanheeScannerBridge.lnk"
    echo [OK] Removed startup shortcut from Windows Startup folder.
)

echo.
echo Stopping running Scanner Bridge (Port 18000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":18000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo [OK] Terminated Process PID: %%a
)

echo.
echo ========================================================
echo [SUCCESS] ยกเลิกการ Auto-Start และหยุดการทำงานเรียบร้อยแล้ว
echo ========================================================
echo.
pause
