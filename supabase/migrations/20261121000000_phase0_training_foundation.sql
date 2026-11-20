-- =============================================================================
-- UNLOCKED — Phase 0: training foundation
-- Migration: 20261121000000_phase0_training_foundation
--
-- Implements the data model from the pilot decisions doc and screen spec.
--
-- Content (filled from content/UNLOCKED_training_framework.xlsx, readable by all):
--   goals               — pilot goal tracks (pull-ups, dips, push-ups, squats)
--   exercises           — exercise library with muscles, body areas, equipment
--   progression_stages  — ordered stages per goal, with advance/regress rules
--   skills (+columns)   — trophies now point at an exercise and a target value
--
-- Per user (each user reads and writes only their own rows):
--   user_goals          — up to 4 active goals in priority order (trophy or personal)
--   training_locations  — named places, each with its own equipment
--   user_schedules      — default training days + session length (days only, no hours)
--   schedule_overrides  — one-week changes to the training days
--   workouts            — one planned / performed session
--   workout_exercises   — exercises inside a workout (skip / swap tracked here)
--   workout_sets        — planned vs actual value per set
--   frozen_areas        — body areas excluded from training ("frozen", never "injured")
--   privacy_settings    — who sees what; private by default
--   consents            — terms, data use and health-screening timestamps only
--                         (questionnaire answers are never stored)
-- =============================================================================


-- ── Content: goals ───────────────────────────────────────────────────────────
create table if not exists public.goals (
  id          text primary key,                       -- 'pullups', 'dips', ...
  name        text not null,
  sort_order  smallint not null default 0
);

alter table public.goals enable row level security;
drop policy if exists "goals: read all" on public.goals;
create policy "goals: read all" on public.goals for select using (true);


-- ── Content: exercises ───────────────────────────────────────────────────────
create table if not exists public.exercises (
  id                 text primary key,                 -- 'negative_pullup'
  name               text not null,
  goal_id            text references public.goals (id) on delete set null,
  measure_type       text not null
                     check (measure_type in ('reps', 'seconds', 'reps_per_side', 'seconds_per_side')),
  primary_muscle     text not null,
  secondary_muscles  text[] not null default '{}',
  body_areas         text[] not null default '{}',    -- excluded when one of these is frozen
  equipment          text[] not null default '{}',    -- empty = no equipment needed
  difficulty         smallint check (difficulty between 1 and 10),
  standard           text,                             -- what counts as one valid rep
  tips               text,
  video_url          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create or replace trigger exercises_updated_at
  before update on public.exercises
  for each row execute procedure public.set_updated_at();

alter table public.exercises enable row level security;
drop policy if exists "exercises: read all" on public.exercises;
create policy "exercises: read all" on public.exercises for select using (true);


-- ── Content: progression stages ──────────────────────────────────────────────
create table if not exists public.progression_stages (
  goal_id       text     not null references public.goals (id) on delete cascade,
  stage         smallint not null check (stage >= 1),
  exercise_id   text     not null references public.exercises (id) on delete restrict,
  sets          smallint not null check (sets between 1 and 10),
  target_min    smallint not null check (target_min >= 1),
  target_max    smallint not null,
  rest_seconds  smallint not null check (rest_seconds between 10 and 600),
  advance_rule  text,
  regress_rule  text,
  notes         text,
  primary key (goal_id, stage),
  check (target_max >= target_min)
);

alter table public.progression_stages enable row level security;
drop policy if exists "stages: read all" on public.progression_stages;
create policy "stages: read all" on public.progression_stages for select using (true);


-- ── Content: trophies point at an exercise ───────────────────────────────────
alter table public.skills add column if not exists exercise_id  text references public.exercises (id) on delete set null;
alter table public.skills add column if not exists target_value integer check (target_value > 0);

-- Active mark: a trophy stays forever; it is "active" while verified_at is
-- within the last 90 days (computed in the app, not stored).
alter table public.user_unlocked_skills add column if not exists verified_at timestamptz not null default now();


-- ── Helper: own-row policy for user tables ───────────────────────────────────
-- (written out per table below so each policy is visible in the dashboard)


-- ── User: goals ──────────────────────────────────────────────────────────────
create table if not exists public.user_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  goal_id        text not null references public.goals (id),
  priority       smallint not null check (priority between 1 and 4),   -- 1 = primary goal
  kind           text not null check (kind in ('trophy', 'personal')),
  skill_id       text references public.skills (id) on delete set null, -- kind = 'trophy'
  exercise_id    text references public.exercises (id),                -- kind = 'personal'
  target_value   integer check (target_value > 0),                     -- kind = 'personal'
  current_stage  smallint not null default 1 check (current_stage >= 1),
  created_at     timestamptz not null default now(),
  archived_at    timestamptz,
  check (
    (kind = 'trophy'   and skill_id is not null) or
    (kind = 'personal' and exercise_id is not null and target_value is not null)
  )
);

