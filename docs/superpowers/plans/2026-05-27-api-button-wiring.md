# API Button Wiring Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make user-facing buttons either call the correct live API and handle the result, or present an explicit non-action state instead of behaving like a working control.

**Architecture:** Keep API behavior in `services/*` and `server/api/*`; keep screen components responsible for loading/submitting/error UI only. Fix correctness bugs first, then convert dead buttons into explicit disabled or Coming Soon surfaces where no product contract exists.

**Tech Stack:** React Native + Expo, TypeScript, Jest with `@testing-library/react-native`, Node HTTP API, PostgreSQL repository layer.

---

## File Structure

- Modify `services/apiClient.ts`: preserve HTTP status in a typed API error.
- Modify `services/liveApi.ts`: align `getPost`, `toggleLike`, `submitReport`, and new chat leave function with server contracts.
- Modify `services/api.ts`: export the adjusted service functions.
- Modify `services/mockApi.ts`: keep mock/live behavior aligned for report, application review, and chat leave.
- Modify `types/domain.ts`: add a report response type and carpool tag field.
- Modify `server/api/handler.ts`: add chat leave route and keep report response explicit.
- Modify `server/api/repository.ts`: add chat leave repository function and persist carpool `rideTag`.
- Modify `server/db/schema.sql`: add `posts.ride_tag`.
- Create `server/db/migrations/007_carpool_ride_tag.sql`: migrate existing databases.
- Modify `screens/post/ApplyFlowModal.tsx`: await application submission and do not route to a fake chat room.
- Modify `screens/post/PostDetailScreen.tsx`: pass the submitted application result upward if needed and remove the dead share button state.
- Modify `screens/CreateRecruitmentScreen.tsx`: keep created post result and submit `rideTag`.
- Modify `App.tsx`: remove `room-1` hardcoding and wire map bus save into the real bus recorder.
- Modify `screens/chat/ChatRoomScreen.tsx`: use the current session user for message ownership and call the leave API.
- Modify `screens/MapScreen.tsx`: route the bus save button to `BusSightingScreen`; wire search or remove the active no-op.
- Modify `screens/auth/AuthScreen.tsx`: fix verified phone-code button and make non-working auth controls non-actionable.
- Modify `screens/profile/SettingsScreen.tsx`: clear auth session on logout.
- Modify `screens/profile/SavedPostsScreen.tsx`, `screens/profile/MyPostsScreen.tsx`, `screens/MyPageScreen.tsx`: wire active profile list/detail navigation or make rows explicitly inactive.
- Update related tests under `__tests__/`.

---

### Task 1: API Error And Response Contracts

**Files:**
- Modify: `services/apiClient.ts`
- Modify: `services/liveApi.ts`
- Modify: `services/mockApi.ts`
- Modify: `services/api.ts`
- Modify: `types/domain.ts`
- Test: `__tests__/apiClient.test.ts`
- Create: `__tests__/liveApiContract.test.ts`

- [ ] **Step 1: Add failing API client status test**

Add to `__tests__/apiClient.test.ts`:

```ts
it("throws ApiError with status and server message on non-ok responses", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 404,
    statusText: "Not Found",
    json: async () => ({ error: "post not found" }),
  } as Response);

  await expect(apiRequest("/posts/missing")).rejects.toMatchObject({
    name: "ApiError",
    status: 404,
    message: "post not found",
  });
});
```

- [ ] **Step 2: Add failing live API contract tests**

Create `__tests__/liveApiContract.test.ts`:

