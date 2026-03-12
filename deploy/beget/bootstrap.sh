#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/streamfly/app"
REPO_URL="${REPO_URL:-https://github.com/tuuupik321/streaminfo1.git}"
BRANCH="${BRANCH:-main}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env.production}"
NGINX_SITE="/etc/nginx/sites-available/streamfly"
SERVICE_FILE="/etc/systemd/system/streamfly-bot.service"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

require_root() {
  if [ "${EUID:-$(id -u)}" -ne 0 ]; then
    echo "Run this script as root."
    exit 1
  fi
}

install_packages() {
  log "Installing system packages"
  export DEBIAN_FRONTEND=noninteractive
  apt update
  apt install -y git nginx python3 python3-venv python3-pip nodejs npm curl
}

ensure_swap() {
  if swapon --show --noheadings | grep -q .; then
    log "Swap already configured"
    return
  fi

  log "Creating 2G swap file"
  if command -v fallocate >/dev/null 2>&1; then
    fallocate -l 2G /swapfile || true
  fi
  if [ ! -f /swapfile ] || [ ! -s /swapfile ]; then
    dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
  fi
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
}

sync_repo() {
  log "Syncing repository"
  mkdir -p /opt/streamfly
  if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" fetch origin "$BRANCH"
    git -C "$APP_DIR" checkout "$BRANCH"
    git -C "$APP_DIR" reset --hard "origin/$BRANCH"
  else
    rm -rf "$APP_DIR"
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi
}

build_app() {
  log "Building frontend"
  cd "$APP_DIR"
  npm ci
  NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}" npm run build

  log "Installing Python dependencies"
  python3 -m venv .venv
  . .venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt
}

ensure_env_file() {
  if [ -f "$ENV_FILE" ]; then
    log "Using existing env file: $ENV_FILE"
    return
  fi

  log "Creating env template at $ENV_FILE"
  cat > "$ENV_FILE" <<'EOF'
PORT=7860
APP_URL=http://SERVER_IP
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
EOF

  echo
  echo "Env template created. Edit it and rerun the script:"
  echo "nano $ENV_FILE"
  exit 0
}

write_nginx_config() {
  local server_name="_"
  if grep -q '^APP_URL=' "$ENV_FILE"; then
    local app_url host
    app_url="$(grep '^APP_URL=' "$ENV_FILE" | tail -n 1 | cut -d= -f2-)"
    host="$(printf '%s' "$app_url" | sed -E 's#^[a-z]+://##; s#/.*$##')"
    if [ -n "$host" ] && [ "$host" != "SERVER_IP" ]; then
      server_name="$host"
    fi
  fi

  log "Writing nginx config for server_name=$server_name"
  cat > "$NGINX_SITE" <<EOF
server {
    listen 80;
    server_name $server_name;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:7860;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

  ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/streamfly
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
}

install_service() {
  log "Installing systemd service"
  cp "$APP_DIR/deploy/beget/streamfly-bot.service" "$SERVICE_FILE"
  systemctl daemon-reload
  systemctl enable streamfly-bot
  systemctl restart streamfly-bot
}

show_status() {
  log "Service status"
  systemctl --no-pager --full status streamfly-bot || true
  echo
  log "Healthcheck"
  curl -I --max-time 10 http://127.0.0.1:7860/healthz || true
}

main() {
  require_root
  install_packages
  ensure_swap
  sync_repo
  build_app
  ensure_env_file
  install_service
  write_nginx_config
  show_status
}

main "$@"
