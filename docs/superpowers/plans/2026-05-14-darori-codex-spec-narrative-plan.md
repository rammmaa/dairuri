# Darori Codex Spec Narrative Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` only after this narrative plan has been broken into task checklists. This file is the prose handoff extracted from the imported zip and Markdown spec.

**Goal:** Explain the imported Darori frontend spec in one readable implementation document, so a developer can understand the product surface, screen flows, shared UI rules, current repo status, and recommended build order without reopening the zip.

**Architecture:** The app is an Expo React Native TypeScript mobile app. The spec expects UI to be implemented as real React Native components, with only actual assets such as map images, profile images, vehicle photos, and icons treated as images. Until a backend exists, the app should run from typed mock data and mock service functions, so later API replacement does not require rewriting screens.

**Tech Stack:** Expo, React Native, TypeScript, React state or lightweight store, StyleSheet, Noto Sans, lucide-react-native, Naver Map SDK or a stable placeholder map during MVP.

---

## Reference Package

The downloaded zip has been imported into the repository as `docs/reference/darori_codex_spec.zip` and extracted into `docs/reference/darori_codex_spec/`. The canonical implementation spec is `docs/reference/darori_codex_spec/DARORI_FRONTEND_CODEX_SPEC.md`. The separate Markdown file from Downloads matched the zip-internal Markdown byte-for-byte, so the extracted Markdown should be treated as the single source of truth.

The extracted image folder contains the full Figma overview plus one visual reference per major app area. The implementation should keep these images as visual references, not as full-screen app backgrounds. The relevant reference files are `images/00_figma_overview.png`, `images/01_map_home.png`, `images/02_bus_archiving.png`, `images/03_create_post.png`, `images/04_application_flows.png`, `images/05_approval_flows.png`, `images/06_chat.png`, `images/07_profile.png`, and `images/08_signup.png`.

The most important product rule in the spec is that the app should not be built by placing exported screenshots into the UI. Buttons, cards, inputs, modals, bottom sheets, tabs, labels, and layout should be actual React Native components. The exported Figma images are for comparison and polish. The screen size baseline is iPhone 13/14, using a design frame of 390 by 844, while still avoiding brittle absolute positioning except where overlays naturally require it, such as map markers, floating buttons, bottom sheets, and modals.

## Product Shape

Darori is organized around five bottom tabs: home map, bus, recruitment creation/listing, chat, and profile. The center recruitment tab is treated as the main creation action and can be visually emphasized with a plus icon or stronger affordance. The core MVP is not a marketing site; the first real app surface is the map home screen with nearby recruitment posts and navigation controls.

The complete app surface in the spec covers signup, map home, bus archive, recruitment creation, recruitment detail, application submission, application approval/rejection, chat, reporting, profile, profile edit, settings, and saved or user-owned post lists. Some areas have complete Figma flows, while bus archive is explicitly under-specified and can be implemented as a clean empty or coming-soon state until a fuller bus product definition exists.

The recommended route structure in the spec uses Expo Router, with `auth`, tab routes, `posts`, `apply`, `approval`, `chat`, and `profile` route groups. The current repository is screen-state driven rather than Expo Router driven, so the immediate implementation should preserve the existing `App.tsx` state router and screen files. If the project later moves to Expo Router, the screen components should already be split cleanly enough to be imported by thin route files.

## Design System

The visual language is simple, rounded, and utilitarian. Mint is the main brand/action color, yellow is used for job/work or secondary emphasis, red is reserved for danger or rejection, and neutral grays provide input backgrounds, borders, disabled states, and muted text. The spec proposes semantic colors such as primary, primaryDark, primaryLight, yellow, yellowDark, yellowLight, danger, text, textSub, textMuted, textDisabled, white, screenBg, inputBg, cardBg, line, and dim.

Spacing should be tokenized around small increments: 4, 8, 12, 16, 20, and 24. Screens generally use 20px horizontal padding. Card radii are mostly 12 to 16, larger modal and bottom sheet radii are around 16 to 20, and pill chips use a full round radius. Inputs are generally 48 to 64 high depending on the source frame, while fixed bottom CTAs should be around 52 high with safe-area padding.

