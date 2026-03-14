-- =============================================================================
-- UNLOCKED -- Skill Dependency Graph (DAG)
-- Migration: 20260313000001_skill_dependencies
--
-- Creates the skill_dependencies junction table for many-to-many prerequisites.
-- The old prerequisite_id column on skills was dropped in 20260314000001.
-- =============================================================================

-- Each row represents a directed edge: prerequisite_id -> skill_id
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
