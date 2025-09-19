param(
  [string]$Req = "requirements.txt",
  [string]$OutDir = "vendor/wheels"
)

if (!(Test-Path $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }

Write-Host "Скачиваю колёса зависимостей в $OutDir ..."
py -3 -m pip download -r $Req -d $OutDir
if ($LASTEXITCODE -ne 0) {
  Write-Host "Попытка через 'python'..."
  python -m pip download -r $Req -d $OutDir
}

Write-Host "Готово. Проверьте содержимое $OutDir"

