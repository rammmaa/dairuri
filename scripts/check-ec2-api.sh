#!/usr/bin/env bash
set -euo pipefail

EC2_HOST="${EC2_HOST:?Set EC2_HOST to the EC2 public DNS or IP}"
EC2_USER="${EC2_USER:-ec2-user}"
EC2_KEY="${EC2_KEY:-$HOME/Downloads/darolink.pem}"
EC2_APP_DIR="${EC2_APP_DIR:-/home/$EC2_USER/darori}"
EC2_SERVICE="${EC2_SERVICE:-darori-api}"
DARORI_API_PORT="${DARORI_API_PORT:-8787}"

SSH_OPTS=(
  -i "$EC2_KEY"
  -o BatchMode=yes
  -o ConnectTimeout=10
  -o StrictHostKeyChecking=accept-new
)

ssh "${SSH_OPTS[@]}" "$EC2_USER@$EC2_HOST" "set -euo pipefail
  cd '$EC2_APP_DIR'
  npm run db:check
  curl -fsS 'http://127.0.0.1:$DARORI_API_PORT/health'
  printf '\n'
  sudo systemctl is-active '$EC2_SERVICE'
"

