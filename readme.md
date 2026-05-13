# 다로리

다로리는 농촌의 부족한 교통, 일자리, 생활 정보 인프라를 지역 주민 연결로 보완하는 동네 기반 생활 인프라 플랫폼입니다.

## 구조

- `apps/api`: NestJS API
- `apps/mobile`: Expo React Native 앱
- `packages/shared`: API와 모바일이 함께 쓰는 TypeScript 계약
- `docs`: 서비스 플랜과 구현 계획

## 실행

```bash
npm install
npm run typecheck
npm test
npm run build
```

API 개발 서버:

```bash
npm run api
```

모바일 앱:

```bash
npm run mobile
```

## 환경 변수

API 환경 변수 예시는 `apps/api/.env.example`에 있습니다.

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dairuri
REDIS_URL=redis://localhost:6379
PORT=3000
RUN_DB_MIGRATIONS=false
```

## 배포

Vercel은 루트에서 `npm run build`를 실행하고 `apps/mobile/dist`를 정적 출력 디렉터리로 사용합니다.

## 문서

- [서비스 플랜](docs/dairuri-service-plan.md)
- [MVP 구현 계획](docs/superpowers/plans/2026-05-13-dairuri-mvp.md)
- [데모 플로우](docs/demo-flow.md)
