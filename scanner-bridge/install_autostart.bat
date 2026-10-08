@echo off
title Yanhee DMS - Install Auto-Start Bridge
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_autostart.ps1"
