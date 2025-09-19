#!/usr/bin/env bash
set -euo pipefail
# Я упаковываю проект вместе с БД и docker-образами в один архив

TS=$(date +%Y%m%d_%H%M%S)
BUNDLE_DIR="bundle/stage-$TS"
OUT_TAR="bundle/kazmuseum_bundle_${TS}.tar.gz"
mkdir -p "$BUNDLE_DIR" "$BUNDLE_DIR/images" "$BUNDLE_DIR/backups"

# 1) убеждаюсь, что есть .env и поднимаю БД для дампа
if [ ! -f .env ]; then
  echo "Не найден .env. Скопируйте .env.postgres.offline в .env" >&2
  exit 1
fi
echo "Поднимаю db для дампа..."
docker compose -f docker-compose.offline.yml --env-file .env up -d db
sleep 2

# 2) делаю дамп БД
./scripts/db_dump.sh || true
if [ -f backups/db.dump ]; then
  cp backups/db.dump "$BUNDLE_DIR/backups/db.dump"
else
  echo "Внимание: backups/db.dump не создан. Продолжаю без дампа." >&2
fi

# 3) собираю web-образ и сохраняю образы
./scripts/docker_build_web.sh
./scripts/docker_save_images.sh "$BUNDLE_DIR/images"

# 4) копирую проект (кроме временных и больших каталогов)
mkdir -p "$BUNDLE_DIR/project"
tar cf - \
  --exclude './bundle' \
  --exclude './backups' \
  --exclude './.venv' \
  --exclude './data/postgres/*' \
  . | (cd "$BUNDLE_DIR/project" && tar xf -)

# 5) создаю финальный архив
mkdir -p bundle
tar -czf "$OUT_TAR" -C "$BUNDLE_DIR" .
echo "Готово: $OUT_TAR"