```ts
import { getPost, submitReport, toggleLike } from "../services/liveApi";
import { clearAuthSession, setAuthSession } from "../services/authSession";

describe("liveApi contracts", () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.EXPO_PUBLIC_DARORI_API_BASE_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_DARORI_API_BASE_URL = "https://api.darori.test";
    setAuthSession("token", {
      id: "user-1",
      nickname: "테스터",
      temperature: 36.5,
      driverType: "nonDriver",
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.EXPO_PUBLIC_DARORI_API_BASE_URL = originalBaseUrl;
    clearAuthSession();
  });

  it("returns undefined for missing post details", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ error: "post not found" }),
    } as Response);

    await expect(getPost("missing")).resolves.toBeUndefined();
  });

  it("returns undefined when toggling like on a missing post", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ error: "post not found" }),
    } as Response);

    await expect(toggleLike("missing")).resolves.toBeUndefined();
  });

  it("returns the created report response", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: "report-1",
        roomId: "room-1",
        reason: "욕설 및 비매너 사용",
        createdAt: "2026-05-27T00:00:00.000Z",
      }),
    } as Response);

    await expect(submitReport("room-1", "욕설 및 비매너 사용")).resolves.toMatchObject({
      id: "report-1",
      roomId: "room-1",
    });
  });
});
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
npm test -- __tests__/apiClient.test.ts __tests__/liveApiContract.test.ts
```

Expected: failures for missing `ApiError`, 404 contract, and report return type.

- [ ] **Step 4: Implement status-preserving API error**

In `services/apiClient.ts`, add:

```ts
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiErrorStatus(error: unknown, status: number) {
  return error instanceof ApiError && error.status === status;
}
```

Change the non-ok branch to parse payload once and throw `new ApiError(message, response.status, payload)`.

- [ ] **Step 5: Align live API contracts**

In `types/domain.ts`, add:

```ts
export type Report = {
  id: string;
  roomId?: string;
  reason: string;
  createdAt: string;
};
```

In `services/liveApi.ts`, import `Report` and `isApiErrorStatus`, then update:

```ts
export async function getPost(id: string): Promise<Post | undefined> {
  if (shouldUseWebTestFallback()) {
    return mockApi.getPost(id);
  }

  try {
    return await apiRequest<Post>(`/posts/${encodeURIComponent(id)}`);
  } catch (error) {
    if (isApiErrorStatus(error, 404)) {
      return undefined;
    }
    throw error;
  }
}

export async function toggleLike(postId: string): Promise<Post | undefined> {
  return withWebTestFallback(
    async () => {
      try {
        return await apiRequest<Post>(`/posts/${encodeURIComponent(postId)}/like`, {
          method: "POST",
        });
      } catch (error) {
        if (isApiErrorStatus(error, 404)) {
          return undefined;
        }
        throw error;
      }
    },
    () => mockApi.toggleLike(postId),
  );
}

export async function submitReport(roomId: string, reason: string): Promise<Report> {
  return withWebTestFallback(
    () =>
      apiRequest<Report>("/reports", {
        method: "POST",
        body: { roomId, reason },
      }),
    () => mockApi.submitReport(roomId, reason),
  );
}
```

Update `services/mockApi.ts` `submitReport` to return a `Report` object.

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
npm test -- __tests__/apiClient.test.ts __tests__/liveApiContract.test.ts __tests__/ChatRoomReportFlow.test.tsx
npm run typecheck
```

Expected: all pass.

---

### Task 2: Auth Session Logout And Phone Verification Guard

**Files:**
- Modify: `screens/profile/SettingsScreen.tsx`
- Modify: `screens/auth/AuthScreen.tsx`
- Test: `__tests__/ProfileSettingsFlow.test.tsx`
- Test: `__tests__/AuthFlow.test.tsx`

- [ ] **Step 1: Add logout token-clear test**

In `__tests__/ProfileSettingsFlow.test.tsx`, add:

```ts
import { getAuthToken, setAuthSession } from "../services/authSession";

