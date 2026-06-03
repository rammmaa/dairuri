# Bus Archive Figma Realignment

## Goal

Realign the bus archive UI with the 2026-05-26 Figma frames the user shared on the same day. The five-state machine stays; visual shells and several UX patterns change to match the design exactly. PR #18 has merged main and added the human-resource feature alongside; this spec scopes the next round of bus archive work on top of that base.

## Reference frames (from user 2026-05-26)

A. **Recorder** (header "버스 아카이빙" + (i)) - prominent black "버스 도착 시간 기록 보기 >" card on top, a large mint circle bus button below with a white bus icon, current-location chip under the button, help line. Bottom tab bar visible.
- Removed vs current build: the 1-to-6 pager strip and the live clock.

B. **Confirmation** (header rename "정류장 매칭 확인" + (i)) - prompt "이 정류장이 맞나요?" + hint "기록확정을 위해 버튼을 눌러주세요" - white card with a small yellow "행복버스 N번" chip, large pin + stop name, and a map preview (real-map tile background under a polyline + pins). Two pill buttons below: red 틀려요 / mint 맞아요. Bottom tab bar visible.

C. **Confirmed** - the confirmation screen with a centered modal overlay: mint ✓ icon, "기록 완료" headline, "확정이 되었습니다! 감사합니다 :)" subtext, two buttons - mint outline [홈으로] and yellow [기록 보기]. The screen behind dims.

D. **Combined route + stop selection** (header "노선/정류장 선택" + (i)) - top section "행복버스 노선 선택 (1번 - 6번)" with a 2x3 chip grid (selected chip = black background + yellow dot, deselected = white outline + yellow dot). Bottom section "행복버스 정류장 선택" with a vertical scrollable list, yellow connector line + yellow circles + stop name per row, selected row highlighted yellow. On stop tap, a centered confirmation modal: "{route} {stop} 정류장으로 기록을 완료하시겠습니까?" + gray [취소] and yellow [기록 확정]. Bottom tab bar visible.

User notes (from the same hand-off):
- "처음엔 그냥 1번 노선 띄워놓으면 될 것 같아요" - the route + stop selection screen should default `chosenRouteId` to H1 so the stop list is never empty.
- "정류장 부분만 스크롤 가능" - only the stop list scrolls; the chip grid stays anchored.

## Scope (this realign iteration)

### In scope

1. Drop the pager strip and the live clock from the recorder.
2. New `BusArrivalTimesEntry` card (black background, prominent) above the bus button. Tapping it opens `BusArrivalTimesScreen` via the existing `onOpenArrivalTimes` prop.
3. Big mint circle bus button (replaces the gray rectangle) with a white bus icon. Same `canStartConfirmation` gating.
4. Confirmation header text becomes "정류장 매칭 확인". Card becomes white with a yellow `RouteChip` ("행복버스 N번"), large stop name + pin, and `RouteMapPreview` rendered in `geographic` mode over a tile-styled background View.
5. Pill 맞아요 / 틀려요 buttons - rounded, side by side, red 틀려요 with a triangle icon, mint 맞아요 with a bus icon. The keyword "이 정류장이 맞나요?" stays as the headline.
6. Confirmed view becomes a centered modal overlay (`ConfirmedModal`) instead of an inline confirmed body. Buttons: [홈으로] (mint outline) -> `onBack`; [기록 보기] (yellow) -> `onOpenArchiveHistory`. The confirmation card behind the modal dims to ~40% opacity.
7. Merge route-grid + stop-selection into a single `RouteAndStopSelectView` body. Sticky chip grid on top, scrollable stop list below. Tapping a stop opens a centered `ConfirmRecordModal` ("{route name} {stop name} 정류장으로 기록을 완료하시겠습니까?") with [취소] (gray) and [기록 확정] (yellow). Confirm fires `recordBusSighting` and transitions to the confirmed state.
8. Bottom tab bar is rendered on all five states. The existing `BottomNav` component is reused; tapping a tab while inside BusSightingScreen exits via `onSelectTab` (App.tsx already wires this for RouteScreen).
9. Route naming switches from "행복버스 N호선" to "행복버스 N번" in the displayed `name`. `BusRoute.code` stays `H1`-`H6` so the existing route-card matching by code keeps working.
10. Stop fixtures rewrite to the names the user transcribed from the new frames: 청도공용버스터미널, 구미리, 아랫구미, 월곡2리(박월), 귀뚜라미보일러, 농공단지 입구.
11. `RouteMapPreview` keeps the `schematic` layout option but the confirmation view switches to `geographic` over a tile-styled View so the polyline reads as real geography.

