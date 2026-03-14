-- =============================================================================
-- UNLOCKED — AND / OR prerequisite requirement type
-- Migration: 20260314000000_requirement_type
--
-- Adds requirement_type to the skills table so a skill can declare:
--   AND  — ALL prerequisites must be unlocked (default, existing behaviour)
--   OR   — ANY one prerequisite is sufficient to unlock the skill
-- =============================================================================

alter table public.skills
  add column if not exists requirement_type text
    not null default 'AND'
    check (requirement_type in ('AND', 'OR'));

comment on column public.skills.requirement_type is
  'AND = every prerequisite required; OR = any one prerequisite sufficient';
