# Map Home Design

## Goal

Implement the first Dairuri Expo React Native screen: a map-first home screen with search, category filters, a draggable-looking bottom sheet, recruitment cards, a location action, and a bottom navigation bar.

## Scope

This first pass builds only the home map UI. It does not implement authentication, real post CRUD, chat, or route search. The screen uses static fixture data so the layout can be visually matched against the Figma screenshot before wiring backend behavior.

## Architecture

- `App.tsx` renders `MapScreen`.
- `screens/MapScreen.tsx` composes the home screen from small UI components.
- `components/` contains reusable chips, cards, bottom nav, and map preview pieces.
- `constants/` contains colors, spacing, and typography tokens derived from the provided Figma/Tailwind values.
- `data/mapHome.ts` owns fixture categories, filters, nav items, and cards.

## Map Behavior

The web preview uses a code-rendered map surface that approximates the provided Naver map screenshot with pale streets, route lines, and markers. Native builds can later replace this surface with `@mj-studio/react-native-naver-map`; the app config stores the Naver SDK key from `NAVER_MAP_NCP_KEY_ID`.

## Visual Requirements

- Baseline frame: iPhone 13 style 390 x 844.
- Background: map occupies the top area.
- Search bar: white rounded capsule near the top.
- Category chips: ride, work, bus below search.
- Bottom sheet: starts around the lower half, rounded top corners, gray body, white filter strip, handle.
- List header: total count and sort chip.
- Recruitment card: white rounded card with author, title, schedule, type, duration, origin, and timestamp.
- Bottom navigation: five items, map selected.

## Testing

Use focused tests for static data and render smoke coverage. Use TypeScript checking and Expo web preview for browser verification.
