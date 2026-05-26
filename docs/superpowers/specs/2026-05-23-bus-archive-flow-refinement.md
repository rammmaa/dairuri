# Happy Bus Archive Flow Refinement

## Goal

Align the Happy Bus archive feature with the Figma flow the user shared on
2026-05-23. The first iteration (commits `446da7a` through `762e114`) shipped
a simplified recorder where the user picks a route chip before pressing the
big bus button. The Figma flow expects the inverse interaction: the system
infers the nearest stop from the live location, the user confirms or rejects
it, and only the rejection branch asks the user to pick a route and a stop
manually. This refinement adopts the Figma "infer then confirm" pattern for
the happy path and defers the rejection branch to a follow-up.

## Scope

### Phase 1 (this iteration, in scope)

- Replace the D-01/D-03/D-05 mock route fixtures with Happy Bus routes
  "행복버스 1호선" through "행복버스 6호선" so the prototype matches the
  Figma copy and pager. Stop coordinates remain placeholders. All six routes
  share a single mint-family color; numeric identity (1 through 6) carries
  the distinction, not hue.
- Replace the eight placeholder stop names with the six stop names the user
  confirmed from the Figma frame on 2026-05-26: 청도 코아루블루핀,
  청도군청, 청도 버스 터미널, 성조 아파트 앞, 부민 아파트, 어린이집.
- Add a 1-to-6 pager strip across the top of the BusSightingScreen.
- Restructure BusSightingScreen into a three-state flow:
  1. **Recorder** (live clock, current-stop chip, big bus button)
  2. **Confirmation** ("이 정류장이 맞나요?" with a small map preview, route
     code, stop name, and 맞아요 / 틀려요 buttons)
  3. **Confirmed** ("확정이 되었습니다 :)" message + recent record)
- Implement the full rejection branch reached by "틀려요":
  4. **Route grid** ("기록을 원하시는 호선을 골라주세요" with the six route
     tiles)
  5. **Stop selection** ("해당 노선에서 정류장을 선택해주세요" with a small
     route map + stop list + a "확정" button that activates when a stop is
     picked)
  6. **Confirmed** (same screen as state 3, reusing the confirmation visual)
- Replace the static `routeCards` in RouteScreen with six Happy Bus rows so
  the per-route last-sighting badge keeps matching by route code.
- Add stub entry points for Phase 2 features so the user can discover that
  they exist without rendering an empty screen:
  - Header `(i)` icon on BusSightingScreen and the bus-archive entry.
  - "버스 도착 시간 기록 보기" row on the bus-archive landing.
  - "아카이빙 보기" entry. Each stub renders a Coming Soon message with a
    one-line description of what the screen will do, then routes back. The
    real implementations land in Phase 2.

### Phase 2 (deferred to a later spec, design pending)

- Per-route map / direction info screen reached via the header `(i)` icon.
  Figma carries a note ("각 노선별 지도가 뜨도록 / 방향, 노선") but no
  concrete frame yet.
- Archive history screen reached from the route grid. The Figma flow stops
  at the grid; tapping a route in archive mode currently has no destination.
- "버스 도착 시간 기록 보기" target screen. Figma shows the entry point on
  the bus-archive landing but the destination is not designed.
- Real Cheongdo-gun Happy Bus operator data; stop coordinates stay
  placeholders until a field survey provides real values.

## Decisions

1. **Six Happy Bus routes** ("행복버스 1호선" through "행복버스 6호선"). Six
   mirrors the Figma pager; the user confirmed on 2026-05-23 that six is a
   placeholder, not a verified count of the real Cheongdo Happy Bus fleet.
   Route IDs become `route-happy-1` through `route-happy-6` and the `code`
   column stores `H1` through `H6` so `BusRoute.code` stays short.
2. **Single mint-family color across all six routes** per the user choice on
   2026-05-26. All routes share `colors.mintDark` so visual identity comes
   from the numeric pager (1 through 6), not hue. This keeps the bus tab
   visually calm and avoids inventing a six-color palette before the
   designer commits to one.
