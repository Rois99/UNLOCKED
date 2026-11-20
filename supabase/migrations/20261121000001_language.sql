-- =============================================================================
-- UNLOCKED — Interface language
-- Migration: 20261121000001_language
--
-- Each user picks Hebrew or English (at signup, changeable in settings).
-- Content tables get a Hebrew name next to the English one; the app shows
-- name_he when the user's language is Hebrew and falls back to name.
-- =============================================================================

alter table public.profiles
  add column if not exists language text not null default 'he' check (language in ('he', 'en'));

alter table public.skills    add column if not exists name_he text;
alter table public.goals     add column if not exists name_he text;
alter table public.exercises add column if not exists name_he text;
