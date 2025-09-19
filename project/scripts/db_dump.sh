#!/usr/bin/env bash
set -euo pipefail
# Я создаю логический дамп БД Postgres из docker-контейнера в файл backups/db.dump (формат custom)

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.offline.yml}"
ENV_FILE="${ENV_FILE:-.env}"
OUT_DIR="backups"
OUT_FILE="$OUT_DIR/db.dump"

mkdir -p "$OUT_DIR"

DB_USER=$(grep -E '^DB_USER=' "$ENV_FILE" | sed 's/DB_USER=//')
DB_NAME=$(grep -E '^DB_NAME=' "$ENV_FILE" | sed 's/DB_NAME=//')

echo "Waiting for Postgres to become ready ..."
# Жду готовности Postgres (до 60 сек.)
for i in {1..60}; do
  if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Creating DB dump of $DB_NAME ..."
set +e
# Пытаюсь дампить указанным пользователем
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db \
  pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc > "$OUT_FILE"
rc=$?
if [ $rc -ne 0 ]; then
  echo "Fallback to postgres superuser for dump ..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db \
    pg_dump -U postgres -d "$DB_NAME" -Fc > "$OUT_FILE"
  rc=$?
fi
set -e

if [ $rc -ne 0 ]; then
  echo "DB dump failed" >&2
  exit $rc
fi

echo "Dump saved: $OUT_FILE"
