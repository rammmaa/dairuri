# Current Architecture

기준: 현재 저장소 코드. 웹 배포는 Vercel의 Expo web export 흐름을 사용하며, Android APK/EAS 설정은 `eas.json`의 `apk` profile에 있다.

## High-Level Architecture

```mermaid
flowchart TD
  User[Mobile/Web User]
  App[Expo React Native App]
  Screens[Screens]
  MapScreen["screens/MapScreen.tsx"]
  MapSurface["components/NaverMapSurface.*"]
  NaverMaps[Naver Maps Dynamic Map]
  BusArchive[Bus sighting archive panel]
  ResourceMap[Human resource map profiles]
  ServiceSwitch[services/api.ts]
  MockApi[Test/local mock API]
  LiveApi[services/liveApi.ts]
  VercelApi["api/[...path].ts"]
  ApiServer[server/api/server.ts]
  ApiHandler[server/api/handler.ts]
  Auth[server/api/auth.ts]
  RateLimit[server/api/rateLimit.ts]
  Repository[server/api/repository.ts]
  Postgres[(PostgreSQL)]
  Redis[(Redis)]
  Vercel[Vercel Web Deploy]
  Apk[Local/EAS Android APK]

  User --> App
  App --> Screens
  Screens --> MapScreen
  MapScreen --> MapSurface
  MapSurface --> NaverMaps
  MapScreen --> BusArchive
  MapScreen --> ResourceMap
  Screens --> ServiceSwitch
  ServiceSwitch -->|test or explicit mock opt-in| MockApi
  ServiceSwitch -->|default runtime| LiveApi
  LiveApi --> VercelApi
  LiveApi --> ApiServer
  VercelApi --> ApiHandler
  ApiServer --> ApiHandler
  ApiHandler --> Auth
  ApiHandler --> RateLimit
  RateLimit --> Redis
  ApiHandler --> Repository
  Repository --> Postgres
  App --> Vercel
  App --> Apk
```

## App Layer

| Area | Files | Role |
| --- | --- | --- |
| Entry | `index.ts`, `App.tsx` | Expo entry and root screen/tab orchestration |
| Screens | `screens/*.tsx` | Map, route/bus, archive, human-resource registration, chat, profile flows |
| Components | `components/*.tsx` | Shared UI controls, bottom nav, cards, native/web map surfaces |
| Domain types | `types/domain.ts` | Shared app/domain model types |
| Test/local data | `data/mockDomain.ts`, `data/mapHome.ts` | Fixture source for Jest and explicit local mock mode |
| List helpers | `data/mapPostList.ts` | Shared map/archive filtering, sorting, paging |
| Design tokens | `constants/*.ts` | Colors, spacing, typography |

## API Client Flow

```mermaid
flowchart LR
  Screen[Screen action]
  ApiSwitch[services/api.ts]
  Mock[Test/local mock API]
  Client[services/apiClient.ts]
  Live[Live HTTP API]

  Screen --> ApiSwitch
  ApiSwitch -->|NODE_ENV=test or EXPO_PUBLIC_DARORI_USE_MOCK_API=true| Mock
  ApiSwitch -->|default runtime| Client
  Client --> Live
```

The app defaults to live API mode. If `EXPO_PUBLIC_DARORI_API_BASE_URL` is missing outside tests, live calls fail loudly instead of silently reading mock data. Mock mode is available only in Jest or with `EXPO_PUBLIC_DARORI_USE_MOCK_API=true` for controlled local demos.

Live requests can include:

- `EXPO_PUBLIC_DARORI_API_BASE_URL`: API server base URL. Local server uses `http://localhost:8787`; same-origin Vercel web deploy can use `/api`.
- `Authorization: Bearer <session token>`: issued by `POST /auth/login` or `POST /auth/signup` and sent by `services/apiClient.ts`.

`X-Darori-User-Id` remains only as a test/development fallback when `DARORI_ALLOW_DEV_USER_HEADER=true` on the server and `EXPO_PUBLIC_DARORI_ALLOW_DEV_USER_HEADER=true` on the client.

## Map Layer

The map home screen uses two implementations behind the same UI surface:

| Target | Files | Behavior |
| --- | --- | --- |
| Native | `components/NaverMapSurface.tsx` | Uses `@mj-studio/react-native-naver-map` and native Dynamic Map key configuration |
| Web | `components/NaverMapSurface.web.tsx` | Loads the Naver Web Dynamic Map script with `EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID` |
| Fallback | `components/FallbackMapSurface.tsx` | Draws a lightweight local map-like view when the real map cannot be used |