it("clears the auth session when logout is confirmed", async () => {
  setAuthSession("session-token", {
    id: "user-1",
    nickname: "테스터",
    temperature: 36.5,
    driverType: "nonDriver",
  });
  const onLogout = jest.fn();

  render(<SettingsScreen onLogout={onLogout} />);
  fireEvent.press(screen.getByText("로그아웃"));
  fireEvent.press(screen.getByText("로그아웃하기"));

  expect(onLogout).toHaveBeenCalledTimes(1);
  expect(getAuthToken()).toBeUndefined();
});
```

- [ ] **Step 2: Add verified phone request guard test**

In `__tests__/AuthFlow.test.tsx`, mock `requestPhoneVerification` and `confirmPhoneVerification`, then assert `signup-phone-request-code` is disabled after verification:

```ts
expect(screen.getByTestId("signup-phone-request-code").props.accessibilityState).toMatchObject({
  disabled: true,
});
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
npm test -- __tests__/ProfileSettingsFlow.test.tsx __tests__/AuthFlow.test.tsx
```

Expected: logout test fails because token remains; phone guard test fails because request button stays enabled.

- [ ] **Step 4: Clear session on logout**

In `screens/profile/SettingsScreen.tsx`:

```ts
import { clearAuthSession } from "../../services/authSession";
```

Inside the logout branch:

```ts
if (confirmationTarget === "logout") {
  clearAuthSession();
  closeConfirmation();
  onLogout?.();
  return;
}
```

- [ ] **Step 5: Disable phone-code request after verified**

In `screens/auth/AuthScreen.tsx`, change the request button disabled state:

```ts
const requestDisabled =
  phoneVerification.status === "verified" ||
  phoneVerificationSubmitting === "request";
```

Use `requestDisabled` for `accessibilityState.disabled`, `disabled`, and disabled styles.

- [ ] **Step 6: Make non-working auth controls non-actionable**

For `PASS 간편 로그인` and email "확인", remove `accessibilityRole="button"` and render them as informational text until a service contract exists. Tests should assert they are not returned by `getByRole("button", { name: /PASS/ })`.

- [ ] **Step 7: Run tests and typecheck**

Run:

```bash
npm test -- __tests__/ProfileSettingsFlow.test.tsx __tests__/AuthFlow.test.tsx
npm run typecheck
```

Expected: all pass.

---

### Task 3: Application Submit Flow And Fake Chat Navigation

**Files:**
- Modify: `screens/post/ApplyFlowModal.tsx`
- Modify: `screens/post/PostDetailScreen.tsx`
- Modify: `App.tsx`
- Test: `__tests__/PostDetailFlow.test.tsx`

- [ ] **Step 1: Add failing tests for submit success and failure**

Mock `applyToPost` in `__tests__/PostDetailFlow.test.tsx`. Add one test where it rejects and the modal stays on the terms step with an error; add one where it resolves and `onOpenChat` is not called.

```ts
expect(mockedApi.applyToPost).toHaveBeenCalledWith(
  "job-1",
  "꼼꼼하게 시간 맞춰 참여할 수 있습니다.",
);
expect(onOpenChat).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- __tests__/PostDetailFlow.test.tsx
```

Expected: failure because submit is fire-and-forget and `onOpenChat` is called.

- [ ] **Step 3: Await application submission**

In `ApplyFlowModal.tsx`, add state:

```ts
const [submitting, setSubmitting] = useState(false);
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

Replace `submitApplication`:

```ts
const submitApplication = async () => {
  if (submitting || !introValid || !requiredTermsChecked) {
    return;
  }

  setSubmitting(true);
  setErrorMessage(null);
  try {
    await applyToPost(post.id, intro.trim());
    setStep(3);
  } catch (error) {
    setErrorMessage(error instanceof Error ? error.message : "지원 요청을 보내지 못했어요.");
  } finally {
    setSubmitting(false);
  }
};
```

Change the confirm button:

```tsx
<AppButton
  label={submitting ? "제출 중" : "확인"}
  disabled={!requiredTermsChecked || submitting}
  onPress={() => {
    void submitApplication();
  }}
  testID="apply-terms-confirm-button"
/>
```

- [ ] **Step 4: Remove fake chat navigation after applying**

Change `complete` in `ApplyFlowModal.tsx`:

```ts
const complete = () => {
  onClose();
};
```

Change completion copy to say the other party will review the request, not that a chat is ready.

