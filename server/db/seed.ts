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
            id, nickname, real_name, phone, email, avatar_url, area, temperature,
            driver_type, password_hash
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          on conflict (id) do update set
            nickname = excluded.nickname,
            real_name = excluded.real_name,
            phone = excluded.phone,
            email = excluded.email,
            avatar_url = excluded.avatar_url,
            area = excluded.area,
            temperature = excluded.temperature,
            driver_type = excluded.driver_type,
            password_hash = coalesce(users.password_hash, excluded.password_hash),
            updated_at = now()
        `,
        [
          user.id,
          user.nickname,
          user.realName,
          user.phone,
          user.email,
          user.avatarUrl,
          user.area,
          user.temperature,
          user.driverType,
          user.passwordHash,
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
            profile_mode, available_tasks, employment_types, preferred_pay,
            availability_note, contact_note, price, seats, created_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12,
            $13, $14, $15, $16, $17,
            $18, $19, $20, $21,
            $22, $23, $24, $25, $26
          )
          on conflict (id) do update set
            type = excluded.type,
            title = excluded.title,
            body = excluded.body,
            author_id = excluded.author_id,
            image_urls = excluded.image_urls,
            status = excluded.status,
            place_name = excluded.place_name,
            place_address = excluded.place_address,
            departure = excluded.departure,
            destination = excluded.destination,
            days = excluded.days,
            start_time = excluded.start_time,
            end_time = excluded.end_time,
            wage_type = excluded.wage_type,
            wage_amount = excluded.wage_amount,
            job_category = excluded.job_category,
            profile_mode = excluded.profile_mode,
            available_tasks = excluded.available_tasks,
            employment_types = excluded.employment_types,
            preferred_pay = excluded.preferred_pay,
            availability_note = excluded.availability_note,
            contact_note = excluded.contact_note,
            price = excluded.price,
            seats = excluded.seats,
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
          post.profileMode,
          post.availableTasks,
          post.employmentTypes,
          post.preferredPay,
          post.availabilityNote,
          post.contactNote,
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

    for (const route of records.busRoutes) {
      await client.query(
        `
          insert into bus_routes (id, code, name, color)
          values ($1, $2, $3, $4)
          on conflict (id) do update set
            code = excluded.code,
            name = excluded.name,
            color = excluded.color
        `,
        [route.id, route.code, route.name, route.color],
      );
    }

    for (const stop of records.busStops) {
      await client.query(
        `
          insert into bus_stops (id, name, latitude, longitude)
          values ($1, $2, $3, $4)
          on conflict (id) do update set
            name = excluded.name,
            latitude = excluded.latitude,
            longitude = excluded.longitude
        `,
        [stop.id, stop.name, stop.latitude, stop.longitude],
      );
    }

    for (const link of records.busRouteStops) {
      await client.query(
        `
          insert into bus_route_stops (route_id, stop_id, sequence)
          values ($1, $2, $3)
          on conflict (route_id, stop_id) do update set
            sequence = excluded.sequence
        `,
        [link.routeId, link.stopId, link.sequence],
      );
    }

    for (const sighting of records.busSightings) {
      await client.query(
        `
          insert into bus_sightings (
            id, route_id, stop_id, reporter_id, latitude, longitude, created_at
          ) values ($1, $2, $3, $4, $5, $6, $7)
          on conflict (id) do nothing
        `,
        [
          sighting.id,
          sighting.routeId,
          sighting.stopId,
          sighting.reporterId,
          sighting.latitude,
          sighting.longitude,
          sighting.createdAt,
        ],
      );
    }

    await client.query("commit");
    console.log("postgres seed: applied");
    console.log(
      `seeded users=${records.users.length} posts=${records.posts.length} chatRooms=${records.chatRooms.length} busRoutes=${records.busRoutes.length} busStops=${records.busStops.length} busSightings=${records.busSightings.length}`,
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
