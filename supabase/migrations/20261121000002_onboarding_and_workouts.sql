-- =============================================================================
-- UNLOCKED — Onboarding and workout flow support
-- Migration: 20261121000002_onboarding_and_workouts
--
-- 1. Hebrew technique standard per exercise.
-- 2. New sign-ups keep the language they chose on the registration screen
--    (passed as user metadata) instead of the column default.
-- =============================================================================

alter table public.exercises add column if not exists standard_he text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_user_meta_data->>'language' in ('he', 'en')
         then new.raw_user_meta_data->>'language' else 'he' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
