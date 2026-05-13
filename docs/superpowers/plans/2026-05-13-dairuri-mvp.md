# Dairuri MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current Dairuri prototype into a testable MVP for rural ride coordination, local job posts, and resident bus sightings.

**Architecture:** Keep the npm workspace structure: `packages/shared` owns API-facing contracts, `apps/api` exposes NestJS modules, and `apps/mobile` consumes those contracts through a small API client. The MVP should replace in-memory repositories with PostgreSQL-backed repositories, keep Redis optional until notifications or throttling need it, and add UI flows one feature at a time behind focused tests.

**Tech Stack:** TypeScript, npm workspaces, NestJS, PostgreSQL `pg`, Expo, React Native, `@testing-library/react-native`, Vitest, Jest.

---

## Current Baseline

- `packages/shared/src/index.ts` defines bottom tabs, feature labels, listing types, bus report types, and sample data.
- `apps/api/src/*` exposes health, rides, jobs, and bus report endpoints.
- `apps/api/src/database/*` has PostgreSQL and Redis service wrappers, but the feature repositories still use in-memory seed data.
- `apps/mobile/src/core/DairuriApp.tsx` renders five tabs without route persistence.
- `apps/mobile/src/services/api/dairuriApi.ts` calls the API with `EXPO_PUBLIC_API_BASE_URL` fallback to `http://localhost:3000`.
- `docs/dairuri-service-plan.md` contains the product direction and IA.

## Target File Map

- Modify `packages/shared/src/index.ts`: add request/response contracts for ride posts, job posts, users, verification badges, applications, and chat summaries.
- Modify `packages/shared/src/index.test.ts`: lock the public contract used by API and mobile.
- Create `apps/api/src/database/schema.sql`: define MVP PostgreSQL tables.
- Create `apps/api/src/database/migrations.service.ts`: idempotently apply `schema.sql` during local development and tests.
- Modify `apps/api/src/database/database.module.ts`: export the migration service.
- Modify `apps/api/src/rides/*`: add create/apply endpoints and PostgreSQL repository methods.
- Modify `apps/api/src/jobs/*`: add create/apply endpoints and PostgreSQL repository methods.
- Modify `apps/api/src/bus-reports/*`: persist bus sightings and expose route-filtered history.
- Create `apps/api/src/users/*`: add a minimal profile and verification badge surface.
- Create `apps/api/src/chat/*`: add match-scoped chat room summaries before real-time messaging.
- Modify `apps/mobile/src/services/api/dairuriApi.ts`: add typed methods for all MVP endpoints.
- Modify `apps/mobile/src/features/posts/PostScreen.tsx`: add ride/job tabs, detail cards, and creation entry points.
- Create `apps/mobile/src/features/posts/RidePostForm.tsx`: collect ride post fields.
- Create `apps/mobile/src/features/posts/JobPostForm.tsx`: collect job post fields.
- Modify `apps/mobile/src/features/bus/BusArchiveScreen.tsx`: show live clock, route history, and retry states.
- Modify `apps/mobile/src/features/chat/ChatScreen.tsx`: show match chat room summaries.
- Modify `apps/mobile/src/features/profile/ProfileScreen.tsx`: show user verification and activity summary.
- Update `readme.md`: document setup, scripts, environment variables, and plan links.

---

### Task 1: Shared MVP Contracts

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/index.test.ts`

- [ ] **Step 1: Add failing contract tests**

Add these assertions to `packages/shared/src/index.test.ts`:

```ts
import {
  createRidePostDefaults,
  createJobPostDefaults,
  verificationBadgeLabels,
} from "./index";

it("defines ride and job post defaults for mobile forms", () => {
  expect(createRidePostDefaults()).toMatchObject({
    title: "",
    departureName: "",
    destinationName: "",
    dayLabel: "",
    departureTime: "",
    seatsTotal: 1,
  });

  expect(createJobPostDefaults()).toMatchObject({
    title: "",
    placeName: "",
    payLabel: "",
    scheduleLabel: "",
    description: "",
  });
});