### Out of scope

- Loading real map tile imagery (Google or OSM). Ship a tile-styled placeholder View under the polyline for this iteration; real tiles land later.
- Phase 2 stubs (route info, archive history, arrival times) stay as `ComingSoonScreen`. The [기록 보기] button forwards to the archive history stub; we replace it when the real screen lands.

## Data changes

`data/mockDomain.ts`:

- `mockBusStops`: replace the six existing entries with the six new names. Placeholder coordinates around (35.65 N, 128.73 E) but spaced so the schematic / geographic layouts still place them legibly. Proposed IDs:
  - `stop-cheongdo-public-terminal` (청도공용버스터미널)
  - `stop-gumiri` (구미리)
  - `stop-arae-gumi` (아랫구미)
  - `stop-wolgok-2-pakwol` (월곡2리(박월))
  - `stop-gwitturami-boiler` (귀뚜라미보일러)
  - `stop-nonggong-entrance` (농공단지 입구)
- `mockBusRoutes`: change `name` from "행복버스 N호선" to "행복버스 N번". Keep `code` (`H1`-`H6`) and `color` (single mint).
- `mockBusRouteStops`: rewrite. H1 visits all six new stops as a loop (the default selection per user note). Other routes (H2-H6) visit subsets so the rejection branch has variety.
- `mockBusSightings`: repoint historical sightings to the new stop and route ids.

`server/db/seedData.ts`, `server/db/seed.ts`: consume mockDomain so no direct change needed (post-pull they already do).

## Screen and component changes

New components:

- `components/BusArrivalTimesEntry.tsx` - prominent black card with clock-history icon, "버스 도착 시간 기록 보기" label, right chevron. Reuses across the recorder and (later) any other archive landing.
- `components/RouteChip.tsx` - small yellow pill that displays "행복버스 N번" given a route. Used on the confirmation card.
- `components/RouteSelectGrid.tsx` - 2x3 chip grid for the selection view. Selected chip = black background + yellow dot; deselected chip = white + outline + yellow dot.
- `components/StopRailList.tsx` - vertical stop list with a yellow connector rail + yellow circles + stop name per row. Selected row highlights the entire row yellow.
- `components/ConfirmedModal.tsx` - centered modal with ✓ icon, headline, subtext, two buttons. Renders over a dimmed parent.
- `components/ConfirmRecordModal.tsx` - centered modal asking "{route} {stop} 정류장으로 기록을 완료하시겠습니까?". [취소] / [기록 확정].

`screens/BusSightingScreen.tsx` rewrites:

- Drop pager strip + live clock entirely. Drop the `setNow` effect and the `clock` style block. Drop `PagerStrip`.
- Recorder body uses the new `BusArrivalTimesEntry` + the new big mint circle button + a tighter location chip.
- Confirmation body uses the new white card + `RouteChip` + new `RouteMapPreview` (geographic, tile-style background) + pill 맞아요/틀려요 buttons.
- Confirmed body renders the confirmation body underneath at reduced opacity with `ConfirmedModal` on top. `handleStateBack` from the modal exits the screen via `onBack`.
- Route-grid + stop-selection merged into one body `RouteAndStopSelectView`. Top chip grid stays mounted while the stop list scrolls. `chosenRouteId` defaults to `H1` on entering this state so the stop list is never empty per user note.
- Stop tap opens `ConfirmRecordModal`. [취소] dismisses; [기록 확정] fires `recordBusSighting` with the committed location (already captured from the bus-button press by the existing `committedLocation` state).
- Bottom tab bar renders on all states. `BusSightingScreenProps` adds `onSelectTab?: (item: BottomNavItem) => void` so the host (App.tsx) can route tab taps. App.tsx wires it the same way RouteScreen does.

