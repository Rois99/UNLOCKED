/**
 * Pure calculations for the Progress area: per-exercise series and the weekly
 * summary. Only measured data (logged sets of finished workouts) goes in; when
 * there isn't enough of it the callers show "not enough data" instead.
 */

export type FinishedWorkout = {
  id:          string;
  started_at:  string | null;
  finished_at: string;
  exercises:   { exercise_id: string; values: number[] }[];   // done exercises only
};

export type SessionPoint = {
  date:     string;    // ISO timestamp of the workout's finish
  volume:   number;    // sum of all logged values in the session
  best:     number;    // best single set
  isRecord: { volume: boolean; best: boolean };   // beat every earlier session
};

export type ExerciseSeries = {
  exerciseId: string;
  points:     SessionPoint[];   // oldest first
};

const DAY = 24 * 60 * 60 * 1000;

/** One series per exercise the user has logged, sessions oldest first. */
export function buildSeries(workouts: FinishedWorkout[]): ExerciseSeries[] {
  const byExercise = new Map<string, SessionPoint[]>();
  const sorted = [...workouts].sort((a, b) => Date.parse(a.finished_at) - Date.parse(b.finished_at));

  for (const w of sorted) {
    for (const ex of w.exercises) {
      if (ex.values.length === 0) continue;
      const list   = byExercise.get(ex.exercise_id) ?? [];
      const volume = ex.values.reduce((s, v) => s + v, 0);
      const best   = Math.max(...ex.values);
      const prevVolume = Math.max(-1, ...list.map((p) => p.volume));
      const prevBest   = Math.max(-1, ...list.map((p) => p.best));
      list.push({
        date: w.finished_at, volume, best,
        // The first session sets the baseline; it is not a "record" yet.
        isRecord: { volume: list.length > 0 && volume > prevVolume, best: list.length > 0 && best > prevBest },
      });
      byExercise.set(ex.exercise_id, list);
    }
  }
  return [...byExercise.entries()].map(([exerciseId, points]) => ({ exerciseId, points }));
}

/** The latest point at least `days` before the newest one, for "a month ago" comparisons. */
export function pointBefore(points: SessionPoint[], days: number): SessionPoint | null {
  if (points.length < 2) return null;
  const newest = Date.parse(points[points.length - 1].date);
  const older  = points.filter((p) => Date.parse(p.date) <= newest - days * DAY);
  return older.length > 0 ? older[older.length - 1] : null;
}

/** Sunday 00:00 (local server time) of the week containing `d`. */
export function weekStart(d: Date): Date {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

export type WeekStats = { workouts: number; volume: number; minutes: number; records: number };

function statsBetween(workouts: FinishedWorkout[], series: ExerciseSeries[], from: number, to: number): WeekStats {
  const inRange = workouts.filter((w) => { const t = Date.parse(w.finished_at); return t >= from && t < to; });
  const records = series.reduce((n, s) => n + s.points.filter((p) => {
    const t = Date.parse(p.date); return t >= from && t < to && p.isRecord.best;
  }).length, 0);
  return {
    workouts: inRange.length,
    volume:   inRange.reduce((s, w) => s + w.exercises.reduce((a, e) => a + e.values.reduce((x, v) => x + v, 0), 0), 0),
    minutes:  inRange.reduce((s, w) => s + (w.started_at ? Math.max(0, Math.round((Date.parse(w.finished_at) - Date.parse(w.started_at)) / 60000)) : 0), 0),
    records,
  };
}

export type WeeklySummary = {
  weekStart:  Date;
  weekEnd:    Date;      // Saturday
  planned:    number;    // training days in the user's schedule
  thisWeek:   WeekStats;
  lastWeek:   WeekStats;
  monthAgo:   WeekStats; // the same week four weeks earlier
  streak:     number;    // consecutive weeks (ending now) that met the plan
};

/**
 * This week vs last week vs four weeks ago, and the weekly streak: a week
 * counts when its workouts reach the planned number; the current week counts
 * once it is met, and never breaks the streak while it is still in progress.
 */
export function weeklySummary(workouts: FinishedWorkout[], series: ExerciseSeries[], planned: number, now = new Date()): WeeklySummary {
  const start = weekStart(now).getTime();
  const week  = 7 * DAY;
  const thisWeek = statsBetween(workouts, series, start, start + week);

  let streak = thisWeek.workouts >= planned && planned > 0 ? 1 : 0;
  for (let k = 1; k < 104 && planned > 0; k++) {
    const s = statsBetween(workouts, series, start - k * week, start - (k - 1) * week);
    if (s.workouts >= planned) streak++;
    else break;
  }

  const end = new Date(start + 6 * DAY);
  return {
    weekStart: new Date(start),
    weekEnd:   end,
    planned,
    thisWeek,
    lastWeek:  statsBetween(workouts, series, start - week, start),
    monthAgo:  statsBetween(workouts, series, start - 4 * week, start - 3 * week),
    streak,
  };
}