it("keeps profile verification badge labels stable", () => {
  expect(verificationBadgeLabels).toEqual({
    phone: "전화번호 인증",
    region: "지역 인증",
    driverLicense: "면허 인증",
    insurance: "보험 입력",
  });
});
```

- [ ] **Step 2: Run the shared test and confirm failure**

Run:

```bash
npm run test -w @dairuri/shared
```

Expected: FAIL because `createRidePostDefaults`, `createJobPostDefaults`, and `verificationBadgeLabels` are not exported.

- [ ] **Step 3: Add the shared contracts**

Add these exports to `packages/shared/src/index.ts`:

```ts
export interface CreateRidePostInput {
  title: string;
  departureName: string;
  destinationName: string;
  dayLabel: string;
  departureTime: string;
  seatsTotal: number;
  description: string;
}

export interface CreateJobPostInput {
  title: string;
  placeName: string;
  payLabel: string;
  scheduleLabel: string;
  description: string;
}

export interface ApplicationInput {
  listingId: string;
  message: string;
}

export interface UserProfileSummary {
  id: string;
  nickname: string;
  driverYears: number;
  mannerTemperature: number;
  completedRides: number;
  completedJobs: number;
  recommendationRate: number;
  verifications: VerificationBadge[];
}

export type VerificationBadge =
  | "phone"
  | "region"
  | "driverLicense"
  | "insurance";

export const verificationBadgeLabels: Record<VerificationBadge, string> = {
  phone: "전화번호 인증",
  region: "지역 인증",
  driverLicense: "면허 인증",
  insurance: "보험 입력",
};

export interface ChatRoomSummary {
  id: string;
  listingTitle: string;
  participantLabel: string;
  lastMessage: string;
  updatedAt: string;
}

export function createRidePostDefaults(): CreateRidePostInput {
  return {
    title: "",
    departureName: "",
    destinationName: "",
    dayLabel: "",
    departureTime: "",
    seatsTotal: 1,
    description: "",
  };
}

export function createJobPostDefaults(): CreateJobPostInput {
  return {
    title: "",
    placeName: "",
    payLabel: "",
    scheduleLabel: "",
    description: "",
  };
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test -w @dairuri/shared
npm run typecheck -w @dairuri/shared
```

Expected: both commands pass.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/index.ts packages/shared/src/index.test.ts
git commit -m "feat: define mvp shared contracts"
```

---

### Task 2: PostgreSQL Schema and Local Migration

**Files:**
- Create: `apps/api/src/database/schema.sql`
- Create: `apps/api/src/database/migrations.service.ts`
- Modify: `apps/api/src/database/database.module.ts`
- Create: `apps/api/src/database/migrations.service.spec.ts`

- [ ] **Step 1: Add schema**

Create `apps/api/src/database/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  region_verified BOOLEAN NOT NULL DEFAULT FALSE,
  driver_license_verified BOOLEAN NOT NULL DEFAULT FALSE,
  insurance_registered BOOLEAN NOT NULL DEFAULT FALSE,
  driver_years INTEGER NOT NULL DEFAULT 0,
  manner_temperature NUMERIC(4, 1) NOT NULL DEFAULT 36.5,
  completed_rides INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  recommendation_rate INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ride_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  departure_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  day_label TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  seats_total INTEGER NOT NULL,
  seats_left INTEGER NOT NULL,
  description TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  author_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  place_name TEXT NOT NULL,
  pay_label TEXT NOT NULL,
  schedule_label TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_reports (
  id TEXT PRIMARY KEY,
  route_number TEXT NOT NULL,
  place_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('ride', 'job')),
  listing_id TEXT NOT NULL,
  applicant_id TEXT REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('ride', 'job')),
  listing_id TEXT NOT NULL,
  participant_label TEXT NOT NULL,
  last_message TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 2: Add migration service test**

Create `apps/api/src/database/migrations.service.spec.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { MigrationsService } from "./migrations.service";

describe("MigrationsService", () => {
  it("executes the bundled schema once", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const service = new MigrationsService({ query } as never);

    await service.apply();

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain("CREATE TABLE IF NOT EXISTS users");
    expect(query.mock.calls[0][0]).toContain("CREATE TABLE IF NOT EXISTS bus_reports");
  });
});
```

- [ ] **Step 3: Run the database test and confirm failure**

Run:

```bash
npm run test -w @dairuri/api -- migrations.service.spec.ts
```

Expected: FAIL because `MigrationsService` does not exist.

- [ ] **Step 4: Implement migration service**

Create `apps/api/src/database/migrations.service.ts`:

```ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PostgresService } from "./postgres.service";

