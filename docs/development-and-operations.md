# Development And Operations

이 문서는 Darori 앱을 로컬에서 실행하고, API/DB 인프라를 확인하고, 배포 흐름을 점검하는 절차만 모아 둔다. 제품 소개, 기능, 아키텍처 개요는 `readme.md`를 기준으로 본다.

## Local App

의존성을 설치하고 Expo 개발 서버를 실행한다.

```bash
npm install
npm run web
```

웹 앱은 일반적으로 `http://localhost:8081`에서 열린다.

## Local API And Infra

로컬 API는 PostgreSQL과 Redis 호환 캐시가 필요하다. Docker Compose는 PostgreSQL을 `54320`, Redis를 `63790` 포트로 연다.

```bash
docker compose up -d
npm run db:check
npm run db:migrate
npm run db:seed
npm run api:start
```

로컬 앱에서 API를 붙일 때는 `.env`에 다음 값을 둔다.

```bash
EXPO_PUBLIC_DARORI_API_BASE_URL=http://localhost:8787
```

프로덕션 웹과 APK는 EC2 API 도메인을 사용한다.

```bash
EXPO_PUBLIC_DARORI_API_BASE_URL=https://api.dairuri.harammm.me
```

## Verification

기본 검증 명령은 다음과 같다.

```bash
npm run typecheck
npm test
```

API와 데이터 저장소 연결만 확인할 때는 다음 명령을 사용한다.

```bash
npm run db:check
```

## Environment Variables

`.env.example`을 복사해 `.env`를 만들고 필요한 값을 채운다.

| Variable | Description |
| --- | --- |
| `NAVER_MAP_NCP_KEY_ID` | Android/iOS 네이티브 Dynamic Map SDK key |
| `EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID` | Expo build에서 사용하는 public Dynamic Map key fallback |
| `EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID` | 웹 지도 표면에서 사용하는 public Web Dynamic Map key |
| `NAVER_MAP_API_KEY` | Directions, Geocoding 같은 서버 사이드 REST API key |
| `SOLAPI_API_KEY` | 전화번호 인증 SMS 발송용 SOLAPI API key |
| `SOLAPI_API_SECRET` | SOLAPI HMAC-SHA256 서명용 API secret |
| `SOLAPI_FROM` | SOLAPI에 등록된 발신번호 |
| `PHONE_VERIFICATION_HASH_SECRET` | 전화번호 인증 코드/토큰 해시 salt |
| `EXPO_PUBLIC_DARORI_API_BASE_URL` | 앱 API 서버 base URL. 로컬은 `http://localhost:8787`, 프로덕션 웹/APK는 `https://api.dairuri.harammm.me` |
| `EXPO_PUBLIC_DARORI_USER_ID` | 개발용 write user header |
| `EXPO_PUBLIC_DARORI_USE_MOCK_API` | 테스트/로컬 전용 mock opt-in. 프로덕션에서는 unset |
| `DATABASE_URL` | 서버 사이드 PostgreSQL connection string |
| `REDIS_URL` | 서버 사이드 Redis 프로토콜 connection string. 프로덕션은 Amazon ElastiCache Valkey, 로컬은 Redis container |
| `NAVER_SEARCH_CLIENT_ID` | 서버 사이드 네이버 검색 API 지역 검색 Client ID. 장소명/상호 검색 정확도 개선용 |
| `NAVER_SEARCH_CLIENT_SECRET` | 서버 사이드 네이버 검색 API 지역 검색 Client Secret |

`DATABASE_URL`, `REDIS_URL`, `NAVER_MAP_API_KEY`, `NAVER_SEARCH_CLIENT_*`, `SOLAPI_*`, `PHONE_VERIFICATION_HASH_SECRET`는 모바일 앱 번들에 포함되면 안 되는 서버 전용 값이다.

## Web Deployment

Vercel은 웹 앱을 다음 방식으로 빌드해 정적 번들을 서빙한다.

```bash
npx expo export --platform web --output-dir dist
```

현재 프로덕션 앱/API 플로우는 `https://api.dairuri.harammm.me`의 EC2 Node API 서버를 기준으로 한다. `api/index.ts`와 `api/[...path].ts`는 동일한 handler를 Vercel Function으로도 실행할 수 있게 남겨 둔 호환 경로다.

프로덕션에서 Naver Maps가 정상 렌더링되려면 Vercel 환경변수에 `EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID`를 설정하고, Naver Cloud Platform Maps Application 설정에 실제 배포 도메인을 Web 서비스 URL로 등록해야 한다.

## EC2 API Operations

EC2 배포와 점검은 별도 runbook을 기준으로 한다.

- Deployment runbook: `docs/aws-ec2-deployment.md`
- Smoke check script: `scripts/check-ec2-api.sh`
- Deploy script: `scripts/deploy-ec2-api.sh`

대표 smoke check:

```bash
EC2_HOST=ec2-16-184-41-188.ap-northeast-2.compute.amazonaws.com \
EC2_KEY=/Users/yoons/Documents/darolink.pem \
./scripts/check-ec2-api.sh
```

API health check:

```bash
curl -fsS https://api.dairuri.harammm.me/health
```
