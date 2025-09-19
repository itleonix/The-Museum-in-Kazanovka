#!/usr/bin/env bash
set -euo pipefail
REQ="${1:-requirements.txt}"
OUTDIR="${2:-vendor/wheels}"
mkdir -p "$OUTDIR"
echo "Скачиваю колёса зависимостей в $OUTDIR ..."
python3 -m pip download -r "$REQ" -d "$OUTDIR" || python -m pip download -r "$REQ" -d "$OUTDIR"
echo "Готово. Проверьте содержимое $OUTDIR"

