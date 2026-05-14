# Darori Frontend Spec Implementation Plan

> **For agentic workers:** Use `docs/reference/darori_codex_spec/DARORI_FRONTEND_CODEX_SPEC.md` as the canonical implementation reference. The imported zip and image assets are preserved under `docs/reference/darori_codex_spec/`.

**Goal:** Bring the current Expo React Native implementation up to the imported Darori frontend screen spec, prioritizing missing user flows first and then doing a screenshot-based polishing pass against the Figma reference images.

**Reference Import Status:**
- Source zip copied to `docs/reference/darori_codex_spec.zip`.
- Source zip extracted to `docs/reference/darori_codex_spec/`.
- Canonical spec: `docs/reference/darori_codex_spec/DARORI_FRONTEND_CODEX_SPEC.md`.
- Reference images: `docs/reference/darori_codex_spec/images/*.png`.
- `/Users/yoons/Downloads/DARORI_FRONTEND_CODEX_SPEC.md` matches the zip-internal Markdown exactly, so no external duplicate is stored.

## Current Implementation Snapshot

Implemented at a basic screen level:
- Auth/signup flow in `screens/auth/AuthScreen.tsx`: login, signup form, driver/rider choice, camera permission modal, license camera guide, driver vehicle details.
- Map home in `screens/MapScreen.tsx`: map preview, search bar, category chips, current location button, draggable bottom sheet, selected departure chip, recruitment cards, bottom nav.
- Bus tab in `screens/RouteScreen.tsx`: route search/filter UI and route cards.
- Recruitment creation in `screens/CreateRecruitmentScreen.tsx`: ride/work branching, schedule/detail/confirmation style flow, place picker fallback data, agreement checks.
- Chat list in `screens/ChatScreen.tsx`: chat room list, search/filter controls, unread state.
- Profile home in `screens/MyPageScreen.tsx`: profile summary, stats, menu rows.
- Common pieces in `components/`: `BottomNav`, `FilterChip`, `MapPreview`, `RecruitmentCard`, `CurrentLocationIcon`.
- Tests in `__tests__/`: auth flow, map home, tab navigation, recruitment creation, fixture data, typography.

Needs implementation or deeper matching:
- `PostDetailScreen` and card-to-detail navigation from map/archive/list contexts.
- Apply flow modals: self introduction, terms agreement, completion.
- Application review/approval flow: applicant review screen, approve complete modal, reject reason modal, reject complete modal.
- Chat room detail, chat more bottom sheet, leave room confirmation, report screen, block confirmation.
- Profile edit, profile image bottom sheet, settings screen, liked posts/my posts views if required by profile navigation.
- Spec-aligned data model/service layer for posts, applications, chats, and profile actions.
- Screenshot-based visual polishing against `images/01_map_home.png` through `images/08_signup.png`.

## Task 1: Normalize Shared Tokens And Navigation Surface

**Reference:** sections 1, 2, 3, 5, 8, 10, 13, 14 in the spec.

**Files:**
- Modify: `constants/colors.ts`
- Modify: `constants/spacing.ts`
- Modify: `constants/typography.ts`
- Modify: `data/mapHome.ts`
- Modify: `App.tsx`
- Add or modify shared data/service files under `data/` as needed.
- Test: `__tests__/typography.test.ts`, `__tests__/AppTabs.test.tsx`, focused new data tests.

- [ ] Compare current tokens with spec section 2 and add any missing semantic tokens without replacing working names unnecessarily.
- [ ] Keep Noto Sans as the single app font family and remove any remaining ad hoc font family/weight usage when touching screens.
- [ ] Introduce a simple route state shape in `App.tsx` that can show list, detail, modal flows, chat room, report, profile edit, and settings without pulling in a full navigator yet.
- [ ] Expand fixtures from `data/mapHome.ts` into reusable mock domain records for posts, applications, chats, and profile.
- [ ] Keep existing tab behavior intact: 지도, 버스, 모집글, 채팅, 프로필.

