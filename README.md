# Музей Казановки — Django/Three.js

Этот репозиторий содержит бэкенд (Django 5) и фронтенд-часть (three.js) для проекта «Музей Казановки». Проект по умолчанию использует PostgreSQL через Docker Compose; для локальной оффлайн-разработки доступен вариант с SQLite.

## Быстрый старт (Docker + PostgreSQL)

1) Перейдите в каталог `project/`.
2) Создайте файл `.env` на основе примера:

```bash
cd project
cp .env.example .env
```

3) Запустите контейнеры:

```bash
docker compose up -d
```

4) Откройте приложение: `http://127.0.0.1:9090`

Альтернатива (офлайн, без pull образов):

```bash
docker compose -f docker-compose.offline.yml --env-file .env up -d
```

## Локальный запуск (оффлайн, SQLite)

Для Windows PowerShell:

```powershell
cd project
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\offline_setup.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run_offline.ps1
```

Откройте: `http://127.0.0.1:8000`

## Переменные окружения

Создайте `project/.env` из `project/.env.example` и задайте значения:

- `DJANGO_DEBUG` — `0` или `1` (дев режим)
- `DJANGO_SECRET_KEY` — секретный ключ Django
- `DJANGO_ALLOWED_HOSTS` — список хостов (`*` для разработки)
- `USE_SQLITE` — `0` (Postgres) или `1` (SQLite)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` — параметры PostgreSQL
- `TZ` — часовой пояс (напр. `Europe/Moscow`)

Примечание: файлы `.env`, дампы БД, директории данных PostgreSQL и большие медиа исключены из Git через `.gitignore`.

## Структура

- `project/backend` — Django-проект (`config`) и приложение `core`
- `project/backend/templates` — шаблоны (включая 3D viewer/demo)
- `project/backend/static` — статика (JS/CSS) и `vendor/three`
- `project/backend/media` — пользовательский контент (не коммитится)
- `project/docker-compose*.yml`, `project/Dockerfile` — контейнеризация
- `project/scripts` — скрипты оффлайн/бандл/бэкапы

## Подготовка к публикации / безопасные данные

- Не коммитьте `.env` и другие секреты. Используйте `project/.env.example`.
- Большие и приватные директории (`project/backend/media`, `project/data/postgres`, `project/backups`, корневой `images/`) исключены из Git.
- Если в истории уже есть секреты, перегенерируйте ключи и перепишите историю (например, `git filter-repo`).

## Публикация на GitHub (шпаргалка)

```bash
git init
git add .
git commit -m "Initial import"
git branch -M main
git remote add origin https://github.com/<you>/kazmuseum.git
git push -u origin main
```

## Лицензия

Добавьте файл LICENSE, соответствующий вашим требованиям (MIT/Proprietary и т.д.).