3. **Six stop fixtures named from the Figma frame**, supplied by the user on
   2026-05-26: 청도 코아루블루핀, 청도군청, 청도 버스 터미널, 성조 아파트
   앞, 부민 아파트, 어린이집. Coordinates remain placeholders anchored
   around (35.65 N, 128.73 E). Each of the six routes visits three to four
   stops chosen so the snap helper has a non-trivial geometry to operate on.
4. **Pager** is a thin top strip rendered above the headline. It shows the
   six numbered chips and highlights the chip that matches the currently
   inferred or chosen route. While no route is in play yet (Recorder state
   before the bus button is pressed) the pager renders muted so it does not
   imply a state we do not have. The pager is one component reused across
   all six screen states so the header does not jump on transition.
5. **System-inferred route**. With Figma's "infer then confirm" pattern the
   client picks the route to attribute the sighting to, not the user. The
   inference rule, exported as `inferRouteAndStop` from
   `services/busArchiveCore.ts`, picks the (route, stop) pair whose stop is
   nearest to the reporter coordinate. Ties (a junction stop served by
   multiple routes) are broken by ascending `route.code` so the result is
   deterministic and easy to test. Production can swap in a smarter
   heuristic (most recent sighting, schedule context, and so on) without
   changing the API.
6. **Confirmation as a state, not a screen.** The confirmation step is a
   state of the same BusSightingScreen rather than a new pushed screen, so
   the live clock keeps ticking and the location watcher does not have to
   remount. The server `recordBusSighting` call only fires on "맞아요".
7. **Rejection branch is in scope (Phase 1).** "틀려요" pushes into the
   route-grid state, then into the stop-selection state, then into a final
   confirmed state. None of the rejection states call
   `recordBusSighting` until the user taps the final "확정" button on the
   stop-selection screen. The rejection flow lives inside the same
   BusSightingScreen component as additional state-machine states so the
   pager keeps rendering and the live clock keeps ticking.
8. **Phase 2 entry points are stubs** that render a Coming Soon page rather
   than being hidden. Hiding entry points would make the feature surface
   look smaller than the design promises; stubs surface the future state
   without claiming it works yet. Each stub takes one tap to dismiss and a
   one-line description tells the user what the eventual screen will do.

## Data model changes

No schema change. The migration stays `002_bus_archive`. Only seed data
moves. New seed fixture shape in `data/mockDomain.ts`:

```ts
mockBusRoutes = [
  { id: "route-happy-1", code: "H1", name: "행복버스 1호선", color: "..." },
  { id: "route-happy-2", code: "H2", name: "행복버스 2호선", color: "..." },
  ...six entries total
];
```

`server/db/seedData.ts` and `server/db/seed.ts` already consume
`mockBusRoutes` so they pick up the change automatically.

`mockBusRouteStops` is updated so each of the six routes visits four to five
stops within the existing eight stop fixtures, giving the snap helper a
nontrivial choice for the inference logic.

`mockBusSightings` (historical seed) is repointed at the new `route-happy-*`
ids so the RouteScreen badge keeps surfacing freshness without a stale
foreign key.

## API changes

None for the server. `recordBusSighting` still takes
`{ routeId, latitude, longitude }`. The new behavior is purely client-side:
the BusSightingScreen *chooses* a routeId during inference instead of
delegating to the user.

A new pure helper joins the existing `services/busArchiveCore.ts`:

```ts
export function inferRouteAndStop(
  reporter: LatLng,
  routes: BusRoute[],
  routeStops: { routeId: string; stopId: string }[],
  stops: BusStop[],
  radiusMeters?: number,
): { route: BusRoute; stop: BusStop } | null;
```

It picks the (route, stop) pair whose stop is closest to the reporter, ties
broken by ascending `route.code`. Returns null when no stop is within radius.

The mock client picks up `getBusRoutes`, `getBusStops`, and a new
`getBusRouteStops` aggregate so the inference can run client-side without an
extra server round trip. The new `getBusRouteStops` returns the same shape as
the seed `mockBusRouteStops`, scoped to whatever the client needs.

