#!/usr/bin/env bash
set -euo pipefail
# Я разворачиваю бандл в один шаг: загружаю образы, ставлю .env и поднимаю compose

BUNDLE_TAR="${1:-}"
if [ -z "$BUNDLE_TAR" ]; then
  echo "Использование: $0 path/to/kazmuseum_bundle_YYYYmmdd_HHMMSS.tar.gz" >&2
  exit 1
fi

TS=$(date +%Y%m%d_%H%M%S)
TARGET_DIR="deploy-$TS"
mkdir -p "$TARGET_DIR"
tar -xzf "$BUNDLE_TAR" -C "$TARGET_DIR"
cd "$TARGET_DIR"

# структура бандла: images/, backups/, project/
if [ -d images ]; then
  ./project/scripts/docker_load_images.sh images
fi

cd project
if [ ! -f .env ]; then
  cp .env.postgres.offline .env || true
fi

docker compose -f docker-compose.offline.yml --env-file .env up -d
echo "Запущено. Откройте http://127.0.0.1:9090"

