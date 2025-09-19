#!/usr/bin/env bash
set -euo pipefail
# Я упаковываю каталог data/postgres (содержимое тома БД) в архив backups/pgdata.tar.gz
# ВНИМАНИЕ: перед упаковкой контейнеры должны быть остановлены (docker compose down)

OUT_DIR="backups"
SRC_DIR="data/postgres"
ARCHIVE="$OUT_DIR/pgdata.tar.gz"

mkdir -p "$OUT_DIR"

if [ -d "$SRC_DIR" ]; then
  tar -czf "$ARCHIVE" -C "$SRC_DIR" .
  echo "Готово: $ARCHIVE"
else
  echo "Каталог $SRC_DIR не найден" >&2
  exit 1
fi

