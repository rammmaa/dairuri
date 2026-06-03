-- Remove the initial placeholder recruitment seed records from live databases.
-- Real user-created posts use post-<uuid> ids; these fixed ids only came from
-- the early seed data.

delete from chat_messages
where room_id in ('room-1', 'room-2')
   or id in ('system-1', 'message-1', 'message-2');

delete from chat_room_participants
where room_id in ('room-1', 'room-2');

delete from chat_rooms
where id in ('room-1', 'room-2')
   or post_id in ('job-1', 'carpool-1');

delete from applications
where id = 'application-1'
   or post_id in ('job-1', 'carpool-1');

delete from post_likes
where post_id in ('job-1', 'carpool-1');

delete from posts
where id in ('job-1', 'carpool-1');