`App.tsx`:

- Pass `onSelectTab={handleSelectTab}` to `BusSightingScreen`.
- Confirmed modal [기록 보기] forwards to `setBusArchiveHistoryOpen(true)` so the Phase 2 stub opens.

## Tests

The existing `BusSightingScreen.test.tsx` flow tests need a rewrite for the new layout. Coverage targets:

- Recorder shows the prominent arrival-times entry; tapping it calls `onOpenArrivalTimes` once.
- Recorder no longer renders the live clock or the 1-to-6 pager.
- Confirmation header text is "정류장 매칭 확인" (the screen title now varies per state - check via `Header` title prop).
- Confirmation surfaces the yellow `RouteChip` with "행복버스 N번" and a `MapPin` over a tile-style View.
- "맞아요" tap commits and transitions to confirmed; `ConfirmedModal` renders with ✓, "기록 완료", and two buttons.
- Confirmed modal [홈으로] calls `onBack` once; [기록 보기] calls a new `onOpenArchiveHistory` prop once.
- "틀려요" tap transitions to the merged selection state with H1 chip preselected and the stop list rendered.
- Stop tap in selection opens `ConfirmRecordModal`; [기록 확정] commits.
- BottomNav appears in all five states; tapping a tab calls `onSelectTab` once.

Existing test files that move ID/name to match new fixtures:

- `__tests__/mockDomain.test.ts` - new stop names + new route names.
- `__tests__/mockBusSightings.test.ts` - new IDs in sightings.
- `__tests__/serverSeedData.test.ts` - new IDs assertion.
- `__tests__/serverBusRouteSnap.test.ts` - update stop IDs used in fixtures.
- `__tests__/RouteScreen.test.tsx` - update sorted card names to "행복버스 N번".

## Open questions (please confirm before implementation)

1. Stop ID slug style: keep romanized Korean (`stop-gwitturami-boiler`) or use opaque numeric IDs (`stop-h1-3`)? Romanization keeps debug grepping easy; numeric is shorter.
2. [기록 보기] target: route to the archive history stub for now (current proposal), or land a dedicated "recently recorded" detail screen as part of this work?
3. Tile background: ship a tile-styled placeholder View first and load real tiles later (proposed), or block on real tiles?
4. Should the routeCards on `RouteScreen` also re-label to "행복버스 N번"? Currently the prototype labels there are independent of the bus archive routes.
5. Confirm `chosenRouteId` defaults to `H1` (=route-happy-1) when entering the selection state.
6. The pager strip removal also affects test assertions added in prior commits. Drop them entirely, OK?

## File map

Files to write fresh:

- `components/BusArrivalTimesEntry.tsx`
- `components/RouteChip.tsx`
- `components/RouteSelectGrid.tsx`
- `components/StopRailList.tsx`
- `components/ConfirmedModal.tsx`
- `components/ConfirmRecordModal.tsx`

Files to rewrite:

- `screens/BusSightingScreen.tsx` (~700-800 lines after the realignment)
- `__tests__/BusSightingScreen.test.tsx`
- `data/mockDomain.ts` (bus stops + route names)
- `__tests__/mockDomain.test.ts`, `__tests__/mockBusSightings.test.ts`, `__tests__/serverSeedData.test.ts`, `__tests__/serverBusRouteSnap.test.ts`, `__tests__/RouteScreen.test.tsx`

Files to touch lightly:

- `App.tsx` (onSelectTab prop, [기록 보기] wiring)
- `components/RouteMapPreview.tsx` (optional tile background; or leave for the consumer to wrap)

## Verification (run in the new session before opening the next PR)

```
npm run typecheck
npm test
npm run web                                # check the recorder + confirmation + selection visually
# DevTools Sensors -> Location 35.6474, 128.7338 so liveInference resolves
```

