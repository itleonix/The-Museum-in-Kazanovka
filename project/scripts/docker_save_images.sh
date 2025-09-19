#!/usr/bin/env bash
set -euo pipefail
OUTDIR="${1:-images}"
mkdir -p "$OUTDIR"

echo "Сохраняю docker-образы для офлайна..."
docker image inspect kazmuseum_web:offline >/dev/null 2>&1 || {
  echo "Не найден образ kazmuseum_web:offline. Сначала выполните scripts/docker_build_web.sh" >&2
  exit 1
}

# Если postgres:16 нет локально — пробую подтянуть (на онлайн‑ПК). Если не выйдет —
# подскажем собрать/загрузить позже вручную, но бандл можно сделать только с web‑образом.
if ! docker image inspect postgres:16 >/dev/null 2>&1; then
  echo "Образ postgres:16 не найден локально. Пробую docker pull ..."
  docker pull postgres:16 || echo "Предупреждение: не удалось docker pull postgres:16. Убедитесь, что добавите этот образ на целевом ПК через images/postgres16.tar"
fi

docker save -o "$OUTDIR/postgres16.tar" postgres:16
docker save -o "$OUTDIR/kazmuseum_web_offline.tar" kazmuseum_web:offline
echo "Готово. Скопируйте каталог $OUTDIR на офлайн-ПК."
