import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import type {
  Application,
  ApplicationDetail,
  AuthSession,
  ChangePasswordInput,
  ChatMessage,
  ChatRoom,
  DriverType,
  LoginInput,
  MannerRatingResult,
  Post,
  SignupInput,
  UpdateUserProfileInput,
  UserProfile,
} from "../../types/domain";
import { getPostgresPool } from "../db/postgres";
import {
  assertPhoneVerificationProof,
  consumePhoneVerificationProof,
} from "./phoneVerification";
import { hashSessionToken } from "./sessionCrypto";

type UserRow = {
  id: string;
  login_id?: string | null;
  nickname: string;
  real_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  area: string | null;
  temperature: string | number;
  driver_type: "driver" | "non_driver";
  license_verified?: boolean | null;
  insurance_verified?: boolean | null;
  driver_verified_at?: Date | null;
  password_hash?: string | null;
  plate_number?: string | null;
  model_name?: string | null;
  vehicle_images?: string[] | null;
};

type PostRow = {
  id: string;
  type: "job" | "carpool";
  title: string;
  body: string;
  image_urls: string[];
  liked: boolean;
  status: "open" | "closed";
  created_at: Date;
  place_name: string | null;
  place_address: string | null;
  departure: string | null;
  destination: string | null;
  days: string[];
  start_time: string | null;
  end_time: string | null;
  wage_type: "hourly" | "monthly" | null;
  wage_amount: number | null;
  job_category: string | null;
  profile_mode: "resource" | null;
  available_tasks: string[];
  employment_types: Array<"fullTime" | "partTime" | "shortTerm">;
  preferred_pay: string | null;
  availability_note: string | null;
  contact_note: string | null;
  price: number | null;
  seats: number | null;
  author_id: string;
  author_nickname: string;
  author_real_name: string | null;
  author_phone: string | null;
  author_email: string | null;
  author_avatar_url: string | null;
  author_area: string | null;
  author_temperature: string | number;
  author_driver_type: "driver" | "non_driver";
  author_license_verified?: boolean | null;
  author_insurance_verified?: boolean | null;
  author_driver_verified_at?: Date | null;
  author_plate_number: string | null;
  author_model_name: string | null;
  author_vehicle_images: string[] | null;
};

type ApplicationRow = {
  id: string;
  post_id: string;
  intro: string;
  status: Application["status"];
  rejection_reason: string | null;
  created_at: Date;
  applicant_id: string;
  applicant_nickname: string;
  applicant_real_name: string | null;
  applicant_phone: string | null;
  applicant_email: string | null;
  applicant_avatar_url: string | null;
  applicant_area: string | null;
  applicant_temperature: string | number;
  applicant_driver_type: "driver" | "non_driver";
  applicant_license_verified?: boolean | null;
  applicant_insurance_verified?: boolean | null;
  applicant_driver_verified_at?: Date | null;
  applicant_plate_number: string | null;
  applicant_model_name: string | null;
  applicant_vehicle_images: string[] | null;
};

type ApplicationReviewRow = {
  application_id: string;
  post_id: string;
  applicant_id: string;
  author_id: string;
  post_title: string;
  post_type: "job" | "carpool";
  place_name: string | null;
  departure: string | null;
  destination: string | null;
  days: string[];
  start_time: string | null;
  end_time: string | null;
  job_category: string | null;
  status: Application["status"];
};

type ReportRow = {
  id: string;
  room_id: string | null;
  reason: string;
  created_at: Date;
};

type DatabasePostStatus = "open" | "closed";

type CreatePostInput = Partial<Post> & {
  days?: Post["days"];
  departure?: string;
  destination?: string;
  endTime?: string;
  imageUrls?: string[];
  jobCategory?: string;
  profileMode?: "resource";
  availableTasks?: string[];
  employmentTypes?: Array<"fullTime" | "partTime" | "shortTerm">;
  preferredPay?: string;
  availabilityNote?: string;
  contactNote?: string;
  placeAddress?: string;
  placeName?: string;
  price?: number;
  seats?: number;
  startTime?: string;
  wageAmount?: number;
  wageType?: "hourly" | "monthly";
};

type CreatePostMeta = {
  id: string;
  authorId: string;
  createdAt: string;
};

export type CreatePostRecord = {
  id: string;
  type: "job" | "carpool";
  title: string;
  body: string;
  authorId: string;
  imageUrls: string[];
  status: DatabasePostStatus;
  placeName: string | null;
  placeAddress: string | null;
  departure: string | null;
  destination: string | null;
  days: Post["days"];
  startTime: string | null;
  endTime: string | null;
  wageType: "hourly" | "monthly" | null;
  wageAmount: number | null;
  jobCategory: string | null;
  profileMode: "resource" | null;
  availableTasks: string[];
  employmentTypes: Array<"fullTime" | "partTime" | "shortTerm">;
  preferredPay: string | null;
  availabilityNote: string | null;
  contactNote: string | null;
  price: number | null;
  seats: number | null;
  createdAt: string;
};

export class CreatePostInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreatePostInputError";
  }
}

export class RepositoryNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryNotFoundError";
  }
}

export class RepositoryAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryAuthorizationError";
  }
}

export class RepositoryInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryInputError";
  }
}

const AUTH_SESSION_TTL_DAYS = 30;