`screens/MapScreen.tsx` owns the map camera state, category chips, current-location button, recruitment/resource bottom sheet, and the bus sighting archive panel. The `work` category currently represents the human-resource map: job seekers register possible tasks, availability, and preferred conditions so local residents or employers can discover and contact them. The current-location button asks the browser/native geolocation API for permission, moves the map camera, and falls back to the default campus coordinate when location is unavailable.

## Server API

Server entrypoints:

- Local long-running HTTP server: `server/api/server.ts`
- Vercel Function catch-all: `api/[...path].ts`
- Shared request handler: `server/api/handler.ts`

| Route | Auth | Rate limit | Repository action |
| --- | --- | --- | --- |
| `GET /health` | no | no | none |
| `POST /auth/signup` | no | yes | `registerUser(body)` |
| `POST /auth/phone-verifications` | no | yes | create verification code and send via SOLAPI SMS |
| `POST /auth/phone-verifications/:id/confirm` | no | yes | confirm verification code and issue signup proof |
| `POST /auth/login` | no | yes | `authenticateUser(body)` |
| `GET /me` | required | no | `getUserById(userId)` |
| `PATCH /me` | required | no | `updateUserProfile(userId, body)` |
| `PATCH /me/password` | required | yes | `changeUserPassword(userId, body)` |
| `DELETE /me` | required | yes | `deleteUserAccount(userId)` |
| `GET /me/posts` | required | no | `listUserPosts(userId, userId)` |
| `GET /me/saved-posts` | required | no | `listSavedPosts(userId)` |
| `GET /me/received-applications` | required | no | `listReceivedApplicationDetails(userId)` |
| `GET /posts` | optional bearer token | no | `listPosts(viewerUserId)` |
| `GET /maps/geocode` | no | no | `searchNaverPlaces(query)` |
| `GET /posts/:id` | optional bearer token | no | `getPostById(id, viewerUserId)` |
| `POST /posts` | required | yes | `createPost(body, userId)` |
| `POST /posts/:id/like` | required | yes | `togglePostLike(postId, userId)` |
| `GET /posts/:id/applications` | required | no | `listApplicationsForPost(postId, userId)` |
| `POST /posts/:id/applications` | required | yes | `createApplication(postId, intro, userId)` |
| `GET /applications/:id` | required | no | `getApplicationDetail(id, userId)` |
| `POST /applications/:id/accept` | required | yes | `acceptApplicationAndCreateChatRoom(id, userId)` |
| `POST /applications/:id/reject` | required | yes | `rejectApplication(id, userId, reason)` |
| `GET /bus/routes` | no | no | `listBusRoutes()` |
| `GET /bus/stops` | no | no | `listBusStops()` |
| `GET /bus/route-stops` | no | no | `listBusRouteStops()` |
| `GET /bus/stops/:id/sightings` | no | no | `listSightingsForStop(stopId, limit)` |
| `POST /bus/sightings` | required | yes | `recordBusSighting(body, userId)` |
| `GET /chat/rooms` | required | no | `listChatRooms(userId)` |
| `GET /chat/rooms/:roomId/messages` | required | no | `listChatMessages(roomId, userId)` |
| `POST /chat/rooms/:roomId/messages` | required | yes | `createChatMessage(roomId, text, userId)` |
| `POST /reports` | required | yes | `createReport(roomId, reason, userId)` |

Auth behavior:

- `server/api/auth.ts` verifies bearer tokens against `auth_sessions`.
- Authenticated endpoints return `401` when the session token is missing, expired, or invalid.
- Public post reads can use an optional bearer token only to calculate viewer-specific fields such as `liked`.
- Development user headers are disabled unless explicitly enabled for local debugging.

Rate limit behavior:

- `server/api/rateLimit.ts` uses Redis-style `incr` + `expire`.
- Server returns `429` with `Retry-After` when exceeded.
- `DARORI_RATE_LIMIT_DISABLED=true` can disable it for controlled local debugging.

## Data Layer

```mermaid
erDiagram
  users ||--o| vehicles : owns
  users ||--o{ posts : writes
  users ||--o{ post_likes : likes
  posts ||--o{ post_likes : receives
  posts ||--o{ applications : has
  users ||--o{ applications : submits
  posts ||--o{ chat_rooms : can_link
  chat_rooms ||--o{ chat_room_participants : has
  users ||--o{ chat_room_participants : joins
  chat_rooms ||--o{ chat_messages : contains
  users ||--o{ chat_messages : sends
  users ||--o{ reports : creates
  chat_rooms ||--o{ reports : can_reference
  bus_routes ||--o{ bus_route_stops : has
  bus_stops ||--o{ bus_route_stops : serves
  bus_routes ||--o{ bus_sightings : receives
  bus_stops ||--o{ bus_sightings : receives
  users ||--o{ bus_sightings : reports
```

