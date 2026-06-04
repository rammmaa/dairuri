-- Remove demo/mock login accounts from deployed databases.
-- Real signups are created through /auth/signup; seed data should only keep
-- reference records such as Happy Bus routes and stops.

create temporary table tmp_mock_seed_account_ids (
  id text primary key
) on commit drop;

insert into tmp_mock_seed_account_ids (id)
select id
from users
where id in ('me', 'author-1')
   or login_id in ('rammma', 'darori_author')
   or phone in ('010-0000-0000', '010-1234-4567')
   or email = 'test@example.com'
on conflict do nothing;

update bus_sightings
set reporter_id = null
where reporter_id in (select id from tmp_mock_seed_account_ids);

delete from auth_sessions
where user_id in (select id from tmp_mock_seed_account_ids);

delete from vehicles
where user_id in (select id from tmp_mock_seed_account_ids);

delete from chat_messages
where sender_id in (select id from tmp_mock_seed_account_ids)
   or room_id in (
     select room_id
     from chat_room_participants
     where user_id in (select id from tmp_mock_seed_account_ids)
   );

delete from chat_room_participants
where user_id in (select id from tmp_mock_seed_account_ids);

delete from manner_ratings
where rater_id in (select id from tmp_mock_seed_account_ids)
   or target_user_id in (select id from tmp_mock_seed_account_ids);

delete from reports
where reporter_id in (select id from tmp_mock_seed_account_ids);

update reports
set reported_user_id = null
where reported_user_id in (select id from tmp_mock_seed_account_ids);

delete from applications
where applicant_id in (select id from tmp_mock_seed_account_ids);

delete from post_likes
where user_id in (select id from tmp_mock_seed_account_ids);

delete from posts
where author_id in (select id from tmp_mock_seed_account_ids);

delete from users
where id in (select id from tmp_mock_seed_account_ids);