Typography should be Noto Sans throughout. The user explicitly called out mixed fonts earlier, so Inter or default system font usage should be removed when a screen is touched. The spec's type scale is compact: 24px hero or page titles, 20px section titles, 18px title text, 16px subtitle or input text, 14px body, 12px caption, and 10px tiny labels. The existing repo already loads Noto Sans weights and should continue using the shared `constants/typography.ts` helper rather than one-off font strings.

The shared components expected by the spec are a back/header component, bottom tab bar, app button, text input, text area, modal, bottom sheet, step progress bar, checkbox row, select chip, post preview card, post detail footer, chat header, message composer, profile summary card, and temperature card. The current repo has some equivalents already, including `BottomNav`, `FilterChip`, `MapPreview`, `RecruitmentCard`, and `CurrentLocationIcon`, but it still needs more common modal/form/detail components before the remaining flows are efficient to build.

## Data Model And Mock Layer

The spec wants typed domain data rather than anonymous UI arrays scattered across screens. The core types are user profiles, vehicle info, posts, applications, chat rooms, chat messages, map markers, and route options.

Profiles contain nickname, real name, phone, email, avatar, area, manner temperature, driver type, and optional vehicle info. Vehicle info contains plate number, model name, and images. Posts are split into carpool and job variants. Both share base fields such as id, type, title, body, author, images, liked state, status, and created time. Carpool posts add departure, destination, weekdays, start/end time, price, and seats. Job posts add place name, address, weekdays, work time, wage type, wage amount, and category.

Applications connect a post to an applicant and include an intro, status, created time, and optional rejection reason. Chat rooms contain a title, participants, optional linked post, last message, and unread count. Chat messages can be text, system, or post-card messages. Map markers can represent jobs, carpools, places, or current location, and route options contain coordinates and route colors.

The spec recommends a mock service layer before backend integration. Screens should call functions like `getPosts`, `getPost`, `createPost`, `toggleLike`, `applyToPost`, `acceptApplication`, `rejectApplication`, `getChatRooms`, `getChatMessages`, and `sendMessage`. The important architectural point is that screens should not directly mutate raw fixture arrays. A thin service layer gives the app a stable future path to real APIs.

## Current Repository Status

The repository already has a basic Expo React Native TypeScript app with screen-state routing in `App.tsx`. It starts on the map screen outside tests and on auth during tests. Fonts are loaded with `@expo-google-fonts/noto-sans`.

Implemented baseline screens include `screens/auth/AuthScreen.tsx`, `screens/MapScreen.tsx`, `screens/RouteScreen.tsx`, `screens/CreateRecruitmentScreen.tsx`, `screens/ChatScreen.tsx`, and `screens/MyPageScreen.tsx`. These cover login/signup basics, map home, a bus tab, recruitment creation, chat list, and profile home. The current app also has reusable components in `components/`, design constants in `constants/`, map home fixtures in `data/mapHome.ts`, and tests for auth, tabs, map home, recruitment creation, data, and typography.

The current implementation should be treated as a useful MVP skeleton, not a complete match to the imported spec. The largest gaps are post detail, application submit modals, application review and approval/rejection, chat room and reporting, profile edit/settings, a proper mock service layer, and image-by-image visual polish against the imported Figma references.

## Map Home

The map home screen is the default app entry after authentication. It places a map or map placeholder as the main background and overlays a search bar, category filter chips, a current location marker, recruitment markers, route polylines where needed, a current location floating button, and optional route or people controls. At the bottom, a post panel floats above the bottom tab bar and shows recruitment preview cards.

The interaction model is straightforward. Pressing the search bar should either open a search screen or activate a search mode. Pressing a chip changes the selected category and filters markers/cards. Pressing a marker selects a post and opens or updates the bottom post panel. Pressing a card navigates to the post detail screen. Pressing the current location button recenters the map. Pressing a route button selects or emphasizes the relevant polyline.

The spec defines map states such as default, nearby, route preview, and route select. Default shows the map and nearby recruitment markers. Nearby shows a surrounding radius or local area. Route preview shows one or more paths. Route select shows numbered circular route buttons from 1 to 6. The current `MapScreen` already has the search bar, category row, location button, draggable bottom sheet, selected departure chip, cards, and bottom nav; the next map work is card-to-detail navigation, route select mode, and pixel polish against `images/01_map_home.png`.

## Bus Archive

