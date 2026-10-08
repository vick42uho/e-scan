@echo off
chcp 65001 >nul
title Yanhee DMS - Scanner Bridge Service (Test Mode)
echo ========================================================
echo   Yanhee DMS - Scanner Bridge Service (โหมดทดสอบ)
echo ========================================================
cd /d "%~dp0"
pip install -r requirements.txt --quiet
python -m uvicorn scan_bridge:app --host 127.0.0.1 --port 18000
pause
