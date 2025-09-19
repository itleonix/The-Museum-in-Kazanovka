$env:DJANGO_SETTINGS_MODULE = "config.settings"

if (!(Test-Path ".venv/Scripts/python.exe")) {
  Write-Host "Не найдено .venv. Запустите scripts/offline_setup.ps1"
  exit 1
}

Write-Host "Запускаю сервер разработки Django ..."
& ".venv/Scripts/python.exe" backend/manage.py runserver 0.0.0.0:8000

