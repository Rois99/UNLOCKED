export type Difficulty       = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type SkillState       = 'unlocked' | 'available' | 'locked';
export type TreeType         = 'calisthenics' | 'gym';
export type RequirementType  = 'AND' | 'OR';
export type SkillCategory    =
  | 'pull' | 'push' | 'lever' | 'legs' | 'balance' | 'core'   // calisthenics
  | 'squat' | 'bench' | 'deadlift';                    // gym

export interface Skill {
  id:              string;
  name:            string;
  description:     string;
  category:        SkillCategory;
  treeType:        TreeType;
  /**
   * DAG prerequisites.
   * Empty array = root skill (no dependencies).
   * Interpretation depends on requirementType.
   */
  prerequisiteIds:  string[];
  /**
   * AND — skill is available only when ALL prerequisites are unlocked.
   * OR  — skill is available when ANY ONE prerequisite is unlocked.
   */
  requirementType:  RequirementType;
  xp:              number;
  difficulty:      Difficulty;
}

export interface User {
  id:               string;
  username:         string;
  email:            string;
  heightM:          number;
  weightKg:         number;
  /** ISO date 'YYYY-MM-DD' */
  dob:              string;
  unlockedSkillIds: string[];
  avatarUrl?:       string;
  joinedAt:         string;
  instagramHandle?: string;
  gender?:          string;
  country?:         string;
  motivationQuote?: string;
}

// ── Training foundation (Phase 0) ─────────────────────────────────────────────
// Row shapes mirror supabase/migrations/20261121000000_phase0_training_foundation.sql

export type MeasureType   = 'reps' | 'seconds' | 'reps_per_side' | 'seconds_per_side';
export type BodyArea      = 'shoulder' | 'elbow' | 'wrist' | 'lower_back' | 'hip' | 'knee' | 'ankle' | 'neck';
export type Visibility    = 'everyone' | 'friends' | 'only_me';
export type Feedback      = 'easy' | 'ok' | 'hard';
export type GoalKind      = 'trophy' | 'personal';
export type WorkoutStatus = 'planned' | 'in_progress' | 'completed' | 'partial' | 'skipped';
export type ExerciseStatus = 'pending' | 'done' | 'skipped' | 'swapped';
export type SwapReason    = 'no_equipment' | 'too_hard' | 'uncomfortable';
export type EndReason     = 'out_of_time' | 'tired' | 'pain' | 'other';

/** Days of the week, 0 = Sunday … 6 = Saturday. No hours anywhere. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Goal {
  id:         string;
  name:       string;
  sort_order: number;
}

export interface Exercise {
  id:                string;
  name:              string;
  name_he?:          string | null;
  standard_he?:      string | null;
  goal_id:           string | null;
  measure_type:      MeasureType;
  primary_muscle:    string;
  secondary_muscles: string[];
  body_areas:        BodyArea[];
  equipment:         string[];   // empty = no equipment needed
  difficulty:        number | null;
  standard:          string | null;
  tips:              string | null;
  video_url:         string | null;
}

export interface ProgressionStage {
  goal_id:      string;
  stage:        number;
  exercise_id:  string;
  sets:         number;
  target_min:   number;
  target_max:   number;
  rest_seconds: number;
  advance_rule: string | null;
  regress_rule: string | null;
  notes:        string | null;
}

export interface UserGoal {
  id:            string;
  user_id:       string;
  goal_id:       string;
  /** 1 = primary goal; at most 4 active goals. */
  priority:      1 | 2 | 3 | 4;
  kind:          GoalKind;
  skill_id:      string | null;   // kind = 'trophy'
  exercise_id:   string | null;   // kind = 'personal'
  target_value:  number | null;   // kind = 'personal'
  current_stage: number;
  created_at:    string;
  archived_at:   string | null;
}

export interface TrainingLocation {
  id:         string;
  user_id:    string;
  name:       string;
  equipment:  string[];
  is_default: boolean;
}

export interface UserSchedule {
  user_id:         string;
  training_days:   Weekday[];
  session_minutes: number;
}

export interface Workout {
  id:             string;
  user_id:        string;
  scheduled_date: string;   // YYYY-MM-DD
  status:         WorkoutStatus;
  location_id:    string | null;
  generator:      'rules' | 'ai';
  explanation:    string | null;
  started_at:     string | null;
  finished_at:    string | null;
  feedback:       Feedback | null;
  note:           string | null;
  end_reason:     EndReason | null;
}

export interface WorkoutExercise {
  id:           string;
  workout_id:   string;
  position:     number;
  exercise_id:  string;
  goal_id:      string | null;
  planned_sets: number;
  target_min:   number;
  target_max:   number;
  rest_seconds: number;
  status:       ExerciseStatus;
  swap_reason:  SwapReason | null;
  replaces_id:  string | null;
  feedback:     Feedback | null;
}

export interface WorkoutSet {
  id:                  string;
  workout_exercise_id: string;
  set_number:          number;
  planned_value:       number | null;
  actual_value:        number | null;
  logged_at:           string;
}

export interface FrozenArea {
  id:          string;
  user_id:     string;
  area:        BodyArea;
  source:      'manual' | 'pain_report' | 'onboarding';
  frozen_at:   string;
  released_at: string | null;
}

export interface PrivacySettings {
  user_id:                 string;
  training_only:           boolean;
  trophies_visibility:     Visibility;
  measurements_visibility: Visibility;
  videos_visibility:       Visibility;
  show_live_to_friends:    boolean;
}
