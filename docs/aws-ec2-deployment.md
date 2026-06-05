# AWS EC2 API Deployment

This project runs the mobile/web client separately from the Node API. For AWS
production, run the API on EC2 inside the same VPC as RDS and ElastiCache. Both
web and APK builds call that API directly through
`EXPO_PUBLIC_DARORI_API_BASE_URL=https://api.dairuri.harammm.me`.

## Current Target

- EC2 host: `ec2-43-203-114-56.ap-northeast-2.compute.amazonaws.com`
- EC2 user: `ec2-user`
- App directory: `/home/ec2-user/darori`
- API port: `8787`
- Service name: `darori-api`

## Required AWS Networking

- EC2 security group inbound:
  - SSH `22` from the operator IP only
  - API `8787` from the client network, or HTTP/HTTPS only if nginx is used
- EC2 security group outbound:
  - PostgreSQL `5432` to the RDS security group
  - Redis/Valkey `6379` to the ElastiCache security group
  - HTTPS `443` for package install and SSM
- RDS security group inbound:
  - PostgreSQL `5432` from the EC2 security group
- ElastiCache security group inbound:
  - TCP `6379` from the EC2 security group

## Local Files

Create `.env` locally and keep it out of git. The deploy script copies it to
`/home/ec2-user/darori/.env` with mode `600`.

Required server-side values:

```bash
DATABASE_URL=postgresql://...
DATABASE_SSL=true
REDIS_URL=rediss://...
NAVER_MAP_API_KEY=...
DARORI_API_PORT=8787
```

Client builds should use the public API base URL:

```bash
EXPO_PUBLIC_DARORI_API_BASE_URL=https://api.dairuri.harammm.me
```

The APK must never contain `DATABASE_URL` or `REDIS_URL`. It connects directly to
the EC2 API domain above; the EC2 API connects to private RDS/Valkey.

## Deploy

```bash
chmod 400 /Users/yoons/Documents/darolink.pem
EC2_HOST=ec2-43-203-114-56.ap-northeast-2.compute.amazonaws.com \
EC2_KEY=/Users/yoons/Documents/darolink.pem \
./scripts/deploy-ec2-api.sh
```

The script installs Node.js 20 and runtime packages on Amazon Linux, ensures a
2GiB swap file for small instances such as `t3.nano`, syncs the working tree,
copies `.env`, runs:

```bash
npm ci
npm run db:check
npm run db:migrate
npm run db:seed
```

Then it creates and restarts the `darori-api` systemd service.

## Smoke Check

```bash
EC2_HOST=ec2-43-203-114-56.ap-northeast-2.compute.amazonaws.com \
EC2_KEY=/Users/yoons/Documents/darolink.pem \
./scripts/check-ec2-api.sh
```

Expected output includes:

```text
postgres: ok
redis: ok
{"ok":true}
active
```

## API Domain

APK and web production builds call the EC2 API directly through:

```text
https://api.dairuri.harammm.me
```

The domain currently uses Porkbun nameservers. Create or update this DNS record
in Porkbun DNS:

```text
api.dairuri.harammm.me  A  43.203.114.56
```

Then open EC2 inbound:

```text
HTTP  80   0.0.0.0/0
HTTPS 443  0.0.0.0/0
```

Configure nginx on EC2:

```bash
EC2_HOST=ec2-43-203-114-56.ap-northeast-2.compute.amazonaws.com \
EC2_KEY=/Users/yoons/Documents/darolink.pem \
API_DOMAIN=api.dairuri.harammm.me \
ENABLE_TLS=true \
./scripts/configure-ec2-api-nginx.sh
```

The script uses certbot/nginx for TLS when `ENABLE_TLS=true` and enables the
`certbot-renew.timer` systemd timer.

After DNS, EC2 security groups, nginx, and TLS are configured:

```bash
curl -fsS https://api.dairuri.harammm.me/health
curl -fsS https://api.dairuri.harammm.me/posts
```

The first command should print `{"ok":true}` and the second should return the
PostgreSQL-backed post list.

## Operations

```bash
ssh -i /Users/yoons/Documents/darolink.pem ec2-user@ec2-43-203-114-56.ap-northeast-2.compute.amazonaws.com
sudo systemctl status darori-api
sudo journalctl -u darori-api -f
sudo systemctl restart darori-api
```

## HTTPS Follow-Up

The API is only production-ready for real users after it is exposed through
HTTPS. Add a domain, point it to the EC2 public IP, run nginx as a reverse
proxy to `127.0.0.1:8787`, and issue a certificate with certbot or AWS-managed
TLS behind an Application Load Balancer.
