import type {
  Application,
  ChatMessage,
  ChatRoom,
  DriverType,
  Post,
  UserProfile,
} from "../../types/domain";
import { getPostgresPool } from "../db/postgres";

type UserRow = {
  id: string;
  nickname: string;
  real_name: string | null;
  phone: string | null;
  email: string | null;
  area: string | null;
  temperature: string | number;
  driver_type: "driver" | "non_driver";
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
  price: number | null;
  seats: number | null;
  author_id: string;
  author_nickname: string;
  author_real_name: string | null;
  author_phone: string | null;
  author_email: string | null;
  author_area: string | null;
  author_temperature: string | number;
  author_driver_type: "driver" | "non_driver";
  author_plate_number: string | null;
  author_model_name: string | null;
  author_vehicle_images: string[] | null;
};

type DatabasePostStatus = "open" | "closed";

type CreatePostInput = Partial<Post> & {
  days?: Post["days"];
  departure?: string;
  destination?: string;
  endTime?: string;
  imageUrls?: string[];
  jobCategory?: string;
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
  type: "system" | "text";
  text: string | null;
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
  const id = `post-${Date.now()}`;
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
        price, seats, created_at
      ) values (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20
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
    imageUrls: input.imageUrls ?? [],
    status: toDatabasePostStatus(input.status),
    days: input.days ?? [],
    startTime: optionalText(input.startTime),
    endTime: optionalText(input.endTime),
    createdAt: meta.createdAt,
  };

  if (input.type === "job") {
    const placeName = optionalText(input.placeName);
    if (!placeName || input.wageAmount == null) {
      throw new CreatePostInputError("job post requires placeName and wageAmount");
    }

    return {
      ...base,
      type: "job",
      placeName,
      placeAddress: optionalText(input.placeAddress),
      departure: null,
      destination: null,
      wageType: input.wageType ?? "hourly",
      wageAmount: input.wageAmount,
      jobCategory: optionalText(input.jobCategory),
      price: null,
      seats: null,
    };
  }

  const departure = optionalText(input.departure);
  const destination = optionalText(input.destination);
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
    price: input.price ?? null,
    seats: input.seats ?? null,
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
  const id = `application-${Date.now()}`;
  const createdAt = new Date().toISOString();

  const { rows } = await getPostgresPool().query<{
    id: string;
    post_id: string;
    intro: string;
    status: Application["status"];
    created_at: Date;
  }>(
    `
      insert into applications (id, post_id, applicant_id, intro, status, created_at)
      values ($1, $2, $3, $4, 'pending', $5)
      returning id, post_id, intro, status, created_at
    `,
    [id, postId, userId, intro, createdAt],
  );
  const applicant = await getUserById(userId);

  if (!applicant) {
    throw new Error("current user missing");
  }

  return {
    id: rows[0].id,
    postId: rows[0].post_id,
    applicant,
    intro: rows[0].intro,
    status: rows[0].status,
    createdAt: rows[0].created_at.toISOString(),
  };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "accepted" | "rejected",
  rejectionReason?: string,
) {
  await getPostgresPool().query(
    `
      update applications
      set status = $2, rejection_reason = $3, updated_at = now()
      where id = $1
    `,
    [applicationId, status, rejectionReason ?? null],
  );
}

export async function listChatRooms(): Promise<ChatRoom[]> {
  const { rows } = await getPostgresPool().query<ChatRoomRow>(`
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
    order by cr.created_at asc
  `);

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

export async function listChatMessages(roomId: string): Promise<ChatMessage[]> {
  const { rows } = await getPostgresPool().query<ChatMessageRow>(
    `
      select id, room_id, sender_id, type, text, created_at
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
    createdAt: message.created_at.toISOString(),
  }));
}

export async function createChatMessage(
  roomId: string,
  text: string,
  userId: string,
): Promise<ChatMessage> {
  const id = `message-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const { rows } = await getPostgresPool().query<ChatMessageRow>(
    `
      insert into chat_messages (id, room_id, sender_id, type, text, created_at)
      values ($1, $2, $3, 'text', $4, $5)
      returning id, room_id, sender_id, type, text, created_at
    `,
    [id, roomId, userId, text, createdAt],
  );

  return {
    id: rows[0].id,
    roomId: rows[0].room_id,
    senderId: rows[0].sender_id ?? undefined,
    type: rows[0].type,
    text: rows[0].text ?? undefined,
    createdAt: rows[0].created_at.toISOString(),
  };
}

async function getUserById(id: string): Promise<UserProfile | undefined> {
  const { rows } = await getPostgresPool().query<UserRow>(
    `
      select
        u.id,
        u.nickname,
        u.real_name,
        u.phone,
        u.email,
        u.area,
        u.temperature,
        u.driver_type,
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

async function listRoomParticipants(roomId: string): Promise<UserProfile[]> {
  const { rows } = await getPostgresPool().query<UserRow>(
    `
      select
        u.id,
        u.nickname,
        u.real_name,
        u.phone,
        u.email,
        u.area,
        u.temperature,
        u.driver_type,
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
      u.area as author_area,
      u.temperature as author_temperature,
      u.driver_type as author_driver_type,
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
  return {
    id: row.author_id,
    nickname: row.author_nickname,
    realName: row.author_real_name ?? undefined,
    phone: row.author_phone ?? undefined,
    email: row.author_email ?? undefined,
    area: row.author_area ?? undefined,
    temperature: Number(row.author_temperature),
    driverType: fromDatabaseDriverType(row.author_driver_type),
    vehicle: row.author_plate_number
      ? {
          plateNumber: row.author_plate_number,
          modelName: row.author_model_name ?? undefined,
          images: row.author_vehicle_images ?? [],
        }
      : undefined,
  };
}

function mapUserRow(row: UserRow): UserProfile {
  return {
    id: row.id,
    nickname: row.nickname,
    realName: row.real_name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    area: row.area ?? undefined,
    temperature: Number(row.temperature),
    driverType: fromDatabaseDriverType(row.driver_type),
    vehicle: row.plate_number
      ? {
          plateNumber: row.plate_number,
          modelName: row.model_name ?? undefined,
          images: row.vehicle_images ?? [],
        }
      : undefined,
  };
}

function requiredText(value: string | undefined, fieldName: string) {
  const trimmed = optionalText(value);
  if (!trimmed) {
    throw new CreatePostInputError(`${fieldName} is required`);
  }

  return trimmed;
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toDatabasePostStatus(status: Post["status"] | undefined): DatabasePostStatus {
  return status === "closed" || status === "matched" ? "closed" : "open";
}

function fromDatabaseDriverType(driverType: "driver" | "non_driver"): DriverType {
  return driverType === "driver" ? "driver" : "nonDriver";
}
