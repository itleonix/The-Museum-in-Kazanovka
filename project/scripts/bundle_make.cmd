@echo off
REM Запуск упаковки с обходом ExecutionPolicy
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0bundle_make.ps1"