@Injectable()
export class MigrationsService implements OnModuleInit {
  constructor(private readonly postgres: PostgresService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.SKIP_DB_MIGRATIONS === "true") {
      return;
    }

    await this.apply();
  }

  async apply(): Promise<void> {
    const schemaPath = join(__dirname, "schema.sql");
    const schema = await readFile(schemaPath, "utf8");
    await this.postgres.query(schema);
  }
}
```

Modify `apps/api/src/database/database.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { MigrationsService } from "./migrations.service";
import { PostgresService } from "./postgres.service";
import { RedisService } from "./redis.service";

@Module({
  providers: [PostgresService, RedisService, MigrationsService],
  exports: [PostgresService, RedisService, MigrationsService],
})
export class DatabaseModule {}
```

- [ ] **Step 5: Ensure schema is copied for build output**

Modify `apps/api/nest-cli.json` so `schema.sql` is available in `dist`:

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "assets": ["database/schema.sql"],
    "watchAssets": true
  }
}
```

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm run test -w @dairuri/api -- migrations.service.spec.ts
npm run build -w @dairuri/api
```

Expected: both commands pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/database apps/api/nest-cli.json
git commit -m "feat: add api database schema"
```

---

### Task 3: Persist Rides and Jobs

**Files:**
- Modify: `apps/api/src/rides/rides.repository.ts`
- Modify: `apps/api/src/rides/rides.service.ts`
- Modify: `apps/api/src/rides/rides.controller.ts`
- Create: `apps/api/src/rides/ride-post.dto.ts`
- Modify: `apps/api/src/jobs/jobs.repository.ts`
- Modify: `apps/api/src/jobs/jobs.service.ts`
- Modify: `apps/api/src/jobs/jobs.controller.ts`
- Create: `apps/api/src/jobs/job-post.dto.ts`
- Modify: `apps/api/src/rides/rides.service.spec.ts`
- Modify: `apps/api/src/jobs/jobs.service.spec.ts`

- [ ] **Step 1: Add create post DTOs**

Create `apps/api/src/rides/ride-post.dto.ts`:

```ts
import { IsInt, IsNumber, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import type { CreateRidePostInput } from "@dairuri/shared";

export class CreateRidePostDto implements CreateRidePostInput {
  @IsString()
  @MinLength(4)
  @MaxLength(80)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  departureName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  destinationName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  dayLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  departureTime!: string;

  @IsInt()
  @Min(1)
  @Max(8)
  seatsTotal!: number;

  @IsString()
  @MaxLength(600)
  description!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;
}
```

Create `apps/api/src/jobs/job-post.dto.ts`:

```ts
import { IsString, MaxLength, MinLength } from "class-validator";
import type { CreateJobPostInput } from "@dairuri/shared";

export class CreateJobPostDto implements CreateJobPostInput {
  @IsString()
  @MinLength(4)
  @MaxLength(80)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  placeName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  payLabel!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  scheduleLabel!: string;

  @IsString()
  @MaxLength(600)
  description!: string;
}
```

