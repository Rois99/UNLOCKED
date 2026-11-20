-- =============================================================================
-- UNLOCKED — Private by default
-- Migration: 20261120000001_private_by_default
--
-- Before this migration, anyone holding the public anon key could read every
-- user's email, date of birth, height and weight (profiles), every user's
-- unlocked trophies (user_unlocked_skills), and every proof video URL
-- (submissions). Each user can now read only their own rows.
--
-- The app's server pages read through the service-role client, so they are not
-- affected. A public profile / trophy showcase will be added later as a
-- separate, explicit read path that respects each user's privacy settings.
-- =============================================================================

-- ── profiles ─────────────────────────────────────────────────────────────────
-- "profiles: write own" (for all, auth.uid() = id) already covers reading
-- your own row, so dropping the public read policy is enough.
drop policy if exists "profiles: read all" on public.profiles;


-- ── user_unlocked_skills ─────────────────────────────────────────────────────
drop policy if exists "unlocked: read all" on public.user_unlocked_skills;
drop policy if exists "unlocked: read own" on public.user_unlocked_skills;

create policy "unlocked: read own"
  on public.user_unlocked_skills for select
  using (auth.uid() = user_id);


-- ── submissions ──────────────────────────────────────────────────────────────
drop policy if exists "submissions: read all" on public.submissions;
drop policy if exists "submissions: read own" on public.submissions;

create policy "submissions: read own"
  on public.submissions for select
  using (auth.uid() = user_id);