Main schema file: `server/db/schema.sql`

Durable PostgreSQL tables:

- `users`
- `phone_verifications`
- `vehicles`
- `posts`
- `post_likes`
- `applications`
- `chat_rooms`
- `chat_room_participants`
- `chat_messages`
- `reports`
- `auth_sessions`
- `bus_routes`
- `bus_stops`
- `bus_route_stops`
- `bus_sightings`

The `posts` table includes human-resource profile columns for the `work` map pivot: `profile_mode`, `available_tasks`, `employment_types`, `preferred_pay`, `availability_note`, and `contact_note`.

Migration tracking:

- `schema_migrations` is created by `server/db/migrate.ts`.
- `npm run db:migrate` applies pending schema migrations.
- `npm run db:reset` drops app tables/types and reapplies schema + seed.

Redis usage:

- rate limit counters for write endpoints.
- bus stop latest-sighting cache.
- planned future usage: token denylist, verification nonce, presence, unread cache, map/directions cache.

## Build And Deployment

| Target | Current path |
| --- | --- |
| Android APK | EAS profile `apk` in `eas.json`, `android.buildType=apk` |
| Web production | Vercel uses `vercel.json` to run `npx expo export --platform web --output-dir dist` |
| API production | Vercel serves `api/[...path].ts` under `/api/*`, or `npm run api:start` can run the same handler on a separate Node host |
| Web local | `npm run web` |
| API local | `npm run api:start` |
| DB local | `docker-compose.yml` runs PostgreSQL on `54320`, Redis on `63790` |
| Android APK | APK profile is in PR #14. Local artifact was copied to `~/Downloads/dairuri.apk` |

## Environment Variables

| Variable | Used by | Required for |
| --- | --- | --- |
| `EXPO_PUBLIC_DARORI_API_BASE_URL` | app client | live API mode |
| `EXPO_PUBLIC_DARORI_USER_ID` | app client | development-only user header fallback |
| `EXPO_PUBLIC_DARORI_ALLOW_DEV_USER_HEADER` | app client | opt into development-only user header fallback |
| `EXPO_PUBLIC_DARORI_USE_MOCK_API` | app client | test/local mock opt-in only |
| `EXPO_PUBLIC_NAVER_MAP_NCP_KEY_ID` | Expo app / native map | public native Dynamic Map key fallback |
| `EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID` | web map surface | Naver Web Dynamic Map script auth |
| `NAVER_MAP_NCP_KEY_ID` | Expo config | native Naver map client id |
| `NAVER_MAP_API_KEY` | server API | Naver REST APIs such as geocoding/directions |
| `SOLAPI_API_KEY` | server API | SOLAPI API key for phone verification SMS |
| `SOLAPI_API_SECRET` | server API | SOLAPI API secret for HMAC-SHA256 signing |
| `SOLAPI_FROM` | server API | registered SOLAPI sender number |
| `PHONE_VERIFICATION_HASH_SECRET` | server API | secret salt for stored phone-code and proof-token hashes |
| `PHONE_VERIFICATION_DEBUG_CODE_ENABLED` | server API | temporary production debug escape hatch that exposes verification codes |
| `DATABASE_URL` | server DB | PostgreSQL access |
| `REDIS_URL` | server API | rate limiting / Redis access |
| `DATABASE_SSL` / `PGSSLMODE` / `POSTGRES_SSL` | server DB | production SSL config |
| `DARORI_API_PORT` | server API | local API port override |
| `DARORI_ALLOW_DEV_USER_HEADER` | server API | opt into development-only `X-Darori-User-Id` auth fallback |
| `DARORI_RATE_LIMIT_DISABLED` | server API | controlled local rate-limit bypass |

## Current Gaps

These are not finished yet:

- Production `DATABASE_URL` and `REDIS_URL` verification against real infrastructure.
- Production Naver Maps domain/environment verification for the final deployment URL.
- Persistent native token storage. Current session state is in-memory; app restart requires logging in again until secure storage is added.
- Production profile image upload/storage. The UI no longer saves fake `camera://` or `library://` URIs and keeps photo editing disabled until object storage is configured.
- Branding cleanup across `app.config.js`, environment variable names, fixtures, and reference docs after the public name is final.
