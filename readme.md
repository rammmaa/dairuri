📌 Overview

테크포임팩트 프로젝트

지역 기반 이동/인력 연결 커뮤니티 앱입니다. 지도에서 가까운 라이드, 인적 자원, 버스 관련 글을 확인하고, 이동 모집, 가능 업무 등록, 연락, 채팅, 프로필 관리를 한 흐름으로 연결합니다. Expo React Native 기반으로 모바일 앱과 웹 배포를 함께 지원하며, 웹은 Vercel에서 Expo web export 방식으로 배포합니다.

앱은 `EXPO_PUBLIC_DARORI_API_BASE_URL`을 통해 Darori API 서버를 호출합니다. 프로덕션에서는 mock API로 자동 fallback하지 않으며, mock은 테스트 또는 명시적인 로컬 opt-in에서만 사용합니다.

🎯 Goal

이 프로젝트는 지역 안에서 흩어져 있는 이동, 인적 자원, 버스 관련 정보를 지도 중심으로 모아 사용자가 지금 필요한 이동과 지역 네트워크 연결을 빠르게 찾도록 돕는 것을 목표로 합니다.

사용자는 주변 위치를 기준으로 라이드와 인적 자원 글을 탐색하고, 신규 정착민은 가능한 업무, 시간대, 희망 조건을 등록해 지역 주민과 사장님들에게 스스로를 알릴 수 있습니다. 버스 정보는 지도 위 경로와 함께 확인하고, 최근 버스 목격 시각과 위치를 빠르게 기록해 이후 이용자가 참고할 수 있는 형태로 확장하는 방향을 둡니다.

⚙️ 주요 기능 (Key Features)

- 지도 홈: Naver Maps 기반 지도, 현재 위치 이동, 카테고리 필터, 모집글 바텀시트
- 인적 자원 맵: 구직자가 가능한 업무, 시간대, 관심 분야를 등록하고 지역 네트워크에 노출
- 글 탐색: 라이드, 인적 자원, 버스 관련 글 목록 및 상세 화면
- 모집글 작성: 출발/도착 장소, 날짜, 시간, 모집 인원, 상세 설명 입력
- 지원 및 승인: 모집글 지원, 지원서 검토, 승인/거절 플로우
- 채팅: 채팅 목록, 채팅방, 더보기 액션, 신고 플로우
- 프로필: 내 정보, 설정, 내가 쓴 글, 찜한 글 확인
- 버스 목격 아카이빙: 지도 홈의 버스 칩에서 현재 시각과 위치를 즉시 저장하는 패널
- 로컬 API 서버: posts, applications, chat, auth header, rate limit, Naver geocoding API route

🛠 Architecture

| Category | Stack / Tool |
| --- | --- |
| Frontend | Expo React Native, React Native Web, TypeScript |
| Map | Naver Maps native SDK, Naver Web Dynamic Map |
| Backend | Node.js, TypeScript API server |
| Data | PostgreSQL, Redis, test/local fixtures |
| Test | Jest, `@testing-library/react-native` |
| Deployment | Vercel, Expo web export, Docker Compose for local infra |

📁 Project Structure

| Path | Role |
| --- | --- |
| `App.tsx` | 인증 상태와 루트 탭/화면 흐름 관리 |
| `screens/` | 지도, 버스, 모집글, 채팅, 프로필, 작성 플로우 화면 |
| `components/` | 공통 UI 컨트롤, 카드, 하단 내비게이션, 지도 표면 |
| `services/` | live API client, 테스트용 mock API, 장소 검색 |
| `data/` | 로컬 fixture, 필터링/정렬 helper |
| `server/` | 로컬 API 서버, auth, rate limit, repository, DB scripts |
| `docs/` | 화면 명세, 구현 계획, 아키텍처 참고 문서 |

🚀 Local Development

```bash
npm install
npm run web
```

웹 앱은 Expo 개발 서버를 통해 실행되며, 일반적으로 `http://localhost:8081`에서 열립니다.

검증 명령:

```bash
npm run typecheck
npm test
```

로컬 API와 인프라 실행:

```bash
docker compose up -d
npm run db:check
npm run db:migrate
npm run db:seed
npm run api:start
```

로컬 앱은 `.env`의 `EXPO_PUBLIC_DARORI_API_BASE_URL=http://localhost:8787`을 사용합니다. 프로덕션 웹과 APK는 `EXPO_PUBLIC_DARORI_API_BASE_URL=https://api.dairuri.harammm.me`를 사용합니다.

🔐 Environment

`.env.example`을 복사해 `.env`를 만들고 필요한 값을 채웁니다.

| Variable | Description |
| --- | --- |
| `NAVER_MAP_NCP_KEY_ID` | Android/iOS 네이티브 Dynamic Map SDK key |
| `EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID` | Expo build에서 사용하는 public Dynamic Map key fallback |
| `EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID` | 웹 지도 표면에서 사용하는 public Web Dynamic Map key |
| `NAVER_MAP_API_KEY` | Directions, Geocoding 같은 서버 사이드 REST API key |
| `EXPO_PUBLIC_DARORI_API_BASE_URL` | 앱 API 서버 base URL. 로컬은 `http://localhost:8787`, 프로덕션 웹/APK는 `https://api.dairuri.harammm.me` |
| `EXPO_PUBLIC_DARORI_USER_ID` | 개발용 write user header |
| `EXPO_PUBLIC_DARORI_USE_MOCK_API` | 테스트/로컬 전용 mock opt-in. 프로덕션에서는 unset |
| `DATABASE_URL` | 서버 사이드 PostgreSQL connection string |
| `REDIS_URL` | 서버 사이드 Redis connection string |

`DATABASE_URL`, `REDIS_URL`, `NAVER_MAP_API_KEY`는 모바일 앱 번들에 포함되면 안 되는 서버 전용 값입니다.

🌐 Deployment

Vercel은 웹 앱을 다음 방식으로 빌드하고, `api/[...path].ts`를 통해 `/api/posts`, `/api/chat/rooms` 같은 API Function도 함께 노출합니다.

```bash
npx expo export --platform web --output-dir dist
```

프로덕션에서 Naver Maps가 정상 렌더링되려면 Vercel 환경변수에 `EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID`를 설정하고, Naver Cloud Platform Maps Application 설정에 실제 배포 도메인을 Web 서비스 URL로 등록해야 합니다.

💡 Potential Plans

- 브랜딩 확정 후 README, 앱 설정, mock 데이터 명칭 정리
- 버스 목격 아카이빙을 사용자별 기록, 최근 목격 내역, 지도 마커와 연결
- Naver Directions/Geocoding 기반 장소 검색과 경로 안내 고도화
- 팀원, 역할, 어드바이저 정보가 확정되면 README에 별도 섹션 추가

📚 Reference

- Frontend screen spec: `docs/reference/darori_codex_spec/DARORI_FRONTEND_CODEX_SPEC.md`
- Current architecture notes: `docs/current-architecture.md`