Remove the hardcoded `setSelectedChatRoomId("room-1")` path from the `PostDetailScreen` `onOpenChat` block in `App.tsx`; keep `onOpenChat` only for review acceptance flows that receive a real room id.

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- __tests__/PostDetailFlow.test.tsx __tests__/ApplicationReviewFlow.test.tsx
npm run typecheck
```

Expected: all pass.

---

### Task 4: Recruitment Creation Result And Ride Tag Persistence

**Files:**
- Modify: `types/domain.ts`
- Modify: `screens/CreateRecruitmentScreen.tsx`
- Modify: `server/db/schema.sql`
- Create: `server/db/migrations/007_carpool_ride_tag.sql`
- Modify: `server/api/repository.ts`
- Modify: `services/mockApi.ts`
- Test: `__tests__/RecruitmentCreationFlow.test.tsx`
- Test: `__tests__/serverCreatePostInput.test.ts`

- [ ] **Step 1: Add failing UI payload test**

In `__tests__/RecruitmentCreationFlow.test.tsx`, extend the ride creation test:

```ts
const createPostSpy = jest.spyOn(api, "createPost");

await waitFor(() => {
  expect(createPostSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "carpool",
      rideTag: "출근",
    }),
  );
});
```

- [ ] **Step 2: Add failing repository normalize test**

In `__tests__/serverCreatePostInput.test.ts`, add:

```ts
expect(
  normalizeCreatePostInput(
    {
      type: "carpool",
      title: "청도 출근",
      body: "같이 가요",
      departure: "청도역",
      destination: "대전역",
      days: ["화"],
      startTime: "08:30",
      seats: 3,
      rideTag: "출근",
    },
    {
      id: "post-ride-tag",
      authorId: "user-1",
      createdAt: "2026-05-27T00:00:00.000Z",
    },
  ),
).toMatchObject({
  type: "carpool",
  rideTag: "출근",
});
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
npm test -- __tests__/RecruitmentCreationFlow.test.tsx __tests__/serverCreatePostInput.test.ts
```

Expected: failures because `rideTag` is not in the payload or normalized record.

- [ ] **Step 4: Add domain and DB field**

In `types/domain.ts`, add to `CarpoolPost`:

```ts
rideTag?: string;
```

Create `server/db/migrations/007_carpool_ride_tag.sql`:

```sql
alter table posts
  add column if not exists ride_tag text;
```

Add `ride_tag text` to `server/db/schema.sql` after `destination`.

- [ ] **Step 5: Persist and map `rideTag`**

In `server/api/repository.ts`, add `ride_tag` to `PostRow`, `CreatePostInput`, `CreatePostRecord`, insert columns/values, and `mapPostRow`.

In `normalizeCreatePostInput`, set:

```ts
rideTag: optionalText(input.rideTag),
```

In `mapPostRow` carpool return:

```ts
rideTag: row.ride_tag ?? undefined,
```

- [ ] **Step 6: Submit `rideTag` from UI**

In `CreateRecruitmentScreen.tsx`, add to the carpool payload:

```ts
rideTag: rideTag.trim(),
```

Capture the created post:

```ts
const createdPost = await createPost(buildCreatePostInput(selectedType));
onComplete?.(selectedType, createdPost);
```

Update `CreateRecruitmentScreenProps`:

```ts
onComplete?: (type: RecruitmentType, post: Post) => void;
```

In `App.tsx`, after creation, open the created post detail instead of blindly switching to chat:

```ts
onComplete={(_, post) => {
  setActiveTab("map");
  setSelectedPostId(post.id);
}}
```

- [ ] **Step 7: Run tests and typecheck**

Run:

```bash
npm test -- __tests__/RecruitmentCreationFlow.test.tsx __tests__/serverCreatePostInput.test.ts __tests__/serverApiPath.test.ts
npm run typecheck
```

Expected: all pass.

---

### Task 5: Application Review State Consistency

**Files:**
- Modify: `screens/post/ApplicationReviewScreen.tsx`
- Modify: `services/mockApi.ts`
- Test: `__tests__/ApplicationReviewFlow.test.tsx`

- [ ] **Step 1: Add failing tests for non-pending application**

In `__tests__/ApplicationReviewFlow.test.tsx`, add tests rendering accepted and rejected mock applications. Assert approve/reject buttons are disabled or absent when `application.status !== "pending"`.

```ts
expect(screen.queryByTestId("application-approve-button")).toBeNull();
expect(screen.queryByTestId("application-reject-button")).toBeNull();
expect(screen.getByText("이미 처리된 신청입니다.")).toBeTruthy();
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- __tests__/ApplicationReviewFlow.test.tsx
```

Expected: failure because buttons always render.

- [ ] **Step 3: Hide review actions for processed applications**

In `ApplicationReviewScreen.tsx`:

```ts
const canReview = application.status === "pending";
```

Render footer only when `canReview` is true. When false, render:

```tsx
<View style={styles.footer}>
  <Text style={styles.reviewClosedText}>이미 처리된 신청입니다.</Text>