The bus archive reference is intentionally sparse. The spec says this can be a coming-soon or empty state for MVP. The screen should have a safe area, header title such as `버스 아카이빙`, a centered bus icon or illustration, a primary empty-state message saying the feature is being prepared, and supporting text explaining that route and stop information will be added later.

The current repo has `RouteScreen.tsx`, which is more developed than the spec's minimum empty state. It includes route search, filters, summary, and route cards. This is acceptable as a product-enhanced MVP, but it should still be polished against `images/02_bus_archiving.png` and checked for whether the intended tab is bus archive, bus route lookup, or both.

## Recruitment Creation

Recruitment creation begins with choosing the post type: regular riding/carpool or job/work. Carpool uses the mint theme and job uses the yellow theme. The type selection screen should not allow the user to continue until a type is selected.

For carpool, the flow is five steps. The first step collects departure and destination. The second step collects weekdays and departure time, with optional end time. The third step collects title and optional ride type. The fourth step collects the body and required agreement checkboxes. The fifth step shows a summary and submits the recruitment. On submit, a mock post is created, a chat room can be created, and the user should be moved into the relevant chat room or chat tab.

For job, the flow is four steps. The first step collects work place or partner category. The second step collects weekdays, wage type, time range, and wage amount. The third step collects the body and required agreements. The fourth step shows a summary and submits. Yellow styling should consistently identify this branch.

The current `CreateRecruitmentScreen.tsx` already implements a substantial branched flow with ride/work state, place fallback candidates, schedule fields, detail fields, agreements, validation, and completion. The next work is to compare it closely with `images/03_create_post.png`, split any overly large pieces if maintenance becomes difficult, align copy and step counts with the spec, and route final submission to the chat room behavior expected by the event matrix.

## Post Detail And Apply Flow

Post detail is the first major missing flow. It must support both job and carpool posts with a shared layout and type-specific metadata. The screen has a header with back, a type title such as `알바` or `정기 라이딩`, and right-side share/heart actions. The body scrolls through a hero image, author row, title, metadata list, and description. A fixed footer contains a heart button and a main `지원하기` action.

For job posts, the metadata should include work place, hourly wage, work time, and category. For carpool posts, it should include departure, destination, departure time, cost, and seats or recruitment count. The author area should show nickname, profile affordance, and manner temperature where available. The spec references example content such as a school or academy job and a carpool/vehicle photo detail.

The apply flow starts when the user presses `지원하기`. It is a three-step modal flow above a dim overlay. Step one asks for a self introduction and should require at least 10 trimmed characters before enabling next. Step two asks for required terms agreement and should require service, privacy, and third-party agreements. Step three confirms application completion and closes the modal or moves the user to chat depending on the final product decision.

This should be implemented with `PostDetailScreen`, `ApplyFlowModal`, reusable footer/button/modal components, and pressable `RecruitmentCard` integration from both map and archive contexts. Tests should verify that card press opens detail, support opens step one, validation disables progression, agreements unlock completion, and completion state appears.

## Application Review, Approval, And Rejection

The approval flow is for the recruitment author reviewing an applicant. The screen shows the applicant profile row, phone or contact information, and the applicant's intro in a read-only text area/card. The footer exposes approval and rejection actions. The spec distinguishes between a simple job approval style and a carpool flow with explicit approve and reject modals.

Approval should open a center modal with a check icon and `승인 완료` copy. Rejection should open a form modal asking for a rejection reason, then a final completion modal such as `매칭 신청 반려`. The reason should be captured before the rejected state. The mock service layer should expose `acceptApplication` and `rejectApplication` so this flow is not embedded as screen-only state.

The current repo does not have this area yet. It should be added as `ApplicationReviewScreen` and a small decision modal component, backed by mock application data. Tests should cover both approve and reject paths.

## Chat

The imported chat spec is broader than the current chat list. It includes the chat room itself, a more bottom sheet, a leave-room confirmation modal, a report screen, and a block confirmation modal.

The chat room screen has a header with back, room title, subtitle, phone icon, and more icon. The message area uses a list with date dividers, system messages, other-user bubbles, and my bubbles. The composer has a plus icon, input placeholder, and send icon. Sending a non-empty message should append a new local message and clear the input.

