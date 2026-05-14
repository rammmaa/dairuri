import "dotenv/config";

import { closePostgresPool, getPostgresPool } from "./postgres";
import { createSeedRecords } from "./seedData";

async function main() {
  const pool = getPostgresPool();
  const records = createSeedRecords();
  const client = await pool.connect();

  try {
    await client.query("begin");

    for (const user of records.users) {
      await client.query(
        `
          insert into users (
            id, nickname, real_name, phone, email, area, temperature, driver_type
          ) values ($1, $2, $3, $4, $5, $6, $7, $8)
          on conflict (id) do update set
            nickname = excluded.nickname,
            real_name = excluded.real_name,
            phone = excluded.phone,
            email = excluded.email,
            area = excluded.area,
            temperature = excluded.temperature,
            driver_type = excluded.driver_type,
            updated_at = now()
        `,
        [
          user.id,
          user.nickname,
          user.realName,
          user.phone,
          user.email,
          user.area,
          user.temperature,
          user.driverType,
        ],
      );
    }

    for (const vehicle of records.vehicles) {
      await client.query(
        `
          insert into vehicles (
            id, user_id, plate_number, model_name, image_urls
          ) values ($1, $2, $3, $4, $5)
          on conflict (id) do update set
            plate_number = excluded.plate_number,
            model_name = excluded.model_name,
            image_urls = excluded.image_urls
        `,
        [
          vehicle.id,
          vehicle.userId,
          vehicle.plateNumber,
          vehicle.modelName,
          vehicle.imageUrls,
        ],
      );
    }

    for (const post of records.posts) {
      await client.query(
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
          on conflict (id) do update set
            title = excluded.title,
            body = excluded.body,
            image_urls = excluded.image_urls,
            status = excluded.status,
            updated_at = now()
        `,
        [
          post.id,
          post.type,
          post.title,
          post.body,
          post.authorId,
          post.imageUrls,
          post.status,
          post.placeName,
          post.placeAddress,
          post.departure,
          post.destination,
          post.days,
          post.startTime,
          post.endTime,
          post.wageType,
          post.wageAmount,
          post.jobCategory,
          post.price,
          post.seats,
          post.createdAt,
        ],
      );
    }

    for (const like of records.postLikes) {
      await client.query(
        `
          insert into post_likes (post_id, user_id)
          values ($1, $2)
          on conflict (post_id, user_id) do nothing
        `,
        [like.postId, like.userId],
      );
    }

    for (const application of records.applications) {
      await client.query(
        `
          insert into applications (
            id, post_id, applicant_id, intro, status, rejection_reason, created_at
          ) values ($1, $2, $3, $4, $5, $6, $7)
          on conflict (id) do update set
            intro = excluded.intro,
            status = excluded.status,
            rejection_reason = excluded.rejection_reason,
            updated_at = now()
        `,
        [
          application.id,
          application.postId,
          application.applicantId,
          application.intro,
          application.status,
          application.rejectionReason,
          application.createdAt,
        ],
      );
    }

    for (const room of records.chatRooms) {
      await client.query(
        `
          insert into chat_rooms (id, post_id, title, subtitle)
          values ($1, $2, $3, $4)
          on conflict (id) do update set
            title = excluded.title,
            subtitle = excluded.subtitle,
            updated_at = now()
        `,
        [room.id, room.postId, room.title, room.subtitle],
      );
    }

    for (const participant of records.chatRoomParticipants) {
      await client.query(
        `
          insert into chat_room_participants (room_id, user_id)
          values ($1, $2)
          on conflict (room_id, user_id) do nothing
        `,
        [participant.roomId, participant.userId],
      );
    }

    for (const message of records.chatMessages) {
      await client.query(
        `
          insert into chat_messages (id, room_id, sender_id, type, text, created_at)
          values ($1, $2, $3, $4, $5, $6)
          on conflict (id) do update set
            text = excluded.text
        `,
        [
          message.id,
          message.roomId,
          message.senderId,
          message.type,
          message.text,
          message.createdAt,
        ],
      );
    }

    await client.query("commit");
    console.log("postgres seed: applied");
    console.log(
      `seeded users=${records.users.length} posts=${records.posts.length} chatRooms=${records.chatRooms.length}`,
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await closePostgresPool();
  }
}

void main();
