param(
  [string]$VenvPath = ".venv",
  [string]$Wheels = "vendor/wheels",
  [string]$Req = "requirements.txt"
)

Write-Host "Создаю виртуальное окружение в $VenvPath ..."
py -3 -m venv $VenvPath
if ($LASTEXITCODE -ne 0) { python -m venv $VenvPath }

Write-Host "Обновляю pip..."
& "$VenvPath\Scripts\python.exe" -m pip install --upgrade pip

Write-Host "Устанавливаю зависимости из локального каталога $Wheels ..."
& "$VenvPath\Scripts\python.exe" -m pip install --no-index --find-links "$Wheels" -r "$Req"

Write-Host "Готово. Для запуска выполните: scripts\run_offline.ps1"