The more bottom sheet includes actions such as manner review, report, contact or car number lookup, invite known user, search, notification toggle, and leave room. Report should navigate to the report screen. Leave room should open a confirmation modal explaining that chat history will be deleted and cannot be recovered. Report screen lists selectable reasons such as illegal transaction, suspected fraud, fake item suspicion, photo misuse, incorrect brand information, and abusive behavior. A selected reason can submit, then return to chat or show confirmation.

The current `ChatScreen.tsx` is only the chat room list. The next implementation should make list rows pressable, add `ChatRoomScreen`, `ChatMoreBottomSheet`, `ReportScreen`, and confirm modals. This flow should be tested by opening a room, opening more actions, submitting a report reason, sending a message, and opening leave confirmation.

## Profile, Edit, Saved Lists, And Settings

Profile home should show a profile summary card, avatar, nickname, location or phone copy, edit affordance, manner temperature, and menu list. The spec menu includes notices, settings, FAQ, app information, and terms/policy. The manner temperature card should have a progress track and a highlighted value, with mint or yellow emphasis.

Profile edit should have a header, large centered avatar, edit icon over the avatar, nickname input, driver/non-driver selector, and a footer save button. Pressing the avatar edit icon opens a profile image bottom sheet with actions to remove the current profile, open camera, or open photo library.

Settings should include phone number, email, vehicle information, account information, password change, account deletion, and logout. Logout and account deletion should be confirmed rather than immediately executed. Saved posts and user-owned posts can reuse the recruitment card/list pattern if those menu rows are exposed.

The current `MyPageScreen.tsx` covers only profile home basics. It needs navigation from profile menu rows to edit, settings, saved posts, and my posts. It also needs the image bottom sheet and settings confirmation flows.

## Signup And Auth

Signup collects base information, email duplicate check, password, password confirmation, and driver type. Driver selection should open the camera permission flow and later collect license and vehicle information. Non-driver selection skips driver-only fields.

The spec notes that the screenshot label `성함` has a phone-number-looking placeholder, so implementation should either preserve the visual reference or clarify name/phone fields in product copy. Validation should require name, email format, duplicate check, password length of at least 8, matching password confirmation, selected driver type, and driver-only fields when the selected type is driver.

The camera permission modal is a center modal with dim overlay, camera icon, `카메라 액세스` title, explanatory copy, and allow/deny buttons. Allow opens the license upload/camera screen. Deny closes the modal or falls back to manual driver info depending on product decision. License upload shows a header, instruction text, dashed rectangle upload area, reflection/lighting hint, and manual information entry link. Driver vehicle fields include license info, plate number, and horizontal vehicle image thumbnails.

The current `AuthScreen.tsx` already includes login, signup form, role selection, camera access modal, license guide, manual link, and driver details. It should be polished against `images/08_signup.png`, with attention to Noto Sans usage, modal geometry, scroll behavior, vehicle thumbnail treatment, and validation completeness.

## Event And Navigation Matrix

The expected app navigation can be summarized as a set of user-triggered transitions. Home search opens search or a placeholder. Home recruitment card opens post detail. The recruitment tab opens type selection or the existing create flow. The final create step creates a post and goes to chat. Post detail toggles likes and opens the apply modal. Apply modal moves through intro, terms, and completion. Approval screen opens approve or reject modals. Chat room sends messages, opens more sheet, opens report, and opens leave confirmation. Profile edit and settings are reached from profile home. Signup duplicate check sets an email-checked state, driver selection opens camera permission, and completed signup goes to home.

Because the current repo has no full navigation library, this can initially be handled by explicit screen state in `App.tsx`. The key is to avoid making tab screens aware of each other's internals. They should emit intent callbacks such as `onOpenPost`, `onOpenChatRoom`, `onOpenSettings`, or `onComplete`, and `App.tsx` should decide the displayed screen.

## Recommended Implementation Order

The first implementation layer should normalize the design tokens, shared components, domain types, and mock services. This makes the later screens consistent and reduces repeated styling. It should include `AppButton`, `Header`, `TextInputField`, `TextAreaField`, `BottomSheet`, `ConfirmModal`, `StepProgressBar`, `CheckBoxRow`, and enough domain mock data for posts, applications, chat rooms, messages, and profile.

The second layer should wire navigation/state from current cards and menu rows into detail screens. In practice, that means making recruitment cards pressable, adding `PostDetailScreen`, adding `ApplyFlowModal`, and confirming map/archive cards can open the same detail screen.

