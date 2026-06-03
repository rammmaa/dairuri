# EC2 API Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Darori Node API to EC2 so it can reach private RDS PostgreSQL and private ElastiCache Valkey.

**Architecture:** The Expo app calls a public API base URL. The API runs as a systemd service on EC2 in the same VPC as RDS and ElastiCache, loading server-only secrets from `/home/ec2-user/darori/.env`.

**Tech Stack:** Amazon Linux 2023, Node.js/npm, systemd, PostgreSQL via `pg`, Redis/Valkey via `redis`.

---

### Task 1: Deployment Script

**Files:**
- Create: `scripts/deploy-ec2-api.sh`
- Create: `scripts/check-ec2-api.sh`
- Create: `docs/aws-ec2-deployment.md`

- [ ] **Step 1: Add deploy script**

Create `scripts/deploy-ec2-api.sh` to install runtime packages, rsync the repo, copy `.env`, run `npm ci`, run DB checks/migrations/seed, register the `darori-api` systemd service, and call `/health`.

- [ ] **Step 2: Add smoke script**

Create `scripts/check-ec2-api.sh` to SSH into EC2, run `npm run db:check`, call `http://127.0.0.1:8787/health`, and check `systemctl is-active darori-api`.

- [ ] **Step 3: Add deployment docs**

Create `docs/aws-ec2-deployment.md` with EC2 host, security group requirements, deploy command, smoke command, and HTTPS follow-up.

- [ ] **Step 4: Verify scripts are syntactically valid**

Run:

```bash
bash -n scripts/deploy-ec2-api.sh
bash -n scripts/check-ec2-api.sh
```

Expected: both commands exit with code `0`.

### Task 2: EC2 Runtime Deployment

**Files:**
- Remote: `/home/ec2-user/darori`
- Remote: `/etc/systemd/system/darori-api.service`

- [ ] **Step 1: Deploy to EC2**

Run:

```bash
EC2_HOST=ec2-43-203-114-56.ap-northeast-2.compute.amazonaws.com \
EC2_KEY=/Users/yoons/Documents/darolink.pem \
./scripts/deploy-ec2-api.sh
```

Expected: output contains `postgres: ok`, `redis: ok`, service status, and `{"ok":true}`.

- [ ] **Step 2: Run smoke check**

Run:

```bash
EC2_HOST=ec2-43-203-114-56.ap-northeast-2.compute.amazonaws.com \
EC2_KEY=/Users/yoons/Documents/darolink.pem \
./scripts/check-ec2-api.sh
```

Expected: output contains `postgres: ok`, `redis: ok`, `{"ok":true}`, and `active`.

### Task 3: Local Verification

**Files:**
- Local repo only

- [ ] **Step 1: Typecheck**

Run:

```bash
npm run typecheck -- --pretty false
```

Expected: command exits with code `0`.

- [ ] **Step 2: Test**

Run:

```bash
npm test -- --runInBand
```

Expected: all Jest suites pass.

- [ ] **Step 3: Diff check**

Run:

```bash
git diff --check
```

Expected: command exits with code `0`.
