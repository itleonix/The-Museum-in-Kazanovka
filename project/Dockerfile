##########
# Stage 1: fetch frontend deps (three.js)
##########
FROM node:20-alpine AS threebuilder
WORKDIR /deps
RUN npm init -y \
 && npm install three@latest --no-audit --no-fund --loglevel=error

##########
# Stage 2: Python app
##########
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Копируем всё (compose примонтирует backend поверх /app/backend)
COPY . /app/

# Добавляем three.js в статику Django (ядро + examples)
RUN mkdir -p /app/backend/static/vendor/three && \
    mkdir -p /app/backend/static/vendor/three/examples/jsm
# Копируем весь build каталога three (three.module.js + зависимые файлы, например three.core.js)
COPY --from=threebuilder /deps/node_modules/three/build/ /app/backend/static/vendor/three/
COPY --from=threebuilder /deps/node_modules/three/examples/jsm/ /app/backend/static/vendor/three/examples/jsm/

# Дублируем во внешнее место, чтобы можно было скопировать внутрь тома при рантайме
RUN mkdir -p /opt/vendor/three && \
    mkdir -p /opt/vendor/three/examples/jsm
# Дублируем весь build для копирования в примонтированный volume
COPY --from=threebuilder /deps/node_modules/three/build/ /opt/vendor/three/
COPY --from=threebuilder /deps/node_modules/three/examples/jsm/ /opt/vendor/three/examples/jsm/

EXPOSE 8000

# ВАЖНО: без миграций (их сделаем позже)
CMD ["bash", "-lc", "python manage.py runserver 0.0.0.0:8000"]