- [ ] **Step 2: Add service tests for create operations**

Add this case to `apps/api/src/rides/rides.service.spec.ts`:

```ts
it("creates a ride post with all seats initially available", () => {
  const service = new RidesService();

  const ride = service.create({
    title: "병원 정기 라이드 함께 가실 분",
    departureName: "다로리 카페",
    destinationName: "청도 병원",
    dayLabel: "매주 화",
    departureTime: "오전 8:30",
    seatsTotal: 3,
    description: "병원 방문 동선이 맞는 분을 모집합니다.",
    lat: 35.7001,
    lng: 128.7342,
  });

  expect(ride).toMatchObject({
    type: "ride",
    title: "병원 정기 라이드 함께 가실 분",
    seatsLeft: 3,
    location: { lat: 35.7001, lng: 128.7342 },
  });
});
```

Add this case to `apps/api/src/jobs/jobs.service.spec.ts`:

```ts
it("creates a local job post", () => {
  const service = new JobsService();

  const job = service.create({
    title: "평일 오전 농가 포장 도와주실 분",
    placeName: "다로리 농장",
    payLabel: "일급 60,000원",
    scheduleLabel: "월, 수 09:00-12:00",
    description: "포장과 상차 보조가 주 업무입니다.",
  });

  expect(job).toMatchObject({
    type: "job",
    title: "평일 오전 농가 포장 도와주실 분",
    placeName: "다로리 농장",
  });
});
```

- [ ] **Step 3: Run tests and confirm failure**

Run:

```bash
npm run test -w @dairuri/api -- rides.service.spec.ts jobs.service.spec.ts
```

Expected: FAIL because `create` methods are not implemented.

- [ ] **Step 4: Implement repository-backed create methods**

Use the existing in-memory repository API first, then replace internals with PostgreSQL in a second commit. Keep the public methods:

```ts
create(input: CreateRidePostInput & { lat: number; lng: number }): RideListing
create(input: CreateJobPostInput): JobListing
```

For ride IDs, use `ride-${Date.now()}`. For job IDs, use `job-${Date.now()}`. Set `seatsLeft` equal to `seatsTotal`.

- [ ] **Step 5: Add controller POST endpoints**

Modify `apps/api/src/rides/rides.controller.ts` to add:

```ts
@Post()
create(@Body() dto: CreateRidePostDto) {
  return this.ridesService.create(dto);
}
```

Modify `apps/api/src/jobs/jobs.controller.ts` to add:

```ts
@Post()
create(@Body() dto: CreateJobPostDto) {
  return this.jobsService.create(dto);
}
```

- [ ] **Step 6: Run API tests**

Run:

```bash
npm run test -w @dairuri/api
npm run typecheck -w @dairuri/api
```

Expected: both commands pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/rides apps/api/src/jobs
git commit -m "feat: add ride and job post creation"
```

---

### Task 4: Mobile Post Creation Flow

**Files:**
- Modify: `apps/mobile/src/services/api/dairuriApi.ts`
- Create: `apps/mobile/src/features/posts/RidePostForm.tsx`
- Create: `apps/mobile/src/features/posts/JobPostForm.tsx`
- Modify: `apps/mobile/src/features/posts/PostScreen.tsx`
- Modify: `apps/mobile/src/App.test.tsx`
- Modify: `apps/mobile/src/services/api/dairuriApi.test.ts`

- [ ] **Step 1: Add API client tests**

Add to `apps/mobile/src/services/api/dairuriApi.test.ts`:

```ts
import { createJobPost, createRidePost } from "./dairuriApi";

