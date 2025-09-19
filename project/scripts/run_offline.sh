#!/usr/bin/env bash
set -euo pipefail

if [ ! -x .venv/bin/python ]; then
  echo "Не найдено .venv. Запустите ./scripts/offline_setup.sh" >&2
  exit 1
fi

export DJANGO_SETTINGS_MODULE=config.settings
exec .venv/bin/python backend/manage.py runserver 0.0.0.0:8000

