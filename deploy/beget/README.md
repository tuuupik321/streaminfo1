# Beget VPS deployment

Этот проект нужно разворачивать на Beget Cloud/VPS, а не на обычном веб-хостинге.

Рекомендуемая конфигурация:

- Ubuntu 24.04
- 2 vCPU
- 2 GB RAM
- 30 GB NVMe
- публичный IPv4

Ниже порядок действий.

## 1. Подготовить VPS

В панели Beget:

1. Открой `Облако -> Виртуальные серверы`.
2. Создай сервер с Ubuntu 24.04.
3. Запомни IP сервера.
4. Если есть домен, сразу направь A-запись на IP сервера.

## 2. Подключиться к серверу

Локально:

```bash
ssh root@SERVER_IP
```

## 3. Установить системные пакеты

На сервере:

```bash
apt update
apt install -y git nginx python3 python3-venv python3-pip nodejs npm certbot python3-certbot-nginx
```

Проверить версии:

```bash
node -v
npm -v
python3 --version
```

## 4. Развернуть код

```bash
mkdir -p /opt/streamfly
cd /opt/streamfly
git clone https://github.com/tuuupik321/streaminfo1.git app
cd app
```

Если репозиторий приватный, клонируй через SSH или токен.

## 5. Создать env-файл

Создай файл:

```bash
nano /opt/streamfly/app/.env.production
```

Заполни его рабочими переменными окружения.

Минимально нужны:

```env
PORT=7860
DATABASE_URL=
BOT_TOKEN=
TWITCH_CLIENT_ID=
TWITCH_SECRET=
YOUTUBE_API_KEY=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
DONATALERTS_CLIENT_ID=
DONATALERTS_CLIENT_SECRET=
DONATALERTS_ACCESS_TOKEN=
DONATALERTS_API_BASE=https://www.donationalerts.com/api/v1
DONATIONS_WEBHOOK_SECRET=
OWNER_TELEGRAM_ID=
OWNER_ADMIN_PASSWORD=
LOCAL_DEV_MODE=false
WEBHOOK_ENABLED=true
WEBHOOK_PATH=/telegram/webhook
REQUIRE_INIT_DATA=true
SELF_PING_ENABLED=false
APP_URL=https://YOUR_DOMAIN
```

Если домена пока нет, временно:

```env
APP_URL=http://SERVER_IP
```

Но для OAuth и webhook нужен нормальный HTTPS-домен.

## 6. Собрать фронтенд и backend

```bash
cd /opt/streamfly/app
npm ci
npm run build
python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Проверка:

```bash
. .venv/bin/activate
python bot.py
```

После проверки останови процесс `Ctrl+C`.

## 7. Настроить systemd

Скопируй шаблон сервиса:

```bash
cp /opt/streamfly/app/deploy/beget/streamfly-bot.service /etc/systemd/system/streamfly-bot.service
```

Если путь отличается, поправь его в unit-файле.

Дальше:

```bash
systemctl daemon-reload
systemctl enable streamfly-bot
systemctl restart streamfly-bot
systemctl status streamfly-bot
```

Логи:

```bash
journalctl -u streamfly-bot -f
```

## 8. Настроить nginx

Скопируй конфиг:

```bash
cp /opt/streamfly/app/deploy/beget/nginx-streamfly.conf /etc/nginx/sites-available/streamfly
ln -sf /etc/nginx/sites-available/streamfly /etc/nginx/sites-enabled/streamfly
rm -f /etc/nginx/sites-enabled/default
```

Открой файл и замени:

- `YOUR_DOMAIN`
- при необходимости `127.0.0.1:7860`

Проверка и перезапуск:

```bash
nginx -t
systemctl restart nginx
```

## 9. Выпустить HTTPS

Если домен уже смотрит на сервер:

```bash
certbot --nginx -d YOUR_DOMAIN
```

После этого в `.env.production` должно быть:

```env
APP_URL=https://YOUR_DOMAIN
```

И затем:

```bash
systemctl restart streamfly-bot
```

## 10. Обновить OAuth redirect URLs

После перехода на новый домен нужно обновить callback URL во внешних сервисах.

### Twitch

```text
https://YOUR_DOMAIN/api/oauth/twitch/callback
```

### Google / YouTube

`Authorized JavaScript origins`:

```text
https://YOUR_DOMAIN
```

`Authorized redirect URI`:

```text
https://YOUR_DOMAIN/api/oauth/youtube/callback
```

### DonationAlerts

```text
https://YOUR_DOMAIN/api/oauth/donatealerts/callback
```

## 11. Обновить Telegram Mini App URL

Через `@BotFather`:

- `Edit menu button URL`
- поставить:

```text
https://YOUR_DOMAIN/
```

## 12. Проверка

Проверить:

```bash
curl -I https://YOUR_DOMAIN/healthz
```

Должен быть `200 OK`.

Дальше проверить в приложении:

- подключение Twitch
- подключение DonationAlerts
- подключение VK Live
- открытие главных экранов

## Команды для обновления после новых коммитов

```bash
cd /opt/streamfly/app
git pull
npm ci
npm run build
. .venv/bin/activate
pip install -r requirements.txt
systemctl restart streamfly-bot
```
