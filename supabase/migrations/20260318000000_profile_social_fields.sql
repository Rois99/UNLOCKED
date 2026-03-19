-- Add social/personal fields to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS instagram_handle  text,
  ADD COLUMN IF NOT EXISTS gender            text,
  ADD COLUMN IF NOT EXISTS country           text,
  ADD COLUMN IF NOT EXISTS motivation_quote  text;
