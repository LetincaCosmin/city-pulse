-- City Pulse launch cleanup
-- Run only in Supabase Dashboard -> SQL Editor, after you decide what test data to remove.
-- This file does not delete auth users.

-- 1) Clean activity/content created during testing.
-- Keeps user accounts, profiles and business profiles.
begin;

delete from public.notification_reads;
delete from public.notifications;
delete from public.event_participants;
delete from public.events;
delete from public.posts;

commit;

-- 2) Optional: remove test businesses too.
-- Uncomment and adapt only if those business profiles are not real.
--
-- delete from public.businesses
-- where lower(name) like '%test%'
--    or lower(name) in ('lokal cafe', 'sense art', 'la dolce vita');
--
-- delete from public.profiles
-- where lower(name) like '%test%';