The server gets a matching `GET /bus/route-stops` route so live mode has the
data too. Repository function: `listBusRouteStops` returns
`{ routeId, stopId, sequence }` for every link. Cached by Redis with a long
TTL because route topology rarely changes.

## Screen changes

### BusSightingScreen state machine

```
[recorder]
    user taps the big bus button (only when canRecord)
        -> client runs inferRouteAndStop()
            -> if null, stay in [recorder], show "근처 정류장을 찾을 수 없어요"
            -> else, transition to [confirmation], hold the inference in
               local state (no server call yet)

[confirmation]
    shows the inferred {route, stop} with a small route map preview and a
    pager chip highlighted at the inferred route number
    user taps "맞아요"
        -> client calls recordBusSighting({
             routeId: inferred.route.id,
             latitude: userLocation.latitude,
             longitude: userLocation.longitude,
           })
        -> on success, transition to [confirmed] holding the returned
           BusSighting
        -> on failure, stay in [confirmation] with an inline error
    user taps "틀려요"
        -> transition to [route-grid], no server call yet
    user taps the back arrow
        -> return to [recorder]

[route-grid]
    shows the six route tiles ("기록을 원하시는 호선을 골라주세요")
    user taps a route tile
        -> set chosenRouteId, transition to [stop-selection]
    user taps the back arrow
        -> return to [confirmation]

[stop-selection]
    shows the chosen route header ("해당 노선에서 정류장을 선택해주세요"
    + "행복버스 N호선"), a small route preview, and the route's stops
    user taps a stop tile
        -> set chosenStopId, enable the bottom "확정" button
    user taps "확정"
        -> client calls recordBusSighting({
             routeId: chosenRouteId,
             latitude: userLocation.latitude,
             longitude: userLocation.longitude,
           })
            (note: server will still snap to the closest stop on that
             route; chosenStopId is currently for UX only and is not sent
             since the server is the source of truth for the snap)
        -> on success, transition to [confirmed]
    user taps the back arrow
        -> return to [route-grid]

[confirmed]
    shows "확정이 되었습니다 :)" + recent record card
    user taps "다시 기록하기"
        -> return to [recorder], clear the inferred / chosen / recorded
           state
    user taps the screen back arrow
        -> exits the screen
```

All five states share the same component, the same `useEffect`s for
location / clock / lifecycle, and the same pager strip at the top. Only the
body switches.

### Phase 2 stub entry points

Three new entry points land in Phase 1 as stubs. Each renders as a separate
sub-screen pushed by App.tsx with the existing `useState` routing pattern,
showing a Coming Soon panel and a back affordance:

- **`BusRouteInfoScreen` stub.** Reached by the header `(i)` icon. Coming
  Soon message: "노선별 지도와 방향 정보를 곧 보여드릴게요."
- **`BusArchiveHistoryScreen` stub.** Reached from the "아카이빙 보기"
  entry on the bus-archive landing. Coming Soon message: "호선별 기록
  히스토리는 곧 추가됩니다."
- **`BusArrivalTimesScreen` stub.** Reached from the "버스 도착 시간 기록
  보기" entry on the bus-archive landing. Coming Soon message: "버스
  도착 시간 기록 화면은 곧 추가됩니다."

These three are intentionally cheap (one component each, no API call, no
screen state) so the Phase 2 work can replace them in place when the
designs land.

### RouteScreen badge

No behavior change. The static `routeCards` fixture in `RouteScreen.tsx`
still uses the prototype codes ("D-01", "D-03", "N-10") because the screen
is mock data for the prototype only. The badge keeps surfacing freshness by
matching `routeCards.routeNumber` against `BusRoute.code`. Since the new
seed uses `H1`-`H6`, those static prototype cards will simply not get a
badge anymore, which is acceptable for this iteration. We will revisit
`routeCards` itself when we touch RouteScreen content.

## Files affected

