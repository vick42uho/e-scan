@echo off
title Yanhee DMS - Uninstall Auto-Start Bridge
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall_autostart.ps1"
