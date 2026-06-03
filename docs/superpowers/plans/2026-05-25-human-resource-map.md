# Human Resource Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the existing job/recruitment feature into a human-resource map where job seekers register availability, skills, and preferred work conditions so local employers or residents can discover and contact them.

**Architecture:** Keep the existing `work`/`job` technical category for a low-risk MVP, but change the product language and UI behavior from employer-authored job posts to seeker-authored resource profiles. Reuse map/archive/detail/create flows, then add focused data fields for possible tasks, availability, desired employment type, and preferred pay.

**Tech Stack:** Expo React Native, TypeScript, Jest, `@testing-library/react-native`, existing mock data/services, existing map/list/detail/create screens.

---

## Product Assumptions

- Primary user for this feature is the job seeker, especially a newcomer who lacks local ties.
- The feature is not a generic job board. It reduces access friction to local relationship networks.
- Local employers/residents discover registered people and initiate contact through the existing detail/chat flow.
- MVP remains mock/local-data first; persistence/API changes can follow after the UX is validated.

## File Structure

- `data/mapHome.ts`: rename visible category/copy from "알바" to "인력" or "인적 자원"; update map/archive fixture cards.
- `types/domain.ts`: add optional seeker-profile fields to `JobPost` while keeping `type: "job"` for compatibility.
- `data/mockDomain.ts`: replace employer-style job post fixture with seeker-authored human-resource profile fixture.
- `components/RecruitmentCard.tsx`: keep reusable card layout, adjust metadata labels for resource profiles if needed.
- `screens/CreateRecruitmentScreen.tsx`: revise the `work` branch into a resource-profile registration flow.
- `screens/post/PostDetailScreen.tsx`: display seeker profile fields and change CTA/copy from "지원하기" toward "연락하기" or "채팅하기".
- `screens/post/ApplyFlowModal.tsx`: either bypass for resource profiles or relabel as a contact-introduction flow.
- `screens/post/ApplicationReviewScreen.tsx`: update only if still reachable from profile/review demo data.
- `screens/profile/*.tsx`: update saved/my-post labels if they expose "알바" or employer-style copy.
- `readme.md`, `docs/current-architecture.md`: update product framing after code changes.
- Tests under `__tests__/`: update expectations for category labels, creation flow, detail rendering, mock integrity, and tab flows.

---

### Task 1: Lock Product Vocabulary

**Files:**
- Modify: `data/mapHome.ts`
- Modify: `__tests__/mapHomeData.test.ts`
- Modify: `readme.md`
- Modify: `docs/current-architecture.md`

- [ ] Replace user-facing category label `알바` with `인력` for map/archive chips.
- [ ] Keep internal id `work` for now to avoid touching filters, chat categories, and server contracts in the same pass.
- [ ] Update README goal from "구직/알바" to "구직자의 가능 업무를 지역 네트워크에 노출하는 인적 자원 맵".
- [ ] Update architecture docs to describe `work` as the resource-map category.
- [ ] Run `npm test -- __tests__/mapHomeData.test.ts --runInBand`.

### Task 2: Add Resource Profile Data Shape

**Files:**
- Modify: `types/domain.ts`
- Modify: `data/mockDomain.ts`
- Modify: `services/mockDb.ts`
- Modify: `__tests__/mockDomain.test.ts`
- Modify: `__tests__/mockDbIntegrity.test.ts`

- [ ] Extend `JobPost` with optional MVP fields:
  - `profileMode?: "resource"`
  - `availableTasks?: string[]`
  - `employmentTypes?: Array<"fullTime" | "partTime" | "shortTerm">`
  - `preferredPay?: string`
  - `availabilityNote?: string`
  - `contactNote?: string`
- [ ] Replace the current `job-1` fixture with a seeker-authored profile, for example:
  - title: `농촌 일손과 가게 일을 도울 수 있어요`
  - body: self-introduction and local availability
  - placeName: seeker base area, not employer workplace
  - jobCategory: `인재 풀 등록`
  - availableTasks: `["카페 보조", "농번기 일손", "아이 등하원 동행"]`
- [ ] Relax mock DB integrity checks so resource profiles do not require employer-like `placeName` semantics beyond a base area.
- [ ] Run mock domain/integrity tests.

### Task 3: Rework Create Flow Copy And Fields

**Files:**
- Modify: `screens/CreateRecruitmentScreen.tsx`
- Modify: `__tests__/RecruitmentCreationFlow.test.tsx`

