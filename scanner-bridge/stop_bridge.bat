@echo off
title Yanhee DMS - Stop Scanner Bridge
echo ========================================================
echo   Stopping Yanhee Scanner Bridge (Port 18000)...
echo ========================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":18000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo [OK] Terminated Process PID: %%a
)

echo.
echo [DONE] Scanner Bridge stopped.
pause
