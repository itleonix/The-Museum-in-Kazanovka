param(
  [Parameter(Mandatory=$true)][string]$Bundle
)

if (!(Test-Path $Bundle)) { Write-Host "Bundle file not found: $Bundle"; exit 1 }

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$target = "deploy-$ts"
New-Item -ItemType Directory -Force -Path $target | Out-Null

Write-Host "Extracting bundle..."
Expand-Archive -Path $Bundle -DestinationPath $target -Force

Push-Location $target
# Загружаю docker-образы напрямую (WSL не требуется)
if (Test-Path images) {
  Get-ChildItem -Path images -Filter *.tar | ForEach-Object {
    Write-Host ("Loading image from " + $_.FullName + " ...")
    docker load -i $_.FullName
  }
}

Set-Location project
if (!(Test-Path '.env')) { Copy-Item '.env.postgres.offline' '.env' -Force }

docker compose -f docker-compose.offline.yml --env-file .env up -d
Write-Host "Started. Open http://127.0.0.1:9090"
Pop-Location
