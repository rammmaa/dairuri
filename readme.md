# 다로리

다로리는 지역 기반 이동/모집 커뮤니티 앱입니다. 지도에서 가까운 라이드, 알바, 버스 관련 모집글을 확인하고, 모집글 작성, 지원, 승인, 채팅, 프로필 관리를 한 흐름으로 연결하는 Expo React Native 프로젝트입니다.

현재 앱은 모바일 앱과 웹 배포를 함께 지원합니다. 웹은 Vercel에서 Expo web export로 배포하고, 로컬에서는 Expo 개발 서버로 실행합니다. 데이터는 기본적으로 mock API로 동작하며, `EXPO_PUBLIC_DARORI_API_BASE_URL`을 설정하면 로컬/원격 Darori API 서버로 전환할 수 있습니다.

## Current Features

- 지도 홈: Naver Maps 기반 지도, 현재 위치 이동, 카테고리 필터, 모집글 바텀시트
- 버스 목격 아카이빙: 지도 홈의 버스 칩에서 현재 시각과 위치를 빠르게 기록하는 패널
- 모집글: 라이드/알바 모집글 작성, 목록 필터링, 상세 화면, 지원 플로우
- 신청 관리: 지원서 검토, 승인/거절 모달
- 채팅: 채팅 목록, 채팅방, 더보기 액션, 신고 플로우
- 프로필: 내 정보, 설정, 내가 쓴 글, 찜한 글
- 백엔드 개발 서버: posts, applications, chat, auth header, rate limit, Naver geocoding API route
- 로컬 인프라: PostgreSQL, Redis Docker Compose 구성

## Tech Stack

- Expo React Native, React Native Web, TypeScript
- Naver Maps: `@mj-studio/react-native-naver-map` and Web Dynamic Map script
- Node/TS API server with PostgreSQL and Redis
- Jest with `@testing-library/react-native`
- Vercel web deployment via `expo export`

## Project Structure

| Path | Role |
| --- | --- |
| `App.tsx` | Authentication gate and root tab/screen orchestration |
| `screens/` | App screens for map, bus, recruitment, chat, profile, post flows |
| `components/` | Shared UI controls, cards, bottom nav, map surfaces |
| `services/` | Mock/live API switch, API client, place search |
| `data/` | Local fixtures and shared filtering/sorting helpers |
| `server/` | Local API server, auth, rate limit, repository, DB scripts |
| `docs/` | Reference spec, implementation plans, architecture notes |

## Local Development

```bash
npm install
npm run web
```

The web app opens through Expo, usually at `http://localhost:8081`.

Run checks:

```bash
npm run typecheck
npm test
```

Run local API and infrastructure:

```bash
docker compose up -d
npm run db:check
npm run db:migrate
npm run db:seed
npm run api:start
```

## Reference

- Frontend screen spec: `docs/reference/darori_codex_spec/DARORI_FRONTEND_CODEX_SPEC.md`
- Current architecture notes: `docs/current-architecture.md`

## Environment

Create `.env` from `.env.example` and fill in the NAVER Cloud Maps values.

- `NAVER_MAP_NCP_KEY_ID`: native Dynamic Map SDK key used by Android/iOS map setup
- `EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID`: public Dynamic Map key fallback for Expo builds
- `EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID`: public Web Dynamic Map key used by the web map surface
- `NAVER_MAP_API_KEY`: server-side key for REST APIs such as Directions and Geocoding
- `EXPO_PUBLIC_DARORI_API_BASE_URL`: mobile app API server base URL; leave empty to use mock services
- `DATABASE_URL`: server-side PostgreSQL connection string, never ship this in the mobile app
- `REDIS_URL`: server-side Redis connection string for volatile/cache data, never ship this in the mobile app

For local DB development, run `docker compose up -d` and then run `npm run db:check` after `DATABASE_URL` and `REDIS_URL` are set.

## Deployment

Vercel builds the web app with:

```bash
npx expo export --platform web --output-dir dist
```

For Naver Maps to render in production, set `EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID` in the Vercel environment and register the production domain in Naver Cloud Platform Maps Application settings.