**Acceptance:**
- Existing tests still pass.
- `App.tsx` can route to new detail/flow screens from button presses in later tasks.
- New data tests cover required mock records and IDs used by navigation.

## Task 2: Implement Post Detail And Apply Flow

**Reference:** spec section 6.4 and `images/04_application_flows.png`.

**Files:**
- Add: `screens/post/PostDetailScreen.tsx`
- Add: `screens/post/ApplyFlowModal.tsx`
- Add or modify: `components/AppButton.tsx`
- Add or modify: `components/Header.tsx`
- Modify: `components/RecruitmentCard.tsx`
- Modify: `screens/MapScreen.tsx`
- Modify: `screens/ArchiveScreen.tsx`
- Modify: `App.tsx`
- Test: `__tests__/PostDetailFlow.test.tsx`

- [ ] Make recruitment cards pressable and emit the selected post ID.
- [ ] Add `PostDetailScreen` with the spec's common layout, separate carpool/job detail sections, author block, metadata, and sticky footer action.
- [ ] Add apply modal steps: 자기소개 작성, 약관 동의, 지원 완료.
- [ ] Wire completion to either return to detail or open the chat tab according to the spec event matrix.
- [ ] Cover both ride and work post detail variants with fixtures.

**Acceptance:**
- Pressing a card opens the correct detail screen.
- Pressing `지원하기` opens modal step 1, advances through agreement, then shows completion.
- Tests assert title, primary metadata, footer button, and step transitions.

## Task 3: Implement Application Review And Approval Flow

**Reference:** spec section 6.5 and `images/05_approval_flows.png`.

**Files:**
- Add: `screens/post/ApplicationReviewScreen.tsx`
- Add: `screens/post/ApplicationDecisionModal.tsx`
- Modify: `App.tsx`
- Add or modify mock data under `data/`.
- Test: `__tests__/ApplicationReviewFlow.test.tsx`

- [ ] Add an application review screen that displays applicant profile, linked post summary, schedule/purpose, and decision actions.
- [ ] Implement approve complete modal.
- [ ] Implement reject reason input modal and reject complete modal.
- [ ] Support both 알바 and 카풀 copy differences from the spec.

**Acceptance:**
- Approve path reaches a completion state.
- Reject path requires or captures a reason before completion.
- Tests cover the approve and reject transitions.

## Task 4: Implement Chat Room, More Sheet, And Report Flow

**Reference:** spec section 6.6 and `images/06_chat.png`.

**Files:**
- Add: `screens/chat/ChatRoomScreen.tsx`
- Add: `screens/chat/ReportScreen.tsx`
- Add: `components/BottomSheet.tsx`
- Modify: `screens/ChatScreen.tsx`
- Modify: `App.tsx`
- Test: `__tests__/ChatRoomReportFlow.test.tsx`

- [ ] Make chat room list rows open `ChatRoomScreen`.
- [ ] Build `ChatHeader`, message bubbles, and composer states from the spec.
- [ ] Add more bottom sheet with report/leave actions.
- [ ] Add leave room confirmation modal.
- [ ] Add report screen and block confirmation modal.

**Acceptance:**
- Chat list to room navigation works.
- More sheet exposes report and leave actions.
- Report flow can select a reason and submit/block confirmation.
- Tests cover room open, sheet open, report submit, and leave confirmation.

## Task 5: Implement Profile Edit, Image Sheet, Settings, And Saved Lists

**Reference:** spec section 6.7 and `images/07_profile.png`.

**Files:**
- Add: `screens/profile/ProfileEditScreen.tsx`
- Add: `screens/profile/SettingsScreen.tsx`
- Add: `screens/profile/SavedPostsScreen.tsx`
- Add: `screens/profile/MyPostsScreen.tsx` if needed by the spec matrix.
- Modify: `screens/MyPageScreen.tsx`
- Modify: `App.tsx`
- Test: `__tests__/ProfileSettingsFlow.test.tsx`

- [ ] Wire profile menu rows to concrete screens.
- [ ] Build profile edit fields and avatar edit action.
- [ ] Add profile image bottom sheet.
- [ ] Build settings rows for notification/account/logout style actions in the spec.
- [ ] Reuse recruitment cards for saved/my posts where appropriate.

