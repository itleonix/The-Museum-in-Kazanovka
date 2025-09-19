#!/usr/bin/env bash
set -euo pipefail
# Я распаковываю архив backups/pgdata.tar.gz в каталог data/postgres
# ВНИМАНИЕ: контейнеры должны быть остановлены (docker compose down)

IN_FILE="${1:-backups/pgdata.tar.gz}"
DST_DIR="data/postgres"

if [ ! -f "$IN_FILE" ]; then
  echo "Не найден архив: $IN_FILE" >&2
  exit 1
fi

mkdir -p "$DST_DIR"
tar -xzf "$IN_FILE" -C "$DST_DIR"
echo "Распаковано в $DST_DIR"