it("posts new ride and job listings", async () => {
  jest.spyOn(global, "fetch").mockResolvedValue(response({ id: "created" }));

  await createRidePost({
    title: "병원 정기 라이드 함께 가실 분",
    departureName: "다로리 카페",
    destinationName: "청도 병원",
    dayLabel: "매주 화",
    departureTime: "오전 8:30",
    seatsTotal: 3,
    description: "병원 방문 동선이 맞는 분을 모집합니다.",
    lat: 35.7001,
    lng: 128.7342,
  });

  await createJobPost({
    title: "평일 오전 농가 포장 도와주실 분",
    placeName: "다로리 농장",
    payLabel: "일급 60,000원",
    scheduleLabel: "월, 수 09:00-12:00",
    description: "포장과 상차 보조가 주 업무입니다.",
  });

  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:3000/rides",
    expect.objectContaining({ method: "POST" }),
  );
  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:3000/jobs",
    expect.objectContaining({ method: "POST" }),
  );
});
```

- [ ] **Step 2: Implement API client methods**

Add to `apps/mobile/src/services/api/dairuriApi.ts`:

```ts
import type { CreateJobPostInput, CreateRidePostInput } from "@dairuri/shared";

export function createRidePost(
  input: CreateRidePostInput & { lat: number; lng: number },
): Promise<RideListing> {
  return requestJson("/rides", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function createJobPost(input: CreateJobPostInput): Promise<JobListing> {
  return requestJson("/jobs", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}
```

- [ ] **Step 3: Add mobile form smoke test**

Add to `apps/mobile/src/App.test.tsx`:

```tsx
it("opens the ride post form from the recruitment tab", async () => {
  render(<App />);

  fireEvent.press(screen.getByRole("button", { name: "모집글 탭" }));
  fireEvent.press(await screen.findByRole("button", { name: "라이드 모집글 작성" }));

  expect(screen.getByText("라이드 모집 시작")).toBeTruthy();
  expect(screen.getByPlaceholderText("출발 장소")).toBeTruthy();
  expect(screen.getByPlaceholderText("도착 장소")).toBeTruthy();
});
```

- [ ] **Step 4: Create form components**

Create `RidePostForm.tsx` and `JobPostForm.tsx` with controlled `TextInput` fields, a primary submit `Pressable`, and status text for success/failure. Keep fields visible on one scroll view, and pass `onCreated` callbacks back to `PostScreen`.

- [ ] **Step 5: Wire forms into `PostScreen`**

In `PostScreen`, add two buttons:

```tsx
<Pressable accessibilityRole="button" accessibilityLabel="라이드 모집글 작성" onPress={() => setMode("rideForm")}>
  <Text>라이드 작성</Text>
</Pressable>
<Pressable accessibilityRole="button" accessibilityLabel="일자리 모집글 작성" onPress={() => setMode("jobForm")}>
  <Text>일자리 작성</Text>
</Pressable>
```

Render the selected form when `mode` is `rideForm` or `jobForm`.

- [ ] **Step 6: Run mobile checks**

Run:

```bash
npm run test -w @dairuri/mobile
npm run typecheck -w @dairuri/mobile
```

Expected: both commands pass.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/services/api apps/mobile/src/features/posts apps/mobile/src/App.test.tsx
git commit -m "feat: add mobile post creation"
```

---

### Task 5: Bus Archive Persistence and History

**Files:**
- Modify: `apps/api/src/bus-reports/bus-reports.repository.ts`
- Modify: `apps/api/src/bus-reports/bus-reports.service.ts`
- Modify: `apps/api/src/bus-reports/bus-reports.controller.ts`
- Modify: `apps/api/src/bus-reports/bus-reports.service.spec.ts`
- Modify: `apps/mobile/src/features/bus/BusArchiveScreen.tsx`
- Modify: `apps/mobile/src/App.test.tsx`

- [ ] **Step 1: Add route history service test**

Add to `apps/api/src/bus-reports/bus-reports.service.spec.ts`:

```ts
it("filters recent reports by route number", () => {
  const service = new BusReportsService();

  service.create({ routeNumber: "3", placeName: "다로리 카페", lat: 35.7001, lng: 128.7342 });
  service.create({ routeNumber: "4", placeName: "청도역", lat: 35.699, lng: 128.731 });

  expect(service.findRecent("3")).toEqual([
    expect.objectContaining({ routeNumber: "3", placeName: "다로리 카페" }),
  ]);
});
```

- [ ] **Step 2: Implement route filtering**

Change `findRecent` signatures:

```ts
findRecent(routeNumber?: string): BusReport[]
```

Filter by `routeNumber` before applying the 20-item limit.

- [ ] **Step 3: Add controller query parameter**

Modify controller:

```ts
@Get("recent")
findRecent(@Query("routeNumber") routeNumber?: string) {
  return this.busReportsService.findRecent(routeNumber);
}
```

- [ ] **Step 4: Update mobile route history**

When `selectedRoute` changes in `BusArchiveScreen`, fetch `/bus-reports/recent?routeNumber=${selectedRoute}`. Replace the static timer text with a one-second interval using `new Date().toLocaleTimeString("ko-KR", { hour12: false })`.

- [ ] **Step 5: Run checks**

Run:

```bash
npm run test -w @dairuri/api -- bus-reports.service.spec.ts
npm run test -w @dairuri/mobile -- App.test.tsx
npm run typecheck
```

Expected: all commands pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/bus-reports apps/mobile/src/features/bus apps/mobile/src/App.test.tsx
git commit -m "feat: add bus route history"
```

---

### Task 6: Profile and Chat MVP Surfaces

**Files:**
- Create: `apps/api/src/users/users.module.ts`
- Create: `apps/api/src/users/users.controller.ts`
- Create: `apps/api/src/users/users.service.ts`
- Create: `apps/api/src/chat/chat.module.ts`
- Create: `apps/api/src/chat/chat.controller.ts`
- Create: `apps/api/src/chat/chat.service.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/mobile/src/services/api/dairuriApi.ts`
- Modify: `apps/mobile/src/features/profile/ProfileScreen.tsx`
- Modify: `apps/mobile/src/features/chat/ChatScreen.tsx`
- Modify: `apps/mobile/src/App.test.tsx`

- [ ] **Step 1: Add API service tests**

Create `apps/api/src/users/users.service.spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  it("returns the current user's profile summary", () => {
    const service = new UsersService();

    expect(service.findMe()).toMatchObject({
      nickname: "다로리인",
      verifications: ["phone", "region"],
    });
  });
});
```

Create `apps/api/src/chat/chat.service.spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ChatService } from "./chat.service";