| File | Change |
|---|---|
| `data/mockDomain.ts` | Replace `mockBusRoutes` (six entries), replace `mockBusStops` with the six Figma-supplied names, repoint `mockBusRouteStops` and `mockBusSightings` to new ids |
| `server/db/seedData.ts` | No edit (consumes `mockDomain` exports) |
| `server/db/seed.ts` | No edit |
| `services/busArchiveCore.ts` | Add `inferRouteAndStop` pure helper |
| `services/mockApi.ts` | Add `getBusRouteStops` mock |
| `services/liveApi.ts` | Add `getBusRouteStops` HTTP call |
| `services/api.ts` | Add `getBusRouteStops` pass-through |
| `server/api/busArchive.ts` | Add `listBusRouteStops` repo function |
| `server/api/server.ts` | Add `GET /bus/route-stops` route |
| `screens/BusSightingScreen.tsx` | Restructure into 5-state machine (recorder, confirmation, route-grid, stop-selection, confirmed) + pager strip + header `(i)` button wired to Phase 2 stub |
| `screens/BusRouteInfoScreen.tsx` (new) | Phase 2 stub for the route-info screen reached by `(i)` |
| `screens/BusArchiveHistoryScreen.tsx` (new) | Phase 2 stub for the per-route history view |
| `screens/BusArrivalTimesScreen.tsx` (new) | Phase 2 stub for "버스 도착 시간 기록 보기" |
| `screens/RouteScreen.tsx` | Replace static `routeCards` with six Happy Bus rows (H1 through H6) and add the "버스 도착 시간 기록 보기" + "아카이빙 보기" + `(i)` entry rows that push the new stub screens |
| `App.tsx` | Add the three Phase 2 stub state keys and route through to the new sub-screens |
| `__tests__/mockDomain.test.ts` | Update fixture-count assertions to six routes + six stops |
| `__tests__/mockBusSightings.test.ts` | Update route ids and stop ids in assertions |
| `__tests__/serverBusRouteSnap.test.ts` | Add `inferRouteAndStop` tests (tie-break, no-match, single-route, junction) |
| `__tests__/BusSightingScreen.test.tsx` | Cover all five states, "틀려요" advancing to the route grid, the route-grid tile picking a route, the stop-selection 확정 enabling, and the back arrow walking states in reverse |
| `__tests__/RouteScreen.test.tsx` | Cover the six new route rows and the three stub entry points |
| `__tests__/AppTabs.test.tsx` | Cover navigating into and back out of each Phase 2 stub |

## Testing

- New unit tests for `inferRouteAndStop`:
  - Single route in range -> returns it
  - Two routes through the same stop -> tie broken by route code ascending
  - No route within radius -> returns null
  - One route closer than another by a few meters -> returns the closer one
- Screen tests update to:
  - Tap big bus button -> enter [confirmation] without firing
    `recordBusSighting`
  - Tap "맞아요" -> `recordBusSighting` is called once with the inferred
    routeId and current location, then [confirmed] message renders
  - "틀려요" is rendered disabled with the "준비 중" tooltip
  - Back arrow on [confirmation] returns to [recorder]
- No new live-DB integration tests; `npm test` plus the existing
  docker-compose stack continue to be the verification surface for the
  server side.

## Risks and mitigations

- **Risk:** Pager strip looks empty when no inference is possible yet. We
  render it in muted color and the route ids are stable so the strip never
  shifts width during the flow.
- **Risk:** Inference picks an unexpected route when the reporter is exactly
  between two stops. The tie-break is deterministic (smaller `route.code`)
  and explicit in the test suite; production can swap in a smarter
  heuristic later.
- **Risk:** `getBusRouteStops` payload size grows with the network. For six
  routes and eight stops the payload is under 1 KB; we will add pagination
  only when the topology grows past a hundred links.
- **Risk:** The "틀려요 disabled" affordance frustrates users whose
  inferences are wrong. We accept this for the iteration because the only
  honest alternative is to ship the full rejection branch. The disabled
  button surfaces that the path exists.

## Open questions

- None blocking this iteration. The user has confirmed the Happy Bus 1-6
  naming is a placeholder for now.