- [ ] Change type-selection copy from employer recruitment to two actions:
  - ride: `라이드 모집`
  - work: `인재 풀 등록`
- [ ] Rename work step 1 from "어떤 파트너를 찾으시나요?" to "어떤 일을 할 수 있나요?"
- [ ] Replace work title placeholder `공고 제목 입력` with `나를 소개하는 제목`.
- [ ] Keep category chips for MVP, but relabel screen text as possible-task categories.
- [ ] Change work schedule step from employer work schedule to available time:
  - title: `가능한 시간대를 알려주세요.`
  - start/end placeholders can stay `시작 시간`, `종료 시간`.
  - pay placeholder remains but label becomes `희망 급여`.
- [ ] Change work details step from "업무 상세" to "가능 업무와 연락 전 참고사항".
- [ ] Change final CTA from `일자리 모집 시작하기` to `인적 자원 등록하기`.
- [ ] Update tests to follow the revised text and keep the same validation behavior.

### Task 4: Rework Map And Archive Cards

**Files:**
- Modify: `data/mapHome.ts`
- Modify: `components/RecruitmentCard.tsx`
- Modify: `__tests__/MapScreen.test.tsx`
- Modify: `__tests__/ArchiveScreen.test.tsx`

- [ ] Update `work` map fixtures so they represent people, not jobs.
- [ ] Use card metadata like:
  - purpose: `가능 업무`
  - originLabel: `활동 가능 지역`
  - originName: `다로리 카페 인근`
- [ ] Keep list filtering/pagination behavior unchanged.
- [ ] Update map/archive tests to expect the new labels and counts.
- [ ] Check that the bus archive panel behavior remains unchanged.

### Task 5: Rework Detail And Contact Flow

**Files:**
- Modify: `screens/post/PostDetailScreen.tsx`
- Modify: `screens/post/ApplyFlowModal.tsx`
- Modify: `__tests__/PostDetailFlow.test.tsx`

- [ ] For `post.type === "job"` and `profileMode === "resource"`, render detail title as `인적 자원`.
- [ ] Replace metadata labels:
  - `일하는 장소` -> `활동 가능 지역`
  - `시급` -> `희망 급여`
  - `근무시간` -> `가능 시간`
  - `카테고리` -> `가능 업무`
- [ ] Replace CTA `지원하기` with `연락하기`.
- [ ] Keep the existing modal as a contact-introduction flow for MVP:
  - intro step title: `연락 내용을 작성해주세요`
  - completion title: `연락 요청 완료`
- [ ] Update tests for detail rendering and contact completion.

### Task 6: Update Profile, Chat, And Review Demo Copy

**Files:**
- Modify: `screens/ChatScreen.tsx`
- Modify: `screens/profile/SavedPostsScreen.tsx`
- Modify: `screens/profile/MyPostsScreen.tsx`
- Modify: `screens/post/ApplicationReviewScreen.tsx`
- Modify: matching tests under `__tests__/`

- [ ] Change visible filter/badge labels from `알바` to `인력` where the data represents resource profiles.
- [ ] Keep chat category id `work` for now.
- [ ] If an application review is still shown for the resource profile fixture, relabel it as contact review rather than employer approval.
- [ ] Update tests that assert old `알바` strings.

### Task 7: Full Verification

**Files:**
- No planned code changes unless verification exposes issues.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `git diff --check`.
- [ ] Manually inspect the main happy paths:
  - map category chip shows resource profiles.
  - archive filters still work.
  - resource profile creation reaches final review.
  - resource detail opens contact/chat flow.
- [ ] Document any intentional non-MVP gaps:
  - no real employer account flow.
  - no persistent resource-profile API yet.
  - no privacy controls beyond existing mock consent UI.

---

## Suggested Commit Slices

1. `docs: plan human resource map pivot`
2. `feat: reframe work category as resource map`
3. `feat: add resource profile fixture fields`
4. `feat: update resource registration flow`
5. `feat: update resource detail contact flow`
6. `docs: describe human resource map positioning`

## Self-Review

- Scope is intentionally MVP-sized: it reuses `work`/`job` internally and changes behavior/copy/data first.
- The plan avoids introducing a new backend schema until the UX direction is validated.
- The main ambiguity is the final public label. This plan uses `인적 자원` in detail/docs and `인력` where short chip labels are needed.