The third layer should implement application review and decision states. This is mostly isolated from the rest of the app and can be tested independently once applications exist in mock data.

The fourth layer should deepen chat from a list into a complete room/report/leave flow. This is also a clean task boundary because it touches `ChatScreen`, new chat screens, shared sheets/modals, and chat fixtures.

The fifth layer should complete profile surfaces: profile edit, avatar image sheet, settings, saved posts, and my posts. This can reuse existing cards and shared form components.

The sixth layer should polish signup/auth and the already implemented create flow against the reference images. These screens already exist, so the work should be careful visual and validation alignment rather than broad restructuring.

The final layer should run a screenshot comparison pass at 390 by 844 for every imported reference image. The pass should focus on safe area, header height, horizontal padding, button/input height, font size/weight, card radius, bottom tab height, modal positioning, and text clipping. Full-screen absolute layout should still be avoided; the desired approach is flex layout with stable headers, footers, panels, and only natural overlays positioned absolutely.

## File-Level Direction

`App.tsx` should remain the temporary route orchestrator until the project intentionally adopts Expo Router. It should own top-level state for auth, active tab, selected post, selected chat room, profile sub-screen, report screen, and application review screen. Tab screens should receive callbacks, not import top-level navigation state.

`data/mapHome.ts` should either be expanded or split into a broader `data/mockDomain.ts` file. The project needs typed fixtures for `UserProfile`, `Post`, `Application`, `ChatRoom`, `ChatMessage`, `MapMarkerItem`, and `RouteOption`. A separate `services/mockApi.ts` should expose async functions with small delays, so screen code already resembles real API use.

Existing components should stay where they are unless a split clearly improves maintenance. `BottomNav`, `FilterChip`, `MapPreview`, `RecruitmentCard`, and `CurrentLocationIcon` are already useful. New shared components should be added incrementally: button, header, modal, bottom sheet, text input, text area, checkbox row, and progress bar.

New screens should be grouped by feature folder if the codebase accepts folders under `screens/`: `screens/post`, `screens/chat`, and `screens/profile`. This avoids adding many flat files and matches the spec's feature grouping. The current auth file is large but acceptable for now; if further signup work makes it harder to maintain, it can be split into `LoginScreen`, `SignupFormScreen`, `LicenseCameraScreen`, and `DriverDetailsScreen`.

Tests should stay focused on behavior. The current tests already cover broad render and flow smoke checks. New tests should verify each flow transition rather than exact styling. Screenshot comparisons can be manual or browser/simulator-based during polish, but unit tests should assert text, disabled states, callbacks, and modal/route transitions.

## QA And Verification

Every implementation batch should run `npm test`, `npm run typecheck`, and `npx expo-doctor`. For UI work, the app should also be opened at a 390 by 844 viewport or simulator size and visually compared with the corresponding imported reference image.

The common QA rules are that TypeScript must pass, safe areas must not be broken, bottom buttons must not overlap the home indicator, long text must not overflow card boundaries, keyboard usage must not hide the active input or bottom action, and modal dim overlays must cover the whole screen.

Home QA requires search, filters, bottom card, active category state, card-to-detail navigation, and route buttons. Create flow QA requires disabled next before required input, mint/yellow theme separation, step validation, and final transition to chat. Detail/apply QA requires different metadata for job versus carpool, like toggling, and the intro-to-terms-to-completion modal sequence. Chat QA requires message sending, more sheet, leave confirmation, and report navigation. Profile/signup QA requires profile edit/settings navigation, image bottom sheet, signup validation, and camera modal on driver selection.

## Remaining Product Decisions

The spec leaves a few decisions open. Bus archive needs a real product definition beyond empty state. The exact map SDK behavior and Naver integration depth need to be confirmed. Login, phone verification, email verification, license scanning, and vehicle validation are placeholders until backend/product decisions exist. The app also needs a decision on whether apply completion creates or opens a chat room automatically, and whether approval completion should move the author to chat.

These should not block MVP UI implementation. The recommended approach is to build deterministic mock behavior now, keep it behind service functions, and replace the implementation later when real backend contracts are available.

## Immediate Next Step

The next concrete coding step should be post detail plus apply flow. It is the most important missing piece connecting the already implemented map/archive cards to a real user action. It also creates reusable modal, footer, and post metadata components that will help approval, saved posts, and profile screens later.