Suggested commit split for the implementation session (one commit per item, in order):

1. `feat(domain): rename Happy Bus routes to "N번" and rewrite stops to the 2026-05-26 Figma names`
2. `feat(components): add BusArrivalTimesEntry, RouteChip, ConfirmedModal, ConfirmRecordModal, RouteSelectGrid, StopRailList`
3. `feat(screen): realign BusSightingScreen recorder to the 2026-05-26 Figma frame`
4. `feat(screen): swap confirmation card to white + RouteChip + tile-styled map preview`
5. `feat(screen): replace inline confirmed card with ConfirmedModal overlay`
6. `feat(screen): merge route-grid and stop-selection into RouteAndStopSelectView`
7. `feat(screen): render BottomNav across all bus archive states and forward onSelectTab`
8. `feat(screen): build the arrival-times screen (route/stop select + weekday + times)`
9. `chore(tests): realign bus archive tests to the new flow and fixture names`

## 2026-06-03 finalization (decisions confirmed before implementation)

The user re-shared the six Figma frames and answered the open questions. Final decisions for this iteration:

- **Open Q1 (stop ID style):** romanized slugs (`stop-cheongdo-public-terminal`, etc.).
- **Open Q4 (RouteScreen labels):** unify the prototype route cards on `RouteScreen` to "행복버스 N번" too (and re-point their departure/arrival stop names to the new six stops).
- **Stop names:** the six names below are canonical. The "청도시장" and "하지석동입구" labels visible in the confirmation / modal frames are Figma sample data and are ignored.
- **Arrival-times screen is now IN scope** (was a `ComingSoon` stub). New frames 79/81/82 fully design it: it reuses the route/stop selection layout, then on stop tap shows a detail with a weekday selector (월-일, single select) and a bus-times list.
- **Arrival-times data source:** static placeholder only. A new `data/busArrivalTimes.ts` returns deterministic demo times per (route, stop, weekday). No server, DB, migration, or service-layer change this iteration. This is intentionally NOT wired through `services/api.ts`; it is a UI placeholder and is documented as such so a later iteration can move it behind the dual-mode service when a real operator schedule lands.

### Stop fixture mapping (coordinates reused from the old fixtures in order, so the snap geometry and coordinate-based tests stay stable)

| # | name | id | lat | lng |
|---|------|----|-----|-----|
| 1 | 청도공용버스터미널 | `stop-cheongdo-public-terminal` | 35.6474 | 128.7338 |
| 2 | 구미리 | `stop-gumiri` | 35.6492 | 128.7355 |
| 3 | 아랫구미 | `stop-arae-gumi` | 35.6501 | 128.7370 |
| 4 | 월곡2리(박월) | `stop-wolgok-2-pakwol` | 35.6480 | 128.7390 |
| 5 | 귀뚜라미보일러 | `stop-gwitturami-boiler` | 35.6450 | 128.7305 |
| 6 | 농공단지 입구 | `stop-nonggong-entrance` | 35.6520 | 128.7385 |

Route memberships (by the # column above): **H1 = 1,2,3,4,5,6 (all six, the default selection)**, H2 = 1,2,3, H3 = 3,4,5, H4 = 4,5,6, H5 = 5,6,1, H6 = 6,1,2,3. H1 becoming the all-six route (previously H2) satisfies the user note "처음엔 그냥 1번 노선 띄워놓으면 될 것 같아요".

### State machine after the merge

`recorder -> confirmation -> selection` plus a `recordCompleted` overlay flag. The old `route-grid` and `stop-selection` states collapse into a single `selection` body (sticky 2x3 chip grid + scrollable stop rail). The old inline `confirmed` body is replaced by the `ConfirmedModal` overlay rendered on top of whichever body is active when a record completes. BottomNav renders under every state.

`serverBusRouteSnap.test.ts` needs no change: it uses self-contained inline fixtures (its `stop-koaru-bluepin`/`stop-central` literals are local to the test and do not import `mockDomain`).
