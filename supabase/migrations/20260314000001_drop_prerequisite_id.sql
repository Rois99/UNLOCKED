-- =============================================================================
-- UNLOCKED -- Drop deprecated prerequisite_id column from skills
-- Migration: 20260314000001_drop_prerequisite_id
--
-- The prerequisite_id column on skills was superseded by the
-- skill_dependencies junction table (20260313000001).
-- All dependency data now lives exclusively in skill_dependencies.
-- =============================================================================

alter table public.skills
  drop column if exists prerequisite_id;