**Acceptance:**
- Profile menu actions navigate to concrete screens instead of static rows.
- Avatar edit opens a bottom sheet.
- Settings screen renders all spec rows.
- Tests cover profile edit and settings navigation.

## Task 6: Finish Spec-Aligned Signup Polish

**Reference:** spec section 6.8 and `images/08_signup.png`.

**Files:**
- Modify: `screens/auth/AuthScreen.tsx`
- Add or modify: `components/Header.tsx`
- Test: `__tests__/AuthFlow.test.tsx`

- [ ] Align login/signup spacing, field labels, modal geometry, and driver detail scroll behavior with the imported screenshot.
- [ ] Replace placeholder car photo blocks with stable local or remote-safe demo assets if the spec requires image thumbnails.
- [ ] Confirm role selection, camera allow/deny, manual input, and non-driver completion paths remain covered.

**Acceptance:**
- Existing auth tests pass.
- Signup screens match the structure and interaction order in section 6.8.
- No mixed font families remain in auth styles.

## Task 7: Figma Screenshot Polishing Pass

**Reference:** section 14 and all files under `docs/reference/darori_codex_spec/images/`.

**Files:**
- Modify affected screen/component styles only.
- Add screenshot artifacts under a local ignored folder if needed.

- [ ] Run the app at the iPhone 13/14 target size, 390 x 844.
- [ ] Compare implemented screens against:
  - `images/01_map_home.png`
  - `images/02_bus_archiving.png`
  - `images/03_create_post.png`
  - `images/04_application_flows.png`
  - `images/05_approval_flows.png`
  - `images/06_chat.png`
  - `images/07_profile.png`
  - `images/08_signup.png`
- [ ] Fix visible overlaps, wrong font scale, missing icons, broken bottom safe area, and large spacing mismatches.
- [ ] Keep layout responsive enough for common mobile widths rather than using full-screen absolute positioning.

**Acceptance:**
- No visible blank screen, overlapping text, or clipped primary controls on 390 x 844.
- Map home selected/unselected filter states match the reference behavior.
- Bottom nav is stable and does not shift between tabs.

## Current Gap Addendum: Buttons, Paging, Sorting

This section reflects the implementation status after the map, bus, chat, post detail, application review, profile, and mock DB batches.

Implemented since the original plan:
- Map home category buttons: `라이드`, `알바`, `버스` now toggle selected state and filter visible map posts.
- Map home bottom filter buttons: `날짜`, `시간`, `출발 장소` now cycle or toggle selected filter state.
- Map home sort button: `정렬조건` now cycles through `최신순`, `오래된순`, and default.
- Bus tab route sorting: `빠른순`, `출발순`, `상태순` now sort route cards and the summary route.
- Bus tab route filters: `전체`, `운행중`, `곧 도착`, `급행` now filter visible routes.
- Chat list buttons: `전체`, `라이드`, `알바` now switch chat room categories; unread filter toggles unread-only mode.
- Chat room and report buttons exist for message send, more sheet, leave confirmation, and report submit.

Still unimplemented or incomplete:
- Map home search bar is visually present but does not open a search screen or search mode.
- Map home current-location floating button is visually present but does not recenter a real map camera yet.
- Map home route/people mode buttons from the Figma route-select state are not implemented.
- Map markers are decorative/preview-only; marker press does not select a post or update the bottom sheet.
- Map home bottom sheet currently renders the first two filtered posts; it needs pagination, infinite scroll, or expanded full-list behavior.
- Archive/recruitment list category chips are static; `라이드`, `알바`, `버스`, date/time/place filters, and sort state must be implemented there too.
- Archive/recruitment list search bar and header slider button are static.
- Archive/recruitment list has no pagination or infinite scroll.
- Create recruitment place picker map buttons are UI-only where they do not yet call a real map/search/geocoding flow.
- Bus tab search bar is static and does not query stops/routes.
- Bus route cards are not pressable and do not open a route detail or route-on-map preview.
- Chat list search bar is static and does not filter rooms/messages by query.
- Chat room composer attachment button is static.
- Chat room more sheet has some actions as visual rows only: manner evaluation, license/insurance lookup, invite, search, alarm toggle.
- Profile list/settings rows that imply external flows, such as password change and account deletion persistence, still need live backend behavior.

