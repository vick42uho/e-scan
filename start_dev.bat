@echo off
chcp 65001 > nul
echo ========================================================
echo   Starting Yanhee e-Scan (DMS) Development Environment
echo ========================================================
echo.
echo [1/2] Starting FastAPI Backend on port 8000...
start "Yanhee DMS Backend (FastAPI)" cmd /k "cd /d %~dp0backend && uv run uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"

echo [2/2] Starting Next.js Frontend on port 3000...
start "Yanhee DMS Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && bun run dev --port 3000"

echo.
echo Both servers are launching:
echo  - Frontend Web Viewer : http://localhost:3000
echo  - Backend API Docs    : http://localhost:8000/docs
echo.
echo Press any key to close this launcher window...
pause > nul
