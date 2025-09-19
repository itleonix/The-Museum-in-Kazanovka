#!/usr/bin/env bash
set -euo pipefail
# Я восстанавливаю логический дамп в запущенный контейнер Postgres

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.offline.yml}"
ENV_FILE="${ENV_FILE:-.env}"
IN_FILE="${1:-backups/db.dump}"

if [ ! -f "$IN_FILE" ]; then
  echo "Не найден файл дампа: $IN_FILE" >&2
  exit 1
fi

DB_USER=$(grep -E '^DB_USER=' "$ENV_FILE" | sed 's/DB_USER=//')
DB_NAME=$(grep -E '^DB_NAME=' "$ENV_FILE" | sed 's/DB_NAME=//')

echo "Восстанавливаю дамп в БД $DB_NAME ..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db \
  pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists < "$IN_FILE"

echo "Восстановление завершено"

