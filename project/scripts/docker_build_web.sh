#!/usr/bin/env bash
set -euo pipefail

# Строю офлайн-образ приложения и тегирую как kazmuseum_web:offline
docker build -t kazmuseum_web:offline .
echo "Собран образ kazmuseum_web:offline"

