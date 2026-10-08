@echo off
title Yanhee DMS - Uninstall Scanner Bridge
cd /d "%~dp0"

echo ========================================================
echo   Yanhee DMS: Uninstall Scanner Bridge Auto-Start
echo ========================================================

echo [1/2] Removing shortcut from Windows Startup...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\YanheeScannerBridge.lnk" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\YanheeScannerBridge.lnk"
    echo [OK] Removed shortcut from Startup folder.
)

echo [2/2] Stopping Scanner Bridge service (Port 18000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":18000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo [OK] Terminated process PID: %%a
)

echo.
echo ========================================================
echo [SUCCESS] Auto-start removed and background service stopped.
echo ========================================================
echo.
pause
