#!/usr/bin/env bash
set -euo pipefail
VENV="${1:-.venv}"
WHEELS="${2:-vendor/wheels}"
REQ="${3:-requirements.txt}"

echo "Создаю venv в $VENV ..."
python3 -m venv "$VENV" || python -m venv "$VENV"

echo "Обновляю pip ..."
"$VENV/bin/python" -m pip install --upgrade pip

echo "Ставлю зависимости из $WHEELS ..."
"$VENV/bin/python" -m pip install --no-index --find-links "$WHEELS" -r "$REQ"

echo "Готово. Запускайте ./scripts/run_offline.sh"