-- At most one active goal per priority slot (so at most 4 active goals).
create unique index if not exists user_goals_active_priority
  on public.user_goals (user_id, priority) where archived_at is null;

alter table public.user_goals enable row level security;
drop policy if exists "user_goals: own" on public.user_goals;
create policy "user_goals: own" on public.user_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ── User: training locations ─────────────────────────────────────────────────
create table if not exists public.training_locations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  equipment   text[] not null default '{}',
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create unique index if not exists training_locations_one_default
  on public.training_locations (user_id) where is_default;

alter table public.training_locations enable row level security;
drop policy if exists "locations: own" on public.training_locations;
create policy "locations: own" on public.training_locations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ── User: schedule (days only, 0 = Sunday … 6 = Saturday) ─────────────────────
create table if not exists public.user_schedules (
  user_id          uuid primary key references public.profiles (id) on delete cascade,
  training_days    smallint[] not null check (training_days <@ array[0,1,2,3,4,5,6]::smallint[]),
  session_minutes  smallint not null default 45 check (session_minutes between 10 and 180),
  updated_at       timestamptz not null default now()
);

create or replace trigger user_schedules_updated_at
  before update on public.user_schedules
  for each row execute procedure public.set_updated_at();

alter table public.user_schedules enable row level security;
drop policy if exists "schedules: own" on public.user_schedules;
create policy "schedules: own" on public.user_schedules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.schedule_overrides (
  user_id        uuid not null references public.profiles (id) on delete cascade,
  week_start     date not null,                                 -- the week's Sunday
  training_days  smallint[] not null check (training_days <@ array[0,1,2,3,4,5,6]::smallint[]),
  primary key (user_id, week_start)
);

alter table public.schedule_overrides enable row level security;
drop policy if exists "overrides: own" on public.schedule_overrides;
create policy "overrides: own" on public.schedule_overrides for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ── User: workouts ───────────────────────────────────────────────────────────
create table if not exists public.workouts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  scheduled_date  date not null,
  status          text not null default 'planned'
                  check (status in ('planned', 'in_progress', 'completed', 'partial', 'skipped')),
  location_id     uuid references public.training_locations (id) on delete set null,
  generator       text not null default 'rules' check (generator in ('rules', 'ai')),
  explanation     text,                       -- "what changed" line shown on Today
  started_at      timestamptz,
  finished_at     timestamptz,
  feedback        text check (feedback in ('easy', 'ok', 'hard')),
  note            text,                       -- optional free text
  end_reason      text check (end_reason in ('out_of_time', 'tired', 'pain', 'other')),
  created_at      timestamptz not null default now()
);

create index if not exists workouts_user_date on public.workouts (user_id, scheduled_date desc);

alter table public.workouts enable row level security;
drop policy if exists "workouts: own" on public.workouts;
create policy "workouts: own" on public.workouts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.workout_exercises (
  id             uuid primary key default gen_random_uuid(),
  workout_id     uuid not null references public.workouts (id) on delete cascade,
  position       smallint not null,
  exercise_id    text not null references public.exercises (id),
  goal_id        text references public.goals (id),
  planned_sets   smallint not null check (planned_sets between 1 and 10),
  target_min     smallint not null,
  target_max     smallint not null,
  rest_seconds   smallint not null,
  status         text not null default 'pending'
                 check (status in ('pending', 'done', 'skipped', 'swapped')),
  swap_reason    text check (swap_reason in ('no_equipment', 'too_hard', 'uncomfortable')),
  replaces_id    uuid references public.workout_exercises (id) on delete set null,
  feedback       text check (feedback in ('easy', 'ok', 'hard')),
  unique (workout_id, position)
);

