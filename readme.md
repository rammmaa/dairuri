# 다로리

다로리 프로젝트를 새로 시작합니다.

## Reference

- Frontend screen spec: `docs/reference/darori_codex_spec/DARORI_FRONTEND_CODEX_SPEC.md`

## Environment

Create `.env` from `.env.example` and fill in the NAVER Cloud Maps values.

- `NAVER_MAP_NCP_KEY_ID`: Mobile Dynamic Map SDK key used by Android/iOS map setup
- `NAVER_MAP_API_KEY`: server-side key for REST APIs such as Directions and Geocoding
- `EXPO_PUBLIC_DARORI_API_BASE_URL`: mobile app API server base URL; leave empty to use mock services
- `DATABASE_URL`: server-side PostgreSQL connection string, never ship this in the mobile app
- `REDIS_URL`: server-side Redis connection string for volatile/cache data, never ship this in the mobile app

For local DB development, run `docker compose up -d` and then run `npm run db:check` after `DATABASE_URL` and `REDIS_URL` are set.
