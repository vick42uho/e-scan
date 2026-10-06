@echo off
echo ===========================================
echo   Yanhee DMS - Scanner Bridge Service
echo ===========================================
cd /d "%~dp0"
pip install -r requirements.txt --quiet
uvicorn scan_bridge:app --host 127.0.0.1 --port 18000 --reload
pause
