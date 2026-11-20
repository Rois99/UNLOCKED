-- =============================================================================
-- UNLOCKED — Calisthenics legs track
-- Migration: 20261120000000_calisthenics_legs_category
--
-- Squats are a pilot goal (bodyweight squat → Bulgarian split squat → pistol).
-- The existing 'squat' category belongs to the gym tree (barbell back squat),
-- so calisthenics leg skills get their own category: 'legs'.
-- =============================================================================

alter type public.skill_category add value if not exists 'legs';
