Офлайн‑развёртывание и перенос

Состав
- backend/ — Django‑проект и приложение
- backend/db.sqlite3 — готовая база данных (используем SQLite офлайн)
- backend/static, backend/media — статика и медиа
- vendor/wheels — директория для локальных «колёс» Python (заполняется заранее)
- .env.offline — пример настроек для офлайн‑режима (SQLite)
- scripts/*.ps1, *.sh — скрипты подготовки/запуска

Быстрая упаковка в один архив (на исходном ПК)
- Требуется установленный Docker.
- Если файла `.env` ещё нет, скопируйте шаблон Postgres:
  - Linux/macOS: `cp .env.postgres.offline .env`
  - Windows (PowerShell): `Copy-Item .env.postgres.offline .env`

- Запустите упаковку (создаст архив проекта, дамп БД и docker‑образы):
  - Linux/macOS: `./scripts/bundle_make.sh`
  - Windows: `scripts\bundle_make.ps1`
    - Если PowerShell блокирует скрипты, используйте ярлык: `scripts\bundle_make.cmd`
    - Либо разово: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bundle_make.ps1`

В результате в папке `bundle/` появится архив `kazmuseum_bundle_YYYYmmdd_HHMMSS.(tar.gz|zip)`.

Быстрое развертывание в один шаг (на другом ПК, офлайн)
- Требуется установленный Docker.
- Запустите развёртывание из архива:
  - Linux/macOS: `./scripts/bundle_deploy.sh bundle/kazmuseum_bundle_*.tar.gz`
  - Windows: `scripts\bundle_deploy.ps1 bundle\kazmuseum_bundle_*.zip`
    - Если PowerShell блокирует скрипты, используйте ярлык: `scripts\bundle_deploy.cmd bundle\kazmuseum_bundle_*.zip`
    - Либо разово: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bundle_deploy.ps1 bundle\kazmuseum_bundle_*.zip`
    - WSL не требуется: скрипт загружает образы Docker напрямую из .tar

Полностью офлайн
- Мы не тянем образы из интернета на целевом ПК: скрипты загружают их из `images/*.tar`.
- В `docker-compose.offline.yml` включено `pull_policy: never` для сервисов `db` и `web`, чтобы compose не пытался что‑то скачивать.

Скрипт загрузит образ(ы), подставит `.env` (если его не было) и поднимет сервисы. Приложение будет доступно на `http://127.0.0.1:9090`.

Альтернативы и ручной запуск без Docker
Вариант A. Windows (PowerShell)
1) Открыть PowerShell в корне проекта и выполнить:
   scripts/offline_setup.ps1
   (создаст виртуальное окружение .venv и установит зависимости из vendor/wheels)

2) Скопировать .env.offline в backend/.env или в корень как .env (любой из вариантов подходит):
   - Если .env кладёте в корень, он уже будет найден settings.py
   - В .env.offline используем SQLite (USE_SQLITE=1), DEBUG=1

3) Запуск сервера разработки:
   scripts/run_offline.ps1
   После запуска сайт доступен на http://127.0.0.1:8000/

Вариант B. Linux/macOS (bash)
1) В терминале из корня проекта:
   ./scripts/offline_setup.sh

2) Скопировать .env.offline в .env в корне:
   cp .env.offline .env

3) Запустить:
   ./scripts/run_offline.sh
   Откройте http://127.0.0.1:8000/

Примечания
- В этих вариантах PostgreSQL не нужен: settings.py переключается на SQLite при USE_SQLITE=1.
- Если потребуется админка: создайте суперпользователя (при необходимости):
  .venv/Scripts/python backend/manage.py createsuperuser   (Windows)
  .venv/bin/python backend/manage.py createsuperuser       (Linux/macOS)

Типичные проблемы
- Нет Python 3.11/3.12 на целевом ПК: установите заранее подходящую версию и перенесите офлайн‑инсталлятор.
- Не те колёса в vendor/wheels: собрать их на машине той же ОС и архитектуры, что и офлайн‑ПК, затем перенести.

Вариант C. PostgreSQL офлайн через Docker (рекомендуемый для продакшен‑подобной среды)

Подготовка на ПК с интернетом:
1) Установите Docker.
2) Соберите образ приложения и сохраните образы для переноса:
   ./scripts/docker_build_web.sh
   ./scripts/docker_save_images.sh  images
   (будут созданы tar‑файлы: images/postgres16.tar и images/kazmuseum_web_offline.tar)
3) Скопируйте весь проект + каталог images/ на офлайн‑ПК. Возьмите офлайн‑установщик Docker Desktop (Windows) или пакеты Docker Engine (Linux).

Развёртывание на офлайн‑ПК:
1) Установите Docker.
2) Загрузите образы:
   ./scripts/docker_load_images.sh images
3) Выберите .env для Postgres:
   cp .env.postgres.offline .env
4) Поднимите сервисы с офлайн‑компоузом (использует готовый образ вместо сборки):
   docker compose -f docker-compose.offline.yml --env-file .env up -d
5) Откройте http://127.0.0.1:9090

Примечания по Docker‑офлайн:
- В docker-compose.offline.yml веб‑сервис использует образ kazmuseum_web:offline, который вы загрузили.
- База данных хранится в data/postgres (том в папке проекта). Скопируйте эту папку, если нужна переносимость данных.
- Статика three.js включена в образ и дублируется в примонтированный каталог при запуске.

Перенос БД между ПК

Способ 1 (рекомендуется): логический дамп/восстановление
- На исходном ПК (контейнеры запущены):
  ./scripts/db_dump.sh
  → получим backups/db.dump (формат pg_dump -Fc).
- На целевом ПК (после запуска postgres через docker-compose.offline.yml):
  ./scripts/db_restore.sh backups/db.dump

Способ 2: перенос каталога тома (осторожно)
- Остановите контейнеры: docker compose -f docker-compose.offline.yml down
- Упакуйте каталог с данными БД: ./scripts/db_pack_volume.sh  → backups/pgdata.tar.gz
- Перенесите архив и распакуйте на целевом ПК: ./scripts/db_unpack_volume.sh backups/pgdata.tar.gz
- Запустите: docker compose -f docker-compose.offline.yml --env-file .env up -d

Заметки:
- При способе 2 версии PostgreSQL должны совпадать (у нас postgres:16). Разные ОС/архитектуры могут вызвать проблемы — используйте способ 1.
- Дамп (способ 1) компактнее и переносимее; он не включает роли вне БД. Роли/пароли задаются через .env для контейнера.
