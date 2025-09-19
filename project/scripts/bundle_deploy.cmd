@echo off
REM Развёртывание бандла с обходом ExecutionPolicy
IF "%~1"=="" (
  ECHO Использование: %~nx0 path\to\kazmuseum_bundle_*.zip
  EXIT /B 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0bundle_deploy.ps1" "%~1"