describe("ChatService", () => {
  it("returns match-scoped chat room summaries", () => {
    const service = new ChatService();

    expect(service.findMyRooms()[0]).toMatchObject({
      listingTitle: "다로리 카페 매주 같이 가실 분 구해요",
      participantLabel: "다로리인 3명",
    });
  });
});
```

- [ ] **Step 2: Implement API modules**

Expose `GET /users/me` and `GET /chat/rooms`. Return typed summaries using `UserProfileSummary` and `ChatRoomSummary` from `@dairuri/shared`.

- [ ] **Step 3: Register modules**

Modify `apps/api/src/app.module.ts`:

```ts
import { ChatModule } from "./chat/chat.module";
import { UsersModule } from "./users/users.module";

imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  DatabaseModule,
  RidesModule,
  BusReportsModule,
  JobsModule,
  UsersModule,
  ChatModule,
],
```

- [ ] **Step 4: Add mobile API methods**

Add to `apps/mobile/src/services/api/dairuriApi.ts`:

```ts
export function fetchMyProfile(): Promise<UserProfileSummary> {
  return requestJson("/users/me");
}

export function fetchChatRooms(): Promise<ChatRoomSummary[]> {
  return requestJson("/chat/rooms");
}
```

- [ ] **Step 5: Render real profile and chat data**

Update `ProfileScreen` to fetch `fetchMyProfile()` and render nickname, driver years, completed ride count, recommendation rate, and badge labels from `verificationBadgeLabels`.

Update `ChatScreen` to fetch `fetchChatRooms()` and render a list of room summaries with listing title, participant label, last message, and updated time.

- [ ] **Step 6: Run checks**

Run:

```bash
npm run test -w @dairuri/api -- users.service.spec.ts chat.service.spec.ts
npm run test -w @dairuri/mobile -- App.test.tsx
npm run typecheck
```

Expected: all commands pass.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/users apps/api/src/chat apps/api/src/app.module.ts apps/mobile/src/services/api apps/mobile/src/features/profile apps/mobile/src/features/chat apps/mobile/src/App.test.tsx
git commit -m "feat: add profile and chat summaries"
```