Next implementation tasks for this gap:
- Add tests for ArchiveScreen filtering, sorting, and pagination before modifying the screen.
- Move shared filter/sort logic out of `MapScreen.tsx` and reuse it in `ArchiveScreen.tsx`.
- Add a `PagedListState` helper that exposes `visibleItems`, `hasMore`, `loadMore`, and `resetPage`.
- Wire map search/current-location/marker events to no-op-safe callbacks now, then replace with Naver map calls in the native map pass.
- Add chat search and room action tests before wiring search/alarm/invite/report persistence.

## Current Gap Addendum: PostgreSQL And Redis Connection Plan

Decision:
- PostgreSQL + Redis is the right split for this app if Darori is deployed as a mobile app backed by an API server.
- PostgreSQL should be the source of truth for durable data.
- Redis should be used only for volatile, cache, or coordination data.
- The Expo mobile app must not connect directly to PostgreSQL or Redis because DB credentials would be shipped in the app bundle. The app should call a Darori API server through `EXPO_PUBLIC_DARORI_API_BASE_URL`.

Durable PostgreSQL data:
- Users, profile, driver status, vehicle metadata, posts, likes, applications, approval/rejection state, chat rooms, chat message history, reports, account settings, and audit timestamps.

Volatile Redis data:
- Session/token denylist if the backend uses token revocation, phone/PASS verification nonce, rate limits, typing/presence state, unread-count cache, map/geocoding/directions cache, temporary route recommendations, lightweight locks, and background job coordination.

Implemented connection foundation:
- Server-side PostgreSQL adapter: `server/db/postgres.ts`.
- Server-side Redis adapter: `server/db/redis.ts`.
- Runtime config validation: `server/db/config.ts`.
- Connection check script: `npm run db:check`.
- Local development DB stack: `docker-compose.yml` starts PostgreSQL on `localhost:54320` and Redis on `localhost:63790`.
- Schema apply script: `npm run db:schema`.
- Initial relational schema draft: `server/db/schema.sql`.
- Mobile API switch: `services/api.ts` routes app calls to live API when `EXPO_PUBLIC_DARORI_API_BASE_URL` is set, otherwise falls back to `services/mockApi.ts`.

Remaining backend work:
- Create the actual API server runtime or connect this mobile repo to the separate backend repo.
- Apply `server/db/schema.sql` through a real migration tool before production data is stored.
- Implement API routes matching the mobile client contract:
  - `GET /posts`
  - `GET /posts/:id`
  - `POST /posts`
  - `POST /posts/:id/like`
  - `POST /posts/:id/applications`
  - `POST /applications/:id/accept`
  - `POST /applications/:id/reject`
  - `GET /chat/rooms`
  - `GET /chat/rooms/:roomId/messages`
  - `POST /chat/rooms/:roomId/messages`
- Add authentication and request user context before exposing write endpoints.
- Add Redis-backed rate limiting around login, signup, application submit, and chat send endpoints.
- Run `npm run db:check` with real `DATABASE_URL` and `REDIS_URL` once credentials are available.

## Verification Plan

Run before reporting completion of each implementation batch:
- `npm test`
- `npm run typecheck`
- `npx expo-doctor`

For visual batches:
- Start Expo web or native preview.
- Capture the target screen at 390 x 844.
- Compare manually against the corresponding imported reference image.

For reference integrity:
- `test -f docs/reference/darori_codex_spec.zip`
- `test -f docs/reference/darori_codex_spec/DARORI_FRONTEND_CODEX_SPEC.md`
- `test -f docs/reference/darori_codex_spec/images/01_map_home.png`
- Validate every `images/*.png` reference in the Markdown exists on disk.