export async function registerUser(input: SignupInput): Promise<AuthSession> {
  const loginId = validateLoginId(input.loginId);
  const nickname = requiredRepositoryText(input.nickname, "nickname");
  const phone = requiredRepositoryText(input.phone, "phone");
  const password = validatePassword(input.password);
  const driverType = toDatabaseDriverType(input.driverType);
  const email = optionalText(input.email);
  const realName = optionalText(input.realName) ?? nickname;
  const userId = `user-${randomUUID()}`;
  const driverVerified =
    input.driverType === "driver" && Boolean(input.vehicle?.plateNumber?.trim());
  assertPhoneVerificationProof(input.phoneVerification);

  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    await consumePhoneVerificationProof(client, phone, input.phoneVerification);
    await client.query(
      `
        insert into users (
          id, login_id, nickname, real_name, phone, email, driver_type,
          license_verified, insurance_verified, driver_verified_at, password_hash
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, case when $10 then now() else null end, $11)
      `,
      [
        userId,
        loginId,
        nickname,
        realName,
        phone,
        email,
        driverType,
        driverVerified,
        driverVerified,
        driverVerified,
        hashPassword(password),
      ],
    );

    if (input.driverType === "driver" && input.vehicle?.plateNumber?.trim()) {
      await client.query(
        `
          insert into vehicles (
            id, user_id, plate_number, model_name, image_urls
          ) values ($1, $2, $3, $4, $5)
        `,
        [
          `vehicle-${randomUUID()}`,
          userId,
          input.vehicle.plateNumber.trim(),
          optionalText(input.vehicle.modelName),
          input.vehicle.images ?? [],
        ],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    if (isUniqueViolation(error)) {
      throw new RepositoryInputError("phone, email, or login id is already registered");
    }
    throw error;
  } finally {
    client.release();
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new RepositoryNotFoundError("created user not found");
  }

  return createAuthSessionForUser(user);
}

export async function authenticateUser(input: LoginInput): Promise<AuthSession> {
  const identifier = requiredRepositoryText(input.identifier, "identifier");
  const password = requiredRepositoryText(input.password, "password");
  const { rows } = await getPostgresPool().query<UserRow>(
    `
      ${userSelectSql()}
      where u.phone = $1 or u.email = $1 or u.login_id = $1 or u.id = $1
      limit 1
    `,
    [identifier],
  );
  const row = rows[0];

  if (!row?.password_hash || !verifyPassword(password, row.password_hash)) {
    throw new RepositoryAuthorizationError("invalid credentials");
  }

  return createAuthSessionForUser(mapUserRow(row));
}

export async function checkLoginIdAvailability(loginIdInput: string) {
  const loginId = validateLoginId(loginIdInput);
  const { rows } = await getPostgresPool().query<{ exists: boolean }>(
    `
      select exists(
        select 1 from users
        where login_id = $1 or id = $1
      ) as exists
    `,
    [loginId],
  );

  return { available: !rows[0]?.exists };
}

export async function changeUserPassword(
  userId: string,
  input: ChangePasswordInput,
) {
  const currentPassword = requiredRepositoryText(
    input.currentPassword,
    "currentPassword",
  );
  const newPassword = validatePassword(input.newPassword);
  const { rows } = await getPostgresPool().query<{ password_hash: string | null }>(
    "select password_hash from users where id = $1",
    [userId],
  );

  if (!rows[0]) {
    throw new RepositoryNotFoundError("user not found");
  }

  if (
    !rows[0].password_hash ||
    !verifyPassword(currentPassword, rows[0].password_hash)
  ) {
    throw new RepositoryAuthorizationError("invalid current password");
  }

  await getPostgresPool().query(
    "update users set password_hash = $2, updated_at = now() where id = $1",
    [userId, hashPassword(newPassword)],
  );
}

export async function deleteUserAccount(userId: string) {
  const pool = getPostgresPool();
  const client = await pool.connect();
  let deleted = false;

  try {
    await client.query("begin");
    await client.query("delete from posts where author_id = $1", [userId]);
    await client.query("delete from auth_sessions where user_id = $1", [userId]);
    const { rowCount } = await client.query("delete from users where id = $1", [
      userId,
    ]);
    await client.query(
      `
        delete from chat_rooms cr
        where not exists (
          select 1 from chat_room_participants crp where crp.room_id = cr.id
        )
      `,
    );
    await client.query("commit");
    deleted = Boolean(rowCount);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  if (!deleted) {
    throw new RepositoryNotFoundError("user not found");
  }
}

export async function createReport(
  roomId: string,
  reason: string,
  reporterId: string,
) {
  const normalizedReason = requiredRepositoryText(reason, "reason");
  await assertRoomParticipant(roomId, reporterId);
  const { rows: participantRows } = await getPostgresPool().query<{
    user_id: string;
  }>(
    `
      select user_id
      from chat_room_participants
      where room_id = $1 and user_id <> $2
      order by created_at asc
      limit 1
    `,
    [roomId, reporterId],
  );
  const { rows } = await getPostgresPool().query<ReportRow>(
    `
      insert into reports (
        id, reporter_id, room_id, reported_user_id, reason, created_at
      ) values ($1, $2, $3, $4, $5, now())
      returning id, room_id, reason, created_at
    `,
    [
      `report-${randomUUID()}`,
      reporterId,
      roomId,
      participantRows[0]?.user_id ?? null,
      normalizedReason,
    ],
  );

  return {
    id: rows[0].id,
    roomId: rows[0].room_id ?? undefined,
    reason: rows[0].reason,
    createdAt: rows[0].created_at.toISOString(),
  };
}

export async function createMannerRating(
  roomId: string,
  tags: string[],
  raterId: string,
): Promise<MannerRatingResult> {
  await assertRoomParticipant(roomId, raterId);
  const normalizedTags = normalizeMannerTags(tags);
  const targetUserId = await getFirstOtherParticipantId(roomId, raterId);
  const nextDelta = calculateMannerTemperatureDelta(normalizedTags);
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query("begin");
    const { rows } = await client.query<{ temperature_delta: string | number }>(
      `
        select temperature_delta
        from manner_ratings
        where room_id = $1 and rater_id = $2 and target_user_id = $3
        for update
      `,
      [roomId, raterId, targetUserId],
    );
    const previousDelta = rows[0] ? Number(rows[0].temperature_delta) : 0;

    await client.query(
      `
        insert into manner_ratings (
          id, room_id, rater_id, target_user_id, tags, temperature_delta, created_at
        ) values ($1, $2, $3, $4, $5, $6, now())
        on conflict (room_id, rater_id, target_user_id) do update set
          tags = excluded.tags,
          temperature_delta = excluded.temperature_delta,
          created_at = now()
      `,
      [
        `manner-${randomUUID()}`,
        roomId,
        raterId,
        targetUserId,
        normalizedTags,
        nextDelta,
      ],
    );

    const { rows: userRows } = await client.query<{ temperature: string | number }>(
      `
        update users
        set temperature = least(100, greatest(0, temperature - $2 + $3)),
            updated_at = now()
        where id = $1
        returning temperature
      `,
      [targetUserId, previousDelta, nextDelta],
    );

    await client.query("commit");

    return {
      targetUserId,
      temperature: Number(userRows[0].temperature),
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function getFirstOtherParticipantId(roomId: string, userId: string) {
  const { rows } = await getPostgresPool().query<{ user_id: string }>(
    `
      select user_id
      from chat_room_participants
      where room_id = $1 and user_id <> $2
      order by created_at asc
      limit 1
    `,
    [roomId, userId],
  );

  const targetUserId = rows[0]?.user_id;
  if (!targetUserId) {
    throw new RepositoryInputError("manner rating target is missing");
  }

  return targetUserId;
}

function normalizeMannerTags(tags: string[]) {
  if (!Array.isArray(tags)) {
    throw new RepositoryInputError("manner tags are required");
  }

  const normalizedTags = Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  );
  if (normalizedTags.length === 0) {
    throw new RepositoryInputError("manner tags are required");
  }

  return normalizedTags.slice(0, 6);
}

function calculateMannerTemperatureDelta(tags: string[]) {
  return Math.min(1.2, Math.max(0.3, tags.length * 0.3));
}

type ChatRoomRow = {
  id: string;
  post_id: string | null;
  title: string;
  subtitle: string | null;
  last_message: string | null;
};

type ChatMessageRow = {
  id: string;
  room_id: string;
  sender_id: string | null;
  type: "system" | "text" | "image";
  text: string | null;
  image_url: string | null;
  created_at: Date;
};

export async function listPosts(viewerUserId?: string): Promise<Post[]> {
  const { rows } = await getPostgresPool().query<PostRow>(postSelectSql(), [
    viewerUserId ?? null,
  ]);
  return rows.map(mapPostRow);
}

export async function getPostById(
  id: string,
  viewerUserId?: string,
): Promise<Post | undefined> {
  const { rows } = await getPostgresPool().query<PostRow>(
    `${postSelectSql()} where p.id = $2`,
    [viewerUserId ?? null, id],
  );
  return rows[0] ? mapPostRow(rows[0]) : undefined;
}

export async function createPost(
  input: Partial<Post>,
  userId: string,
): Promise<Post> {
  const id = `post-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const record = normalizeCreatePostInput(input, {
    id,
    authorId: userId,
    createdAt,
  });

  await getPostgresPool().query(
    `
      insert into posts (
        id, type, title, body, author_id, image_urls, status,
        place_name, place_address, departure, destination, days,
        start_time, end_time, wage_type, wage_amount, job_category,
        profile_mode, available_tasks, employment_types, preferred_pay,
        availability_note, contact_note, price, seats, created_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23, $24, $25, $26
      )
    `,
    [
      record.id,
      record.type,
      record.title,
      record.body,
      record.authorId,
      record.imageUrls,
      record.status,
      record.placeName,
      record.placeAddress,
      record.departure,
      record.destination,
      record.days,
      record.startTime,
      record.endTime,
      record.wageType,
      record.wageAmount,
      record.jobCategory,
      record.profileMode,
      record.availableTasks,
      record.employmentTypes,
      record.preferredPay,
      record.availabilityNote,
      record.contactNote,
      record.price,
      record.seats,
      record.createdAt,
    ],
  );

  const post = await getPostById(id, userId);
  if (!post) {
    throw new Error(`created post missing: ${id}`);
  }

  return post;
}

export function normalizeCreatePostInput(
  input: CreatePostInput,
  meta: CreatePostMeta,
): CreatePostRecord {
  if (input.type !== "job" && input.type !== "carpool") {
    throw new CreatePostInputError("post type is required");
  }

  const base = {
    id: meta.id,
    title: requiredText(input.title, "title"),
    body: requiredText(input.body, "body"),
    authorId: meta.authorId,
    imageUrls: optionalTextArray(input.imageUrls, "imageUrls") ?? [],
    status: toDatabasePostStatus(input.status),
    days: optionalWeekdayArray(input.days, "days") ?? [],
    startTime: optionalPostText(input.startTime, "startTime"),
    endTime: optionalPostText(input.endTime, "endTime"),
    createdAt: meta.createdAt,
  };

  if (input.type === "job") {
    const placeName = optionalPostText(input.placeName, "placeName");
    const wageAmount = optionalNumber(input.wageAmount, "wageAmount");
    if (!placeName || wageAmount == null) {
      throw new CreatePostInputError("job post requires placeName and wageAmount");
    }

    return {
      ...base,
      type: "job",
      placeName,
      placeAddress: optionalPostText(input.placeAddress, "placeAddress"),
      departure: null,
      destination: null,
      wageType: optionalWageType(input.wageType) ?? "hourly",
      wageAmount,
      jobCategory: optionalPostText(input.jobCategory, "jobCategory"),
      profileMode: optionalProfileMode(input.profileMode),
      availableTasks: optionalTextArray(input.availableTasks, "availableTasks") ?? [],
      employmentTypes: optionalEmploymentTypes(input.employmentTypes),
      preferredPay: optionalPostText(input.preferredPay, "preferredPay"),
      availabilityNote: optionalPostText(input.availabilityNote, "availabilityNote"),
      contactNote: optionalPostText(input.contactNote, "contactNote"),
      price: null,
      seats: null,
    };
  }

  const departure = optionalPostText(input.departure, "departure");
  const destination = optionalPostText(input.destination, "destination");
  if (!departure || !destination) {
    throw new CreatePostInputError("carpool post requires departure and destination");
  }

  return {
    ...base,
    type: "carpool",
    placeName: null,
    placeAddress: null,
    departure,
    destination,
    wageType: null,
    wageAmount: null,
    jobCategory: null,
    profileMode: null,
    availableTasks: [],
    employmentTypes: [],
    preferredPay: null,
    availabilityNote: null,
    contactNote: null,
    price: null,
    seats: optionalNumber(input.seats, "seats"),
  };
}

export async function togglePostLike(
  postId: string,
  userId: string,
): Promise<Post | undefined> {
  const pool = getPostgresPool();
  const existing = await pool.query(
    "select 1 from post_likes where post_id = $1 and user_id = $2",
    [postId, userId],
  );

  if (existing.rowCount) {
    await pool.query("delete from post_likes where post_id = $1 and user_id = $2", [
      postId,
      userId,
    ]);
  } else {
    await pool.query(
      "insert into post_likes (post_id, user_id) values ($1, $2) on conflict do nothing",
      [postId, userId],
    );
  }

  return getPostById(postId, userId);
}

export async function createApplication(
  postId: string,
  intro: string,
  userId: string,
): Promise<Application> {
  const postOwner = await getPostgresPool().query<{ author_id: string }>(
    "select author_id from posts where id = $1",
    [postId],
  );

  if (!postOwner.rowCount) {
    throw new RepositoryNotFoundError("post not found");
  }

  if (postOwner.rows[0].author_id === userId) {
    throw new RepositoryAuthorizationError("cannot apply to your own post");
  }

  const id = `application-${randomUUID()}`;
  const createdAt = new Date().toISOString();

  const inserted = await getPostgresPool().query<{ id: string }>(
    `
      insert into applications (id, post_id, applicant_id, intro, status, created_at)
      values ($1, $2, $3, $4, 'pending', $5)
      on conflict (post_id, applicant_id) do nothing
      returning id
    `,
    [id, postId, userId, intro, createdAt],
  );

  const application =
    (inserted.rows[0] ? await getApplicationById(inserted.rows[0].id) : undefined) ??
    (
      await getPostgresPool().query<ApplicationRow>(
        `${applicationSelectSql()} where a.post_id = $1 and a.applicant_id = $2`,
        [postId, userId],
      )
    ).rows.map(mapApplicationRow)[0];

  if (!application) {
    throw new Error(`created application missing: ${id}`);
  }

  return application;
}

export async function getApplicationById(
  applicationId: string,
): Promise<Application | undefined> {
  const { rows } = await getPostgresPool().query<ApplicationRow>(
    `${applicationSelectSql()} where a.id = $1`,
    [applicationId],
  );

  return rows[0] ? mapApplicationRow(rows[0]) : undefined;
}

export async function getApplicationDetail(
  applicationId: string,
  viewerUserId: string,
): Promise<ApplicationDetail> {
  const application = await getApplicationById(applicationId);
  if (!application) {
    throw new RepositoryNotFoundError("application not found");
  }

  const post = await getPostById(application.postId, viewerUserId);
  if (!post) {
    throw new RepositoryNotFoundError("post not found");
  }

  assertCanReadApplication(application, post, viewerUserId);
  return { application, post };
}

export async function listApplicationsForPost(
  postId: string,
  reviewerUserId: string,
): Promise<Application[]> {
  const post = await getPostById(postId, reviewerUserId);
  if (!post) {
    throw new RepositoryNotFoundError("post not found");
  }

  if (post.author.id !== reviewerUserId) {
    throw new RepositoryAuthorizationError("only the post author can review applications");
  }

  const { rows } = await getPostgresPool().query<ApplicationRow>(
    `${applicationSelectSql()} where a.post_id = $1 order by a.created_at desc`,
    [postId],
  );

  return rows.map(mapApplicationRow);
}

export async function listReceivedApplicationDetails(
  reviewerUserId: string,
): Promise<ApplicationDetail[]> {
  const { rows } = await getPostgresPool().query<ApplicationRow>(
    `
      ${applicationSelectSql()}
      join posts p on p.id = a.post_id
      where p.author_id = $1 and a.status = 'pending'
      order by a.created_at desc
    `,
    [reviewerUserId],
  );

  return Promise.all(
    rows.map(async (row) => {
      const application = mapApplicationRow(row);
      const post = await getPostById(application.postId, reviewerUserId);
      if (!post) {
        throw new RepositoryNotFoundError("post not found");
      }
      return { application, post };
    }),
  );
}

export async function acceptApplicationAndCreateChatRoom(
  applicationId: string,
  reviewerUserId: string,
): Promise<ChatRoom> {
  const pool = getPostgresPool();
  const client = await pool.connect();
  const roomId = `room-${applicationId}`;
  const systemMessageId = `system-${applicationId}-accepted`;

  try {
    await client.query("begin");

    const { rows } = await client.query<ApplicationReviewRow>(
      `
        select
          a.id as application_id,
          a.post_id,
          a.applicant_id,
          p.author_id,
          p.title as post_title,
          p.type as post_type,
          p.place_name,
          p.departure,
          p.destination,
          p.days,
          p.start_time,
          p.end_time,
          p.job_category,
          a.status
        from applications a
        join posts p on p.id = a.post_id
        where a.id = $1
        for update
      `,
      [applicationId],
    );
    const review = rows[0];

    if (!review) {
      throw new RepositoryNotFoundError("application not found");
    }

    if (review.author_id !== reviewerUserId) {
      throw new RepositoryAuthorizationError("only the post author can accept applications");
    }

    if (review.status === "rejected") {
      throw new RepositoryInputError("rejected application cannot be accepted");
    }

    await client.query(
      `
        update applications
        set status = 'accepted', rejection_reason = null, updated_at = now()
        where id = $1
      `,
      [applicationId],
    );

    await client.query(
      `
        insert into chat_rooms (id, post_id, title, subtitle, created_at, updated_at)
        values ($1, $2, $3, $4, now(), now())
        on conflict (id) do update set
          title = excluded.title,
          subtitle = excluded.subtitle,
          updated_at = now()
      `,
      [
        roomId,
        review.post_id,
        buildChatRoomTitle(review),
        buildChatRoomSubtitle(review),
      ],
    );

    await client.query(
      `
        insert into chat_room_participants (room_id, user_id)
        values ($1, $2), ($1, $3)
        on conflict (room_id, user_id) do nothing
      `,
      [roomId, review.author_id, review.applicant_id],
    );

    await client.query(
      `
        insert into chat_messages (id, room_id, sender_id, type, text, created_at)
        values ($1, $2, null, 'system', $3, now())
        on conflict (id) do nothing
      `,
      [systemMessageId, roomId, "매칭이 시작되었습니다."],
    );

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  const room = await getChatRoomById(roomId, reviewerUserId);
  if (!room) {
    throw new Error(`created chat room missing: ${roomId}`);
  }
  return room;
}

export async function rejectApplication(
  applicationId: string,
  reviewerUserId: string,
  rejectionReason?: string,
) {
  const review = await assertApplicationReviewer(applicationId, reviewerUserId);
  if (review.status === "accepted") {
    throw new RepositoryInputError("accepted application cannot be rejected");
  }

  const { rowCount } = await getPostgresPool().query(
    `
      update applications
      set status = 'rejected', rejection_reason = $2, updated_at = now()
      where id = $1 and status = 'pending'
    `,
    [applicationId, rejectionReason ?? null],
  );

  if (!rowCount) {
    throw new RepositoryInputError("application is not pending");
  }
}

export async function listChatRooms(userId: string): Promise<ChatRoom[]> {
  const { rows } = await getPostgresPool().query<ChatRoomRow>(
    `
    select
      cr.id,
      cr.post_id,
      cr.title,
      cr.subtitle,
      (
        select cm.text
        from chat_messages cm
        where cm.room_id = cr.id
        order by cm.created_at desc
        limit 1
      ) as last_message
    from chat_rooms cr
    join chat_room_participants current_participant
      on current_participant.room_id = cr.id and current_participant.user_id = $1
    order by cr.updated_at desc, cr.created_at desc
  `,
    [userId],
  );

  return Promise.all(
    rows.map(async (room) => ({
      id: room.id,
      title: room.title,
      subtitle: room.subtitle ?? undefined,
      participants: await listRoomParticipants(room.id),
      postId: room.post_id ?? undefined,
      lastMessage: room.last_message ?? undefined,
      unreadCount: 0,
    })),
  );
}

export async function getChatRoomById(
  roomId: string,
  userId: string,
): Promise<ChatRoom | undefined> {
  await assertRoomParticipant(roomId, userId);
  const { rows } = await getPostgresPool().query<ChatRoomRow>(
    `
      select
        cr.id,
        cr.post_id,
        cr.title,
        cr.subtitle,
        (
          select cm.text
          from chat_messages cm
          where cm.room_id = cr.id
          order by cm.created_at desc
          limit 1
        ) as last_message
      from chat_rooms cr
      where cr.id = $1
    `,
    [roomId],
  );

  const room = rows[0];
  if (!room) {
    return undefined;
  }

  return {
    id: room.id,
    title: room.title,
    subtitle: room.subtitle ?? undefined,
    participants: await listRoomParticipants(room.id),
    postId: room.post_id ?? undefined,
    lastMessage: room.last_message ?? undefined,
    unreadCount: 0,
  };
}

export async function listChatMessages(
  roomId: string,
  userId: string,
): Promise<ChatMessage[]> {
  await assertRoomParticipant(roomId, userId);
  const { rows } = await getPostgresPool().query<ChatMessageRow>(
    `
      select id, room_id, sender_id, type, text, image_url, created_at
      from chat_messages
      where room_id = $1
      order by created_at asc
    `,
    [roomId],
  );

  return rows.map((message) => ({
    id: message.id,
    roomId: message.room_id,
    senderId: message.sender_id ?? undefined,
    type: message.type,
    text: message.text ?? undefined,
    imageUrl: message.image_url ?? undefined,
    createdAt: message.created_at.toISOString(),
  }));
}

export async function createChatMessage(
  roomId: string,
  input: { text?: string; imageUrl?: string },
  userId: string,
): Promise<ChatMessage> {
  await assertRoomParticipant(roomId, userId);
  const text = optionalText(input.text);
  const imageUrl = optionalText(input.imageUrl);
  const type = imageUrl ? "image" : "text";
  if (type === "text" && !text) {
    throw new RepositoryInputError("text is required");
  }
  const id = `message-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const { rows } = await getPostgresPool().query<ChatMessageRow>(
    `
      insert into chat_messages (id, room_id, sender_id, type, text, image_url, created_at)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning id, room_id, sender_id, type, text, image_url, created_at
    `,
    [id, roomId, userId, type, text, imageUrl, createdAt],
  );

  return {
    id: rows[0].id,
    roomId: rows[0].room_id,
    senderId: rows[0].sender_id ?? undefined,
    type: rows[0].type,
    text: rows[0].text ?? undefined,
    imageUrl: rows[0].image_url ?? undefined,
    createdAt: rows[0].created_at.toISOString(),
  };
}

export async function getUserById(id: string): Promise<UserProfile | undefined> {
  const { rows } = await getPostgresPool().query<UserRow>(
    `
      select
        u.id,
        u.login_id,
        u.nickname,
        u.real_name,
        u.phone,
        u.email,
        u.avatar_url,
        u.area,
        u.temperature,
        u.driver_type,
        u.license_verified,
        u.insurance_verified,
        u.driver_verified_at,
        v.plate_number,
        v.model_name,
        v.image_urls as vehicle_images
      from users u
      left join vehicles v on v.user_id = u.id
      where u.id = $1
    `,
    [id],
  );
  return rows[0] ? mapUserRow(rows[0]) : undefined;
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UserProfile> {
  const nickname = input.nickname === undefined ? undefined : optionalText(input.nickname);
  if (input.nickname !== undefined && !nickname) {
    throw new RepositoryInputError("nickname is required");
  }

  const driverType =
    input.driverType === undefined ? undefined : toDatabaseDriverType(input.driverType);
  if (input.driverType === "driver") {
    const currentUser = await getUserById(userId);
    if (
      !currentUser?.driverVerification?.licenseVerified ||
      !currentUser.driverVerification.insuranceVerified
    ) {
      throw new RepositoryInputError(
        "driver verification is required before switching to driver",
      );
    }
  }
  const avatarUrl =
    input.avatarUrl === undefined
      ? undefined
      : input.avatarUrl === null
        ? null
        : optionalText(input.avatarUrl);

  const { rowCount } = await getPostgresPool().query(
    `
      update users
      set
        nickname = coalesce($2, nickname),
        driver_type = coalesce($3, driver_type),
        avatar_url = case when $4::boolean then $5 else avatar_url end,
        updated_at = now()
      where id = $1
    `,
    [userId, nickname ?? null, driverType ?? null, input.avatarUrl !== undefined, avatarUrl],
  );

  if (!rowCount) {
    throw new RepositoryNotFoundError("user not found");
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new RepositoryNotFoundError("user not found");
  }

  return user;
}

export async function listUserPosts(
  userId: string,
  viewerUserId: string,
): Promise<Post[]> {
  const { rows } = await getPostgresPool().query<PostRow>(
    `${postSelectSql()} where p.author_id = $2 order by p.created_at desc`,
    [viewerUserId, userId],
  );

  return rows.map(mapPostRow);
}

export async function listSavedPosts(userId: string): Promise<Post[]> {
  const { rows } = await getPostgresPool().query<PostRow>(
    `
      ${postSelectSql()}
      where exists (
        select 1 from post_likes pl
        where pl.post_id = p.id and pl.user_id = $2
      )
      order by p.created_at desc
    `,
    [userId, userId],
  );

  return rows.map(mapPostRow);
}

function applicationSelectSql() {
  return `
    select
      a.id,
      a.post_id,
      a.intro,
      a.status,
      a.rejection_reason,
      a.created_at,
      u.id as applicant_id,
      u.nickname as applicant_nickname,
      u.real_name as applicant_real_name,
      u.phone as applicant_phone,
      u.email as applicant_email,
      u.avatar_url as applicant_avatar_url,
      u.area as applicant_area,
      u.temperature as applicant_temperature,
      u.driver_type as applicant_driver_type,
      u.license_verified as applicant_license_verified,
      u.insurance_verified as applicant_insurance_verified,
      u.driver_verified_at as applicant_driver_verified_at,
      v.plate_number as applicant_plate_number,
      v.model_name as applicant_model_name,
      v.image_urls as applicant_vehicle_images
    from applications a
    join users u on u.id = a.applicant_id
    left join vehicles v on v.user_id = u.id
  `;
}

function mapApplicationRow(row: ApplicationRow): Application {
  return {
    id: row.id,
    postId: row.post_id,
    applicant: {
      id: row.applicant_id,
      nickname: row.applicant_nickname,
      realName: row.applicant_real_name ?? undefined,
      phone: row.applicant_phone ?? undefined,
      email: row.applicant_email ?? undefined,
      avatarUrl: row.applicant_avatar_url ?? undefined,
      area: row.applicant_area ?? undefined,
      temperature: Number(row.applicant_temperature),
      driverType: fromDatabaseDriverType(row.applicant_driver_type),
      driverVerification: mapDriverVerification({
        license_verified: row.applicant_license_verified,
        insurance_verified: row.applicant_insurance_verified,
        driver_verified_at: row.applicant_driver_verified_at,
      }),
      vehicle: row.applicant_plate_number
        ? {
            plateNumber: row.applicant_plate_number,
            modelName: row.applicant_model_name ?? undefined,
            images: row.applicant_vehicle_images ?? [],
          }
        : undefined,
    },
    intro: row.intro,
    status: row.status,
    rejectionReason: row.rejection_reason ?? undefined,
    createdAt: row.created_at.toISOString(),
  };
}

function sanitizePublicUser(user: UserProfile): UserProfile {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    area: user.area,
    temperature: user.temperature,
    driverType: user.driverType,
    vehicle: user.vehicle
      ? {
          modelName: user.vehicle.modelName,
          images: user.vehicle.images,
          plateNumber: maskPlateNumber(user.vehicle.plateNumber),
        }
      : undefined,
  };
}

function assertCanReadApplication(
  application: Application,
  post: Post,
  viewerUserId: string,
) {
  if (post.author.id === viewerUserId || application.applicant.id === viewerUserId) {
    return;
  }

  throw new RepositoryAuthorizationError("application is not visible to this user");
}

async function assertApplicationReviewer(
  applicationId: string,
  reviewerUserId: string,
): Promise<{ authorId: string; status: Application["status"] }> {
  const { rows } = await getPostgresPool().query<{
    author_id: string;
    status: Application["status"];
  }>(
    `
      select p.author_id, a.status
      from applications a
      join posts p on p.id = a.post_id
      where a.id = $1
    `,
    [applicationId],
  );

  if (!rows[0]) {
    throw new RepositoryNotFoundError("application not found");
  }

  if (rows[0].author_id !== reviewerUserId) {
    throw new RepositoryAuthorizationError("only the post author can review applications");
  }

  return { authorId: rows[0].author_id, status: rows[0].status };
}

async function assertRoomParticipant(roomId: string, userId: string) {
  const { rows } = await getPostgresPool().query<{
    room_exists: boolean;
    participant_exists: boolean;
  }>(
    `
      select
        exists(select 1 from chat_rooms where id = $1) as room_exists,
        exists(
          select 1
          from chat_room_participants
          where room_id = $1 and user_id = $2
        ) as participant_exists
    `,
    [roomId, userId],
  );

  if (!rows[0]?.room_exists) {
    throw new RepositoryNotFoundError("chat room not found");
  }

  if (!rows[0].participant_exists) {
    throw new RepositoryAuthorizationError("chat room is not visible to this user");
  }
}

function buildChatRoomTitle(review: ApplicationReviewRow) {
  return review.post_title;
}

function buildChatRoomSubtitle(review: ApplicationReviewRow) {
  if (review.post_type === "job") {
    return `${review.place_name ?? "모집 장소"} / ${review.job_category ?? "인재 풀 등록"}`;
  }

  const days = review.days.join(", ");
  const time = [review.start_time, review.end_time].filter(Boolean).join(" - ");
  return `${review.departure ?? "출발지"} > ${review.destination ?? "도착지"} / ${days} ${time}`.trim();
}

async function listRoomParticipants(roomId: string): Promise<UserProfile[]> {
  const { rows } = await getPostgresPool().query<UserRow>(
    `
      select
        u.id,
        u.login_id,
        u.nickname,
        u.real_name,
        u.phone,
        u.email,
        u.avatar_url,
        u.area,
        u.temperature,
        u.driver_type,
        u.license_verified,
        u.insurance_verified,
        u.driver_verified_at,
        v.plate_number,
        v.model_name,
        v.image_urls as vehicle_images
      from chat_room_participants crp
      join users u on u.id = crp.user_id
      left join vehicles v on v.user_id = u.id
      where crp.room_id = $1
      order by crp.created_at asc
    `,
    [roomId],
  );
  return rows.map(mapUserRow);
}

function postSelectSql() {
  return `
    select
      p.*,
      exists(
        select 1 from post_likes pl
        where pl.post_id = p.id and pl.user_id = $1
      ) as liked,
      u.id as author_id,
      u.nickname as author_nickname,
      u.real_name as author_real_name,
      u.phone as author_phone,
      u.email as author_email,
      u.avatar_url as author_avatar_url,
      u.area as author_area,
      u.temperature as author_temperature,
      u.driver_type as author_driver_type,
      u.license_verified as author_license_verified,
      u.insurance_verified as author_insurance_verified,
      u.driver_verified_at as author_driver_verified_at,
      v.plate_number as author_plate_number,
      v.model_name as author_model_name,
      v.image_urls as author_vehicle_images
    from posts p
    join users u on u.id = p.author_id
    left join vehicles v on v.user_id = u.id
  `;
}

function mapPostRow(row: PostRow): Post {
  const base = {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    author: mapAuthor(row),
    imageUrls: row.image_urls ?? [],
    liked: row.liked,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };

  if (row.type === "job") {
    return {
      ...base,
      type: "job",
      placeName: row.place_name ?? "",
      placeAddress: row.place_address ?? undefined,
      days: row.days as Post["days"],
      startTime: row.start_time ?? "",
      endTime: row.end_time ?? "",
      wageType: row.wage_type ?? "hourly",
      wageAmount: row.wage_amount ?? 0,
      jobCategory: row.job_category ?? undefined,
      profileMode: row.profile_mode ?? undefined,
      availableTasks: row.available_tasks ?? [],
      employmentTypes: row.employment_types ?? [],
      preferredPay: row.preferred_pay ?? undefined,
      availabilityNote: row.availability_note ?? undefined,
      contactNote: row.contact_note ?? undefined,
    };
  }

  return {
    ...base,
    type: "carpool",
    departure: row.departure ?? "",
    destination: row.destination ?? "",
    days: row.days as Post["days"],
    startTime: row.start_time ?? "",
    endTime: row.end_time ?? undefined,
    price: row.price ?? undefined,
    seats: row.seats ?? undefined,
  };
}

function mapAuthor(row: PostRow): UserProfile {
  return sanitizePublicUser({
    id: row.author_id,
    nickname: row.author_nickname,
    realName: row.author_real_name ?? undefined,
    phone: row.author_phone ?? undefined,
    email: row.author_email ?? undefined,
    avatarUrl: row.author_avatar_url ?? undefined,
    area: row.author_area ?? undefined,
    temperature: Number(row.author_temperature),
    driverType: fromDatabaseDriverType(row.author_driver_type),
    driverVerification: mapDriverVerification({
      license_verified: row.author_license_verified,
      insurance_verified: row.author_insurance_verified,
      driver_verified_at: row.author_driver_verified_at,
    }),
    vehicle: row.author_plate_number
      ? {
          plateNumber: row.author_plate_number,
          modelName: row.author_model_name ?? undefined,
          images: row.author_vehicle_images ?? [],
      }
      : undefined,
  });
}

function mapUserRow(row: UserRow): UserProfile {
  return {
    id: row.id,
    loginId: row.login_id ?? undefined,
    nickname: row.nickname,
    realName: row.real_name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    area: row.area ?? undefined,
    temperature: Number(row.temperature),
    driverType: fromDatabaseDriverType(row.driver_type),
    driverVerification: mapDriverVerification(row),
    vehicle: row.plate_number
      ? {
          plateNumber: row.plate_number,
          modelName: row.model_name ?? undefined,
          images: row.vehicle_images ?? [],
        }
      : undefined,
  };
}

function mapDriverVerification(row: {
  license_verified?: boolean | null;
  insurance_verified?: boolean | null;
  driver_verified_at?: Date | null;
}) {
  if (!row.license_verified && !row.insurance_verified) {
    return undefined;
  }

  return {
    licenseVerified: Boolean(row.license_verified),
    insuranceVerified: Boolean(row.insurance_verified),
    verifiedAt: row.driver_verified_at?.toISOString(),
  };
}

function requiredText(value: unknown, fieldName: string) {
  const trimmed = optionalPostText(value, fieldName);
  if (!trimmed) {
    throw new CreatePostInputError(`${fieldName} is required`);
  }

  return trimmed;
}

function optionalPostText(value: unknown, fieldName: string) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new CreatePostInputError(`${fieldName} must be text`);
  }

  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function optionalNumber(value: unknown, fieldName: string) {
  if (value == null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new CreatePostInputError(`${fieldName} must be a number`);
  }

  return value;
}

function optionalTextArray(value: unknown, fieldName: string) {
  if (value == null) {
    return null;
  }

  if (!Array.isArray(value)) {
    throw new CreatePostInputError(`${fieldName} must be a text array`);
  }

  return value.map((item, index) => requiredText(item, `${fieldName}[${index}]`));
}

function optionalWeekdayArray(value: unknown, fieldName: string): Post["days"] | null {
  const days = optionalTextArray(value, fieldName);
  if (!days) {
    return null;
  }

  const validDays = new Set(["월", "화", "수", "목", "금", "토", "일"]);
  for (const day of days) {
    if (!validDays.has(day)) {
      throw new CreatePostInputError(`${fieldName} contains an invalid weekday`);
    }
  }

  return days as Post["days"];
}

function optionalWageType(value: unknown) {
  if (value == null) {
    return null;
  }

  if (value !== "hourly" && value !== "monthly") {
    throw new CreatePostInputError("wageType must be hourly or monthly");
  }

  return value;
}

function optionalProfileMode(value: unknown) {
  if (value == null) {
    return null;
  }

  if (value !== "resource") {
    throw new CreatePostInputError("profileMode must be resource");
  }

  return value;
}

function optionalEmploymentTypes(value: unknown) {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new CreatePostInputError("employmentTypes must be a text array");
  }

  const validTypes = new Set(["fullTime", "partTime", "shortTerm"]);
  return value.map((item, index) => {
    if (typeof item !== "string" || !validTypes.has(item)) {
      throw new CreatePostInputError(
        `employmentTypes[${index}] must be fullTime, partTime, or shortTerm`,
      );
    }

    return item as "fullTime" | "partTime" | "shortTerm";
  });
}

function toDatabasePostStatus(status: Post["status"] | undefined): DatabasePostStatus {
  return status === "closed" || status === "matched" ? "closed" : "open";
}

function fromDatabaseDriverType(driverType: "driver" | "non_driver"): DriverType {
  return driverType === "driver" ? "driver" : "nonDriver";
}

function toDatabaseDriverType(driverType: DriverType): "driver" | "non_driver" {
  return driverType === "driver" ? "driver" : "non_driver";
}

function maskPlateNumber(plateNumber: string) {
  return plateNumber.length <= 4
    ? "****"
    : `${plateNumber.slice(0, Math.max(0, plateNumber.length - 4))}****`;
}

function requiredRepositoryText(value: string | undefined, fieldName: string) {
  const trimmed = optionalText(value);
  if (!trimmed) {
    throw new RepositoryInputError(`${fieldName} is required`);
  }

  return trimmed;
}

function validatePassword(value: string | undefined) {
  const password = requiredRepositoryText(value, "password");
  if (password.length < 8) {
    throw new RepositoryInputError("password must be at least 8 characters");
  }

  return password;
}

function validateLoginId(value: string | undefined) {
  const loginId = requiredRepositoryText(value, "loginId");
  if (!/^[A-Za-z0-9_]{4,20}$/.test(loginId)) {
    throw new RepositoryInputError(
      "loginId must be 4-20 letters, numbers, or underscores",
    );
  }

  return loginId;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, encodedHash: string) {
  const [scheme, salt, hash] = encodedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function createAuthSessionForUser(user: UserProfile): Promise<AuthSession> {
  const token = randomBytes(32).toString("base64url");
  await getPostgresPool().query(
    `
      insert into auth_sessions (id, user_id, token_hash, expires_at)
      values ($1, $2, $3, now() + ($4 || ' days')::interval)
    `,
    [
      `session-${randomUUID()}`,
      user.id,
      hashSessionToken(token),
      AUTH_SESSION_TTL_DAYS,
    ],
  );

  return { token, user };
}

function userSelectSql() {
  return `
    select
      u.id,
      u.login_id,
      u.nickname,
      u.real_name,
      u.phone,
      u.email,
      u.avatar_url,
      u.area,
      u.temperature,
      u.driver_type,
      u.license_verified,
      u.insurance_verified,
      u.driver_verified_at,
      u.password_hash,
      v.plate_number,
      v.model_name,
      v.image_urls as vehicle_images
    from users u
    left join vehicles v on v.user_id = u.id
  `;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}
