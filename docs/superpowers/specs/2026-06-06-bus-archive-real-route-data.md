# Bus Archive: real Cheongdo Happy Bus route data + map

## Goal

Replace the placeholder six-stop bus fixtures with the real Cheongdo Happy Bus
routes 1-6 (names, stop sequences, schedules), show the route + recording stop
on a real map in the confirmation screen, surface the real schedule on the
arrival-times screen, and add the route-info screen. Source data: the user's
transcription of https://namu.wiki/w/청도군%20행복버스 (2026-06-06).

## Coordinates

The source data has stop names + schedules but no coordinates. Anchor towns and
terminals are geocoded from OpenStreetMap Nominatim (no key required); the small
rural stops between anchors are interpolated along the route. Anchors are
therefore real geography; intermediate stops are approximate but plausible.

Geocoded anchors (Nominatim, 2026-06-06):
- 청도공용버스터미널 / 청도읍: 35.6413, 128.7464
- 화양읍 범곡리: 35.6346, 128.7314
- 화양읍 신봉리: 35.6312, 128.7015
- 금천면 동곡리 (동곡터미널): 35.6993, 128.8823
- 운문면 대천리: 35.7281, 128.9205
- 운문사 (삼계 인접): 35.6611, 128.9603
- 청도읍 송읍 (안송읍): ~35.662, 128.758 (approx; Nominatim had no hit)

## Routes (from the source data)

All routes: 운수사 청도버스, 1일 3회. Display name "행복버스 N번", code H1-H6.

- **H1** loop near 청도읍: 청도공용버스터미널 - 구미리 - 아랫구미 - 월곡2리(박월) - 귀뚜라미보일러 - 농공단지 입구 - 월곡1리 마을회관 - 다정다감 - 대안아파트 (loops back to terminal). 출발 첫차 07:50 / 막차 16:50.
- **H2** 청도읍 -> 화양 범곡: 청도공용버스터미널 - 성조아파트 - 부민아파트 - 청도군청 뒤 - 코아루아파트 - 범곡휴먼시아아파트 - 범곡1리복지회관. 첫차 08:30 / 막차 18:00.
- **H3** 청도읍 -> 화양 신봉리: 청도공용버스터미널 - 청도시장 - 축협 - 성조아파트 - 부민아파트 - 청도군청 뒤 - 코아루아파트 - 범곡휴먼시아아파트 - 범곡사거리 - 청도공설운동장 - 동천리 - 청도읍성 - 화양파출소 - 서상슈퍼 - 신봉리(새터) - 청석골농장 - 신봉리(홍도). 첫차 06:50 / 막차 15:30.
- **H4** 청도읍 -> 금천 동곡: 청도공용버스터미널 - 곰티재 - 상평 - 돈치재터널 - 김전리 - 사전리 - 동곡공용버스터미널. 첫차 07:20 / 막차 16:30.
- **H5** 동곡 -> 운문 삼계: 동곡공용버스터미널 - 대천공용여객자동차터미널 - 오진 - 소진 - 통점 - 삼계. 첫차 08:10 / 막차 17:20.
- **H6** 청도읍 -> 송읍: 청도공용버스터미널 - 청도시장 - 강변도로 - 청도읍사무소 - 신기교 - 안송읍. 첫차 06:50 / 막차 15:40.

Shared stops (one id, reused across routes): 청도공용버스터미널 (H1/2/3/4/6), 청도시장 (H3/H6), 성조아파트·부민아파트·청도군청 뒤·코아루아파트·범곡휴먼시아아파트 (H2/H3), 동곡공용버스터미널 (H4/H5).

## Schedule model

Each route has 첫차/막차 and runs 3 times/day. `data/busArrivalTimes.ts` becomes a
real per-route timetable: 3 departure times between 첫차 and 막차, offset per stop
index along the route so later stops read a few minutes later. Weekday selector
stays UI-only for now (same timetable every weekday) since the source has no
per-weekday variation.

## Phasing

1. **Data** (`data/mockDomain.ts`, `data/busArrivalTimes.ts`): real routes,
   stops + anchored/interpolated coordinates, route-stops, repointed sightings,
   real schedule. Update the data/seed/snap tests.
2. **Confirmation map**: render the route polyline + the recording stop on a
   real Naver map (`NaverMapSurface`) instead of the SVG `RouteMapPreview`.
   NOTE: web needs `EXPO_PUBLIC_NAVER_MAP_WEB_NCP_KEY_ID`; without it the web
   build falls back to the styled placeholder surface.
3. **Arrival-times**: real per-route timetable.
4. **Route-info screen** (`BusRouteInfoScreen`): real screen from the 2026-06-06
   frames - all routes on a map, swipeable route diagrams, scrollable 1-6
   schedule tables. Replaces the ComingSoon stub.
5. **Selection refine** per the frames (already merged grid+rail; refine visuals).
6. **Tests**: realign every bus test to the new fixtures.

## Open notes

- Naver web map tiles require the web NCP key in `.env` (currently empty).
- Intermediate stop coordinates are interpolated, not surveyed.
- H1/H3 etc. list the terminal at both ends in the source; the fixture lists each
  unique stop once (the loop is descriptive, not a duplicated stop row).
