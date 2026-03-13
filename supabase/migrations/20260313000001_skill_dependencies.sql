-- =============================================================================
-- UNLOCKED — Skill Dependency Graph (DAG)
-- Migration: 20260313000001_skill_dependencies
--
-- Replaces the single prerequisite_id column on the skills table with a
-- many-to-many junction table, allowing skills to require multiple
-- prerequisites (e.g. One-Arm Pull-up requires both Weighted Pull-ups
-- AND 30 Pull-ups).
-- =============================================================================

-- ── skill_dependencies ────────────────────────────────────────────────────────
-- Each row represents a directed edge: prerequisite_id → skill_id
-- A skill can appear multiple times as a child (multiple prerequisites).

create table if not exists public.skill_dependencies (
  skill_id        text not null references public.skills (id) on delete cascade,
  prerequisite_id text not null references public.skills (id) on delete cascade,
  primary key (skill_id, prerequisite_id)
);

alter table public.skill_dependencies enable row level security;

drop policy if exists "skill_deps: read all" on public.skill_dependencies;
create policy "skill_deps: read all"
  on public.skill_dependencies for select
  using (true);

-- ── Migrate existing prerequisite_id data ────────────────────────────────────
-- Copy any existing single-prerequisite data into the new junction table,
-- then nullify the old column (kept for reference, no longer authoritative).

insert into public.skill_dependencies (skill_id, prerequisite_id)
select id, prerequisite_id
from   public.skills
where  prerequisite_id is not null
on conflict do nothing;

-- The prerequisite_id column on skills is now deprecated.
-- It stays in the schema for backward compatibility but is not written to.
comment on column public.skills.prerequisite_id is
  'Deprecated — use skill_dependencies junction table instead.';
