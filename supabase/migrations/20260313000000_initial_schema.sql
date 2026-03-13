-- =============================================================================
-- UNLOCKED — Initial Schema
-- Migration: 20260313000000_initial_schema
--
-- Tables:
--   profiles             — extended user data (1-to-1 with auth.users)
--   skills               — skill catalogue with media and coaching metadata
--   user_unlocked_skills — join table: which skills a user has verified
--   submissions          — proof video upload records, pending peer review
-- =============================================================================

-- ── shared trigger: auto-update updated_at ───────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade,
  username     text        not null unique,
  email        text        not null unique,
  height_m     numeric(4,2),
  weight_kg    numeric(5,1),
  dob          date,
  avatar_url   text,
  bio          text,
  location     text,
  joined_at    timestamptz not null default now(),

  -- Coach fields
  is_coach     boolean     not null default false,
  cert_url     text,

  updated_at   timestamptz not null default now()
);

-- Add new columns idempotently in case the table was already created
-- without them (safe to run on a fresh schema too — IF NOT EXISTS is a no-op).
alter table public.profiles add column if not exists bio      text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists is_coach boolean not null default false;
alter table public.profiles add column if not exists cert_url text;

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles: read all"  on public.profiles;
drop policy if exists "profiles: write own" on public.profiles;

create policy "profiles: read all"
  on public.profiles for select
  using (true);

create policy "profiles: write own"
  on public.profiles for all
  using  (auth.uid() = id)
  with check (auth.uid() = id);


-- ── skills ───────────────────────────────────────────────────────────────────
do $$ begin
  create type public.skill_difficulty as enum (
    'beginner', 'intermediate', 'advanced', 'elite'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.skill_category as enum (
    'pull', 'push', 'lever', 'balance', 'core',
    'squat', 'bench', 'deadlift'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tree_type as enum ('calisthenics', 'gym');
exception when duplicate_object then null; end $$;

create table if not exists public.skills (
  id               text        primary key,
  name             text        not null,
  description      text        not null,
  category         public.skill_category   not null,
  tree_type        public.tree_type        not null,
  prerequisite_id  text        references public.skills (id),
  xp               integer     not null check (xp > 0),
  difficulty       public.skill_difficulty not null,
  video_guide_url  text,
  written_tips     text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.skills add column if not exists video_guide_url text;
alter table public.skills add column if not exists written_tips    text;

create or replace trigger skills_updated_at
  before update on public.skills
  for each row execute procedure public.set_updated_at();

alter table public.skills enable row level security;

drop policy if exists "skills: read all" on public.skills;
create policy "skills: read all"
  on public.skills for select
  using (true);


-- ── user_unlocked_skills ─────────────────────────────────────────────────────
create table if not exists public.user_unlocked_skills (
  user_id      uuid  not null references public.profiles (id) on delete cascade,
  skill_id     text  not null references public.skills   (id) on delete cascade,
  unlocked_at  timestamptz not null default now(),
  primary key (user_id, skill_id)
);

alter table public.user_unlocked_skills enable row level security;

drop policy if exists "unlocked: read all"  on public.user_unlocked_skills;
drop policy if exists "unlocked: write own" on public.user_unlocked_skills;

create policy "unlocked: read all"
  on public.user_unlocked_skills for select
  using (true);

create policy "unlocked: write own"
  on public.user_unlocked_skills for insert
  with check (auth.uid() = user_id);


-- ── submissions ───────────────────────────────────────────────────────────────
do $$ begin
  create type public.submission_status as enum (
    'pending', 'approved', 'rejected'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.submissions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles (id) on delete cascade,
  skill_id      text        not null references public.skills   (id) on delete cascade,
  video_url     text        not null,
  status        public.submission_status not null default 'pending',
  approve_count integer     not null default 0,
  reject_count  integer     not null default 0,
  submitted_at  timestamptz not null default now(),
  resolved_at   timestamptz
);

alter table public.submissions enable row level security;

drop policy if exists "submissions: read all"   on public.submissions;
drop policy if exists "submissions: insert own" on public.submissions;

create policy "submissions: read all"
  on public.submissions for select
  using (true);

create policy "submissions: insert own"
  on public.submissions for insert
  with check (auth.uid() = user_id);


-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
