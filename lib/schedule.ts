import type { Weekday } from '@/types';

/**
 * The next training day on or after `from`, given the user's training days
 * (0 = Sunday … 6 = Saturday). Returns null when no days are set.
 */
export function nextTrainingDay(trainingDays: Weekday[], from: Date = new Date()): { date: Date; daysAway: number } | null {
  if (trainingDays.length === 0) return null;
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(from);
    date.setDate(from.getDate() + offset);
    if (trainingDays.includes(date.getDay() as Weekday)) return { date, daysAway: offset };
  }
  return null;
}

/** "Today", "Tomorrow" or the weekday name, in the user's language. */
export function dayLabel(
  daysAway: number,
  date: Date,
  t: { today: string; tomorrow: string; weekdays: readonly string[] },
): string {
  if (daysAway === 0) return t.today;
  if (daysAway === 1) return t.tomorrow;
  return t.weekdays[date.getDay()];
}
