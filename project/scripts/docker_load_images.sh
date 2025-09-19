#!/usr/bin/env bash
set -euo pipefail
IMAGES_DIR="${1:-images}"

echo "Загружаю docker-образы из $IMAGES_DIR ..."
docker load -i "$IMAGES_DIR/postgres16.tar"
docker load -i "$IMAGES_DIR/kazmuseum_web_offline.tar"
echo "Готово. Теперь можно поднимать: docker compose -f docker-compose.offline.yml --env-file .env up -d"