</View>
```

- [ ] **Step 4: Align mock API with live rules**

In `services/mockApi.ts`, make `acceptApplication` throw for rejected applications and `rejectApplication` throw unless status is pending.

```ts
if (application.status === "rejected") {
  throw new Error("rejected application cannot be accepted");
}
if (application.status !== "pending") {
  throw new Error("application is not pending");
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- __tests__/ApplicationReviewFlow.test.tsx __tests__/mockDbIntegrity.test.ts
npm run typecheck
```

Expected: all pass.

---

### Task 6: Chat Message Ownership And Leave API

**Files:**
- Modify: `types/domain.ts`
- Modify: `services/liveApi.ts`
- Modify: `services/mockApi.ts`
- Modify: `services/api.ts`
- Modify: `server/api/handler.ts`
- Modify: `server/api/repository.ts`
- Modify: `screens/chat/ChatRoomScreen.tsx`
- Test: `__tests__/ChatRoomReportFlow.test.tsx`
- Test: `__tests__/serverApplicationChat.test.ts`

- [ ] **Step 1: Add failing chat ownership test**

In `__tests__/ChatRoomReportFlow.test.tsx`, set a live-looking session user and return a sent message with `senderId: "user-1"`. Assert the sent text renders as a mine bubble by checking the style or a `testID` added in the component.

- [ ] **Step 2: Add failing leave API tests**

In `__tests__/serverApplicationChat.test.ts`, add a test that calls the new repository function:

```ts
await leaveChatRoom("room-1", "user-1");
await expect(listChatMessages("room-1", "user-1")).rejects.toThrow("not a room participant");
```

In `__tests__/ChatRoomReportFlow.test.tsx`, mock `api.leaveChatRoom` and assert pressing "네, 나갈래요" calls it with `room-1`.

- [ ] **Step 3: Run failing tests**

Run:

```bash
npm test -- __tests__/ChatRoomReportFlow.test.tsx __tests__/serverApplicationChat.test.ts
```

Expected: failures because there is no leave API and ownership uses `"me"`.

- [ ] **Step 4: Add service and server route**

In `server/api/repository.ts`:

```ts
export async function leaveChatRoom(roomId: string, userId: string) {
  await assertRoomParticipant(roomId, userId);
  await getPostgresPool().query(
    "delete from chat_room_participants where room_id = $1 and user_id = $2",
    [roomId, userId],
  );
  await getPostgresPool().query(
    `
      delete from chat_rooms cr
      where cr.id = $1
        and not exists (
          select 1 from chat_room_participants crp where crp.room_id = cr.id
        )
    `,
    [roomId],
  );
}
```

In `server/api/handler.ts`, before message routes:

```ts
const leaveRoomMatch = pathname.match(/^\/chat\/rooms\/([^/]+)\/participants\/me$/);
if (leaveRoomMatch && method === "DELETE") {
  const context = await requireWriteContext(request, "sendChatMessage");
  await leaveChatRoom(leaveRoomMatch[1], context.userId);
  sendJson(response, 204);
  return;
}
```

In `services/liveApi.ts`:

```ts
export async function leaveChatRoom(roomId: string): Promise<void> {
  await apiRequest<void>(
    `/chat/rooms/${encodeURIComponent(roomId)}/participants/me`,
    { method: "DELETE" },
  );
}
```

Export it from `services/api.ts` and implement equivalent removal in `services/mockApi.ts`.

- [ ] **Step 5: Fix message ownership**

In `ChatRoomScreen.tsx`, import `getSessionUser` and compute:

```ts
const sessionUserId = getSessionUser()?.id;
```

Use:

```tsx
mine={item.senderId === "me" || (!!sessionUserId && item.senderId === sessionUserId)}
```

- [ ] **Step 6: Call leave API from UI**

Replace the confirm handler:

```ts
onConfirm={() => {
  void (async () => {
    try {
      await leaveChatRoom(room.id);
      setLeaveVisible(false);
      onBack?.();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "채팅방을 나가지 못했어요.");
    }
  })();
}}
```

- [ ] **Step 7: Run tests and typecheck**

Run:

```bash
npm test -- __tests__/ChatRoomReportFlow.test.tsx __tests__/serverApplicationChat.test.ts
npm run typecheck
```

Expected: all pass.

---

### Task 7: Map Bus Entry And Search Wiring

**Files:**
- Modify: `screens/MapScreen.tsx`
- Modify: `App.tsx`
- Test: `__tests__/MapScreen.test.tsx`
- Test: `__tests__/AppTabs.test.tsx`

- [ ] **Step 1: Add failing bus entry test**

In `__tests__/MapScreen.test.tsx`, replace the local-save assertion with:

```ts
const onOpenBusSighting = jest.fn();
render(<MapScreen onOpenBusSighting={onOpenBusSighting} />);