---

### Task 7: README, Environment, and Demo Flow

**Files:**
- Modify: `readme.md`
- Modify: `apps/api/.env.example`
- Create: `docs/demo-flow.md`

- [ ] **Step 1: Expand environment example**

Keep `apps/api/.env.example` with:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dairuri
REDIS_URL=redis://localhost:6379
PORT=3000
SKIP_DB_MIGRATIONS=false
```

- [ ] **Step 2: Add demo flow**

Create `docs/demo-flow.md` with:

```md
# Dairuri MVP Demo Flow

1. Start the API with `npm run api`.
2. Start the mobile app with `npm run mobile`.
3. Open the map tab and confirm ride listings load.
4. Open the bus tab, select route 3, and submit one bus sighting.
5. Open the recruitment tab and create one ride post.
6. Open the recruitment tab and create one job post.
7. Open the chat tab and confirm match room summaries appear.
8. Open the profile tab and confirm verification badges appear.
```

- [ ] **Step 3: Update README**

Document:

```md
# 다로리

다로리는 농촌의 부족한 교통, 일자리, 생활 정보 인프라를 지역 주민 연결로 보완하는 동네 기반 생활 인프라 플랫폼입니다.

## 구조

- `apps/api`: NestJS API
- `apps/mobile`: Expo React Native app
- `packages/shared`: shared TypeScript contracts
- `docs`: service plan, implementation plan, and demo docs

## 실행

```bash
npm install
npm run typecheck
npm test
npm run api
npm run mobile
```

## 문서

- [서비스 플랜](docs/dairuri-service-plan.md)
- [MVP 구현 계획](docs/superpowers/plans/2026-05-13-dairuri-mvp.md)
- [데모 플로우](docs/demo-flow.md)
```

- [ ] **Step 4: Run final checks**

Run:

```bash
npm run typecheck
npm test
npm run build
```

Expected: all commands pass.

- [ ] **Step 5: Commit**

```bash
git add readme.md apps/api/.env.example docs
git commit -m "docs: document mvp setup and demo"
```

---

## Final Verification

- [ ] Run:

```bash
npm run typecheck
npm test
npm run build
```

- [ ] Confirm:

```bash
git status -sb
```

Expected: only ignored generated files remain untracked, or the tree is clean.

- [ ] Push the branch:

```bash
git push -u origin "$(git branch --show-current)"
```

- [ ] Open a draft pull request into `main` with a body that lists:

```md
## Summary

- Adds the monorepo baseline for Dairuri API, mobile app, and shared contracts
- Documents the Dairuri service plan
- Adds the MVP implementation plan

## Validation

- npm run typecheck
- npm test
- npm run build
```

## Scope Review

- The plan covers ride posting, job posting, bus sightings, profile verification display, chat room summaries, documentation, and verification.
- Authentication, payment, real-time chat, push notifications, map provider keys, production deployment, and admin tooling are intentionally outside this MVP plan because the current codebase has no auth boundary, no deployment target, and no production data model yet.
- The first production-grade security task after this MVP should be phone/region verification with authenticated user identity; do not ship public write endpoints to production before that is designed.