alter table public.workout_exercises enable row level security;
drop policy if exists "workout_exercises: own" on public.workout_exercises;
create policy "workout_exercises: own" on public.workout_exercises for all
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

create table if not exists public.workout_sets (
  id                   uuid primary key default gen_random_uuid(),
  workout_exercise_id  uuid not null references public.workout_exercises (id) on delete cascade,
  set_number           smallint not null check (set_number >= 1),
  planned_value        smallint,
  actual_value         smallint check (actual_value >= 0),
  logged_at            timestamptz not null default now(),
  unique (workout_exercise_id, set_number)
);

alter table public.workout_sets enable row level security;
drop policy if exists "workout_sets: own" on public.workout_sets;
create policy "workout_sets: own" on public.workout_sets for all
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()))
  with check (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()));


-- ── User: frozen body areas ──────────────────────────────────────────────────
create table if not exists public.frozen_areas (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  area         text not null
               check (area in ('shoulder', 'elbow', 'wrist', 'lower_back', 'hip', 'knee', 'ankle', 'neck')),
  source       text not null default 'manual' check (source in ('manual', 'pain_report', 'onboarding')),
  frozen_at    timestamptz not null default now(),
  released_at  timestamptz
);

create unique index if not exists frozen_areas_one_active
  on public.frozen_areas (user_id, area) where released_at is null;

alter table public.frozen_areas enable row level security;
drop policy if exists "frozen_areas: own" on public.frozen_areas;
create policy "frozen_areas: own" on public.frozen_areas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ── User: privacy settings (private by default) ──────────────────────────────
create table if not exists public.privacy_settings (
  user_id                  uuid primary key references public.profiles (id) on delete cascade,
  training_only            boolean not null default false,   -- nobody sees anything
  trophies_visibility      text not null default 'everyone' check (trophies_visibility     in ('everyone', 'friends', 'only_me')),
  measurements_visibility  text not null default 'only_me'  check (measurements_visibility in ('everyone', 'friends', 'only_me')),
  videos_visibility        text not null default 'only_me'  check (videos_visibility       in ('everyone', 'friends', 'only_me')),
  show_live_to_friends     boolean not null default false,   -- "training now"
  updated_at               timestamptz not null default now()
);

create or replace trigger privacy_settings_updated_at
  before update on public.privacy_settings
  for each row execute procedure public.set_updated_at();

alter table public.privacy_settings enable row level security;
drop policy if exists "privacy: own" on public.privacy_settings;
create policy "privacy: own" on public.privacy_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ── User: consents (timestamps only, never questionnaire answers) ────────────
create table if not exists public.consents (
  user_id                        uuid primary key references public.profiles (id) on delete cascade,
  terms_accepted_at              timestamptz,
  plan_data_consent_at           timestamptz,
  improvement_consent_at         timestamptz,   -- optional, never pre-ticked
  improvement_consent_revoked_at timestamptz,
  improvement_asks               smallint not null default 0 check (improvement_asks between 0 and 3),
  health_screening_at            timestamptz,   -- questionnaire completed
  medical_clearance_at           timestamptz,   -- self-attested after a red-flag answer
  updated_at                     timestamptz not null default now()
);

create or replace trigger consents_updated_at
  before update on public.consents
  for each row execute procedure public.set_updated_at();

alter table public.consents enable row level security;
drop policy if exists "consents: own" on public.consents;
create policy "consents: own" on public.consents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ── New users get default privacy + consent rows ─────────────────────────────
create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.privacy_settings (user_id) values (new.id) on conflict do nothing;
  insert into public.consents (user_id)         values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();

-- Backfill for existing profiles.
insert into public.privacy_settings (user_id) select id from public.profiles on conflict do nothing;
insert into public.consents (user_id)         select id from public.profiles on conflict do nothing;
