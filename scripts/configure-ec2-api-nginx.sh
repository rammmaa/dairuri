#!/usr/bin/env bash
set -euo pipefail

EC2_HOST="${EC2_HOST:?Set EC2_HOST to the EC2 public DNS or IP}"
EC2_USER="${EC2_USER:-ec2-user}"
EC2_KEY="${EC2_KEY:-$HOME/Documents/darolink.pem}"
API_DOMAIN="${API_DOMAIN:-api.dairuri.harammm.me}"
DARORI_API_PORT="${DARORI_API_PORT:-8787}"
ENABLE_TLS="${ENABLE_TLS:-false}"

SSH_OPTS=(
  -i "$EC2_KEY"
  -o BatchMode=yes
  -o ConnectTimeout=10
  -o StrictHostKeyChecking=accept-new
)

ssh "${SSH_OPTS[@]}" "$EC2_USER@$EC2_HOST" "sudo tee /tmp/darori-api-nginx.conf >/dev/null" <<NGINX
server {
  listen 80;
  server_name $API_DOMAIN;

  location / {
    proxy_pass http://127.0.0.1:$DARORI_API_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
NGINX

ssh "${SSH_OPTS[@]}" "$EC2_USER@$EC2_HOST" "set -euo pipefail
  if command -v dnf >/dev/null; then
    sudo dnf install -y nginx
  fi
  sudo mv /tmp/darori-api-nginx.conf /etc/nginx/conf.d/darori-api.conf
  sudo nginx -t
  sudo systemctl enable nginx
  sudo systemctl restart nginx
  curl -fsS -H 'Host: $API_DOMAIN' 'http://127.0.0.1/health'
  printf '\n'
"

if [[ "$ENABLE_TLS" == "true" ]]; then
  ssh "${SSH_OPTS[@]}" "$EC2_USER@$EC2_HOST" "set -euo pipefail
    if command -v dnf >/dev/null; then
      sudo dnf install -y certbot python3-certbot-nginx
    fi
    sudo certbot --nginx -d '$API_DOMAIN' --non-interactive --agree-tos --register-unsafely-without-email --redirect
    sudo systemctl enable --now certbot-renew.timer
    sudo nginx -t
    sudo systemctl reload nginx
    curl -fsS 'https://$API_DOMAIN/health'
    printf '\n'
  "
fi
