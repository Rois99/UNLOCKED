import type { BodyArea } from '@/types';

/** Number of health questions (texts live in the dictionaries, same order). */
export const QUESTION_COUNT = 8;
/** Questions whose "yes" requires a doctor's OK before a plan is built (0-based). */
export const RED_FLAG_QUESTIONS = [0, 1, 2, 3, 5, 7];
/** Questions whose "yes" suggests freezing a body area. */
export const SENSITIVE_QUESTIONS = [4, 6];

export const BODY_AREAS: BodyArea[] = ['shoulder', 'elbow', 'wrist', 'lower_back', 'hip', 'knee', 'ankle', 'neck'];
export const EQUIPMENT_KEYS = ['pull_up_bar', 'parallel_bars', 'band', 'bench', 'rings'];
export const SESSION_MINUTES = [30, 45, 60];

export type OnboardingPayload = {
  answers:     boolean[];
  clearance:   boolean;
  frozenAreas: BodyArea[];
  improve:     boolean;
  goals: { goalId: string; kind: 'trophy' | 'personal'; skillId?: string; target?: number; stage: number }[];
  days:        number[];
  minutes:     number;
  location:    { name: string; equipment: string[] };
};
