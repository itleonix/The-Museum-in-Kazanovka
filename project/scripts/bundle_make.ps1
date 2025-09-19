param(
  [string]$ComposeFile = "docker-compose.offline.yml",
  [string]$EnvFile = ".env"
)

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$stage = Join-Path "bundle" ("stage-" + $ts)
$imagesDir = Join-Path $stage "images"
$backupsDir = Join-Path $stage "backups"
$projDir = Join-Path $stage "project"
$out = Join-Path "bundle" ("kazmuseum_bundle_" + $ts + ".zip")

New-Item -ItemType Directory -Force -Path $imagesDir | Out-Null
New-Item -ItemType Directory -Force -Path $backupsDir | Out-Null
New-Item -ItemType Directory -Force -Path $projDir | Out-Null

if (!(Test-Path $EnvFile)) { Write-Host "Missing $EnvFile. Copy .env.postgres.offline to .env"; exit 1 }

Write-Host "Starting db for dump..."
docker compose -f $ComposeFile --env-file $EnvFile up -d db
Start-Sleep -Seconds 2

Write-Host "Creating DB dump..."
$env:COMPOSE_FILE=$ComposeFile
$env:ENV_FILE=$EnvFile
bash -lc './scripts/db_dump.sh'
if (Test-Path "backups/db.dump") {
  Copy-Item "backups/db.dump" $backupsDir -Force
} else {
  Write-Host "Warning: DB dump not created. The bundle will be built without backups/db.dump"
}

Write-Host "Building app image..."
docker build -t kazmuseum_web:offline .
Write-Host "Saving docker images..."
docker save -o (Join-Path $imagesDir "postgres16.tar") postgres:16
docker save -o (Join-Path $imagesDir "kazmuseum_web_offline.tar") kazmuseum_web:offline

Write-Host "Copying project..."
robocopy . $projDir /MIR /XD .git .venv bundle backups data\postgres images /NFL /NDL /NJH /NJS /NP | Out-Null

Write-Host "Creating archive..."
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $out -Force
Write-Host "Done: $out"
