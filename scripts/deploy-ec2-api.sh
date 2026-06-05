#!/usr/bin/env bash
set -euo pipefail

EC2_HOST="${EC2_HOST:?Set EC2_HOST to the EC2 public DNS or IP}"
EC2_USER="${EC2_USER:-ec2-user}"
EC2_KEY="${EC2_KEY:-$HOME/Documents/darolink.pem}"
EC2_APP_DIR="${EC2_APP_DIR:-/home/$EC2_USER/darori}"
EC2_RUNTIME_DIR="${EC2_RUNTIME_DIR:-/home/$EC2_USER/darori_runtime}"
EC2_SERVICE="${EC2_SERVICE:-darori-api}"
EC2_ENV_FILE="${EC2_ENV_FILE:-.env}"
DARORI_API_PORT="${DARORI_API_PORT:-8787}"

SSH_OPTS=(
  -i "$EC2_KEY"
  -o BatchMode=yes
  -o ConnectTimeout=10
  -o StrictHostKeyChecking=accept-new
)
SSH_TARGET="$EC2_USER@$EC2_HOST"
RSYNC_RSH="ssh -i $EC2_KEY -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new"

if [[ ! -f "$EC2_KEY" ]]; then
  echo "EC2 key not found: $EC2_KEY" >&2
  exit 1
fi

if [[ ! -f "$EC2_ENV_FILE" ]]; then
  echo "Environment file not found: $EC2_ENV_FILE" >&2
  exit 1
fi

command -v rsync >/dev/null || {
  echo "rsync is required on the local machine" >&2
  exit 1
}

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "set -euo pipefail
  if command -v dnf >/dev/null; then
    sudo dnf install -y nodejs20 git rsync
    sudo alternatives --set node /usr/bin/node-20 >/dev/null 2>&1 || true
  fi
  if ! swapon --show=NAME | grep -qx '/swapfile'; then
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=128M count=16
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  fi
  mkdir -p '$EC2_APP_DIR'
  mkdir -p '$EC2_RUNTIME_DIR'
  sudo chown -R '$EC2_USER:$EC2_USER' '$EC2_APP_DIR'
  sudo chown -R '$EC2_USER:$EC2_USER' '$EC2_RUNTIME_DIR'
"

rsync -az --delete \
  -e "$RSYNC_RSH" \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude '.expo' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude 'builds' \
  --exclude 'coverage' \
  --exclude 'screenshots' \
  --exclude '*.pem' \
  --exclude '*.apk' \
  ./ "$SSH_TARGET:$EC2_APP_DIR/"

scp "${SSH_OPTS[@]}" "$EC2_ENV_FILE" "$SSH_TARGET:$EC2_APP_DIR/.env"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "chmod 600 '$EC2_APP_DIR/.env'"

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "set -euo pipefail
  sudo systemctl stop '$EC2_SERVICE' >/dev/null 2>&1 || true
  rm -rf '$EC2_RUNTIME_DIR'
  mkdir -p '$EC2_RUNTIME_DIR'
  cd '$EC2_RUNTIME_DIR'
  npm init -y >/dev/null
  npm install --no-audit --no-fund tsx dotenv pg redis
  cd '$EC2_APP_DIR'
  rm -rf node_modules
  ln -s '$EC2_RUNTIME_DIR/node_modules' node_modules
  npm run db:check
  npm run db:migrate
  npm run db:seed
"

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "sudo tee /etc/systemd/system/$EC2_SERVICE.service >/dev/null" <<SERVICE
[Unit]
Description=Darori API
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=$EC2_USER
WorkingDirectory=$EC2_APP_DIR
Environment=NODE_ENV=production
Environment=DARORI_API_PORT=$DARORI_API_PORT
EnvironmentFile=$EC2_APP_DIR/.env
ExecStart=/usr/bin/npm run api:start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "set -euo pipefail
  sudo systemctl daemon-reload
  sudo systemctl enable '$EC2_SERVICE'
  sudo systemctl restart '$EC2_SERVICE'
  for attempt in \$(seq 1 20); do
    if curl -fsS 'http://127.0.0.1:$DARORI_API_PORT/health' >/tmp/darori-health.json; then
      break
    fi
    sleep 1
  done
  sudo systemctl --no-pager --full status '$EC2_SERVICE'
  cat /tmp/darori-health.json
  printf '\n'
"
