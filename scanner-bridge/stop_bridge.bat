@echo off
title Yanhee DMS - Stop Scanner Bridge
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop_bridge.ps1"