fireEvent.press(screen.getByTestId("map-home-category-bus"));
fireEvent.press(screen.getByTestId("map-home-bus-sighting-save"));

expect(onOpenBusSighting).toHaveBeenCalledTimes(1);
expect(screen.queryByText("최근 기록")).toBeNull();
```

- [ ] **Step 2: Add failing app-level test**

In `__tests__/AppTabs.test.tsx`, press map bus category and save button; assert `BusSightingScreen` opens by checking `bus-sighting-record-button`.

- [ ] **Step 3: Run failing tests**

Run:

```bash
npm test -- __tests__/MapScreen.test.tsx __tests__/AppTabs.test.tsx
```

Expected: failure because MapScreen only writes local state.

- [ ] **Step 4: Route map bus save to real recorder**

In `MapScreenProps`, add:

```ts
onOpenBusSighting?: () => void;
```

Replace `handleBusSightingSave` body:

```ts
const handleBusSightingSave = useCallback(() => {
  onOpenBusSighting?.();
}, [onOpenBusSighting]);
```

Remove `busSightings` local state and recent-record UI from `MapScreen`.

In `App.tsx`:

```tsx
<MapScreen
  onSelectTab={handleSelectTab}
  onOpenPost={setSelectedPostId}
  onOpenBusSighting={() => setBusSightingOpen(true)}
/>
```

- [ ] **Step 5: Make map search explicit**

Either wire `onSearchPress` from `App.tsx` to a real search surface or render the search control as disabled. For this remediation, use an in-screen search panel in `MapScreen` that calls `searchPlaceCandidates(query)` after two characters and focuses `MapPreview` to the selected result.

Add tests that mock `searchPlaceCandidates`, press `map-home-search-button`, type `"청도"`, press the result, and assert the panel closes.

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
npm test -- __tests__/MapScreen.test.tsx __tests__/AppTabs.test.tsx __tests__/placeSearchService.test.ts
npm run typecheck
```

Expected: all pass.

---

### Task 8: Profile List Navigation And Dead Profile Rows

**Files:**
- Modify: `screens/MyPageScreen.tsx`
- Modify: `screens/profile/SavedPostsScreen.tsx`
- Modify: `screens/profile/MyPostsScreen.tsx`
- Modify: `App.tsx`
- Test: `__tests__/ProfileSettingsFlow.test.tsx`

- [ ] **Step 1: Add failing navigation tests**

In `__tests__/ProfileSettingsFlow.test.tsx`, assert:

```ts
fireEvent.press(screen.getByText("내 찜"));
expect(await screen.findByText("내 찜")).toBeTruthy();

fireEvent.press(screen.getByText("내가 쓴 모집글"));
expect(await screen.findByText("내가 쓴 모집글")).toBeTruthy();
```

Also assert pressing a post card opens `PostDetailScreen` by checking the detail title.

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- __tests__/ProfileSettingsFlow.test.tsx
```

Expected: failure because profile rows do not include saved/mine navigation and post cards lack handlers.

- [ ] **Step 3: Add active profile menu rows**

In `MyPageScreen.tsx`, include:

```ts
{ id: "saved", label: "내 찜", icon: Heart },
{ id: "mine", label: "내가 쓴 모집글", icon: FileText },
```

In row press handling:

```ts
if (item.id === "saved" || item.id === "mine" || item.id === "settings") {
  onOpenProfileScreen?.(item.id);
}
```

Render non-active rows with `accessibilityState={{ disabled: true }}` and no `onPress`.

- [ ] **Step 4: Wire post card open**

Add `onOpenPost?: (postId: string) => void` to `SavedPostsScreenProps` and `MyPostsScreenProps`. Pass it into `ProfilePostCard`:

```tsx
<ProfilePostCard key={post.id} post={post} onPress={() => onOpenPost?.(post.id)} />
```

In `App.tsx`, pass:

```tsx
<MyPostsScreen onBack={() => setProfileSubScreen(null)} onOpenPost={setSelectedPostId} />
<SavedPostsScreen onBack={() => setProfileSubScreen(null)} onOpenPost={setSelectedPostId} />
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npm test -- __tests__/ProfileSettingsFlow.test.tsx __tests__/PostDetailFlow.test.tsx
npm run typecheck
```

Expected: all pass.

---

### Task 9: Explicit Treatment For Remaining Non-API Controls

**Files:**
- Modify: `screens/post/PostDetailScreen.tsx`
- Modify: `screens/chat/ChatRoomScreen.tsx`
- Modify: `screens/RouteScreen.tsx`
- Test: `__tests__/PostDetailFlow.test.tsx`
- Test: `__tests__/ChatRoomReportFlow.test.tsx`
- Test: `__tests__/RouteScreen.test.tsx`

- [ ] **Step 1: Add tests that non-working controls are not exposed as active buttons**

Cover these controls:

- Post detail share icon.
- Chat phone and attachment buttons.
- Chat manner, credential, invite controls if they remain local-only.
- Route search bar.

Assert either disabled accessibility state or explicit Coming Soon status text after press.

- [ ] **Step 2: Run failing tests**

Run:

```bash
npm test -- __tests__/PostDetailFlow.test.tsx __tests__/ChatRoomReportFlow.test.tsx __tests__/RouteScreen.test.tsx
```

Expected: failures where controls look active but have no API contract.

- [ ] **Step 3: Convert each control to an explicit state**

Use one of these patterns per control:

```tsx
accessibilityState={{ disabled: true }}
disabled
```

or:

```ts
setStatusMessage("이 기능은 아직 사용할 수 없어요.");
```

Do not leave a visible `Pressable` without either a service call, navigation, or explicit disabled/status behavior.

- [ ] **Step 4: Run tests and typecheck**

Run:

```bash
npm test -- __tests__/PostDetailFlow.test.tsx __tests__/ChatRoomReportFlow.test.tsx __tests__/RouteScreen.test.tsx
npm run typecheck
```

Expected: all pass.

---

## Final Verification

- [ ] Run the focused suites:

```bash
npm test -- __tests__/apiClient.test.ts __tests__/liveApiContract.test.ts __tests__/PostDetailFlow.test.tsx __tests__/RecruitmentCreationFlow.test.tsx __tests__/ApplicationReviewFlow.test.tsx __tests__/ChatRoomReportFlow.test.tsx __tests__/MapScreen.test.tsx __tests__/ProfileSettingsFlow.test.tsx
```

- [ ] Run full regression:

```bash
npm test
```

- [ ] Run typecheck:

```bash
npm run typecheck
```

- [ ] Manual smoke path:

```bash
npm start
```

Exercise: login, create ride post, open created detail, apply to a post, approve application, open created chat room, send message, report room, leave room, open map bus recorder, submit bus sighting.

## Self-Review Notes

- Audit coverage mapped to tasks: API 404/report contracts Task 1; auth/session Task 2; application apply Task 3; recruitment submit Task 4; review state Task 5; chat send/leave Task 6; map bus/search Task 7; profile list wiring Task 8; remaining dead controls Task 9.
- Route info, archive history, and bus arrival records are already explicit Coming Soon screens. This plan keeps them as discoverable stubs unless product requirements define their data contract.
- The plan avoids adding new external packages.
