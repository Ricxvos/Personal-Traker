export interface GoalForPacing {
  id: string;
  title: string;
  targetValue: number | null;
  currentValue: number;
  unit: string | null;
  startDate: string;
  endDate: string;
  level: "annual" | "quarter" | "week" | "day";
  areaId: string;
}

export type PacingState = "ahead" | "on_track" | "behind" | "critically_behind";

export interface PacingResult {
  goalId: string;
  pacingScore: number;
  state: PacingState;
  requiredPerDay: number;
  daysRemaining: number;
  expectedToday: number;
  delta: number;
}

export function pacingForGoal(goal: GoalForPacing, today: Date = new Date()): PacingResult | null {
  if (goal.targetValue == null) return null;

  const start = new Date(goal.startDate);
  const end = new Date(goal.endDate);
  const totalMs = end.getTime() - start.getTime();
  if (totalMs <= 0) return null;

  const elapsedMs = Math.max(0, today.getTime() - start.getTime());
  const elapsedRatio = Math.min(1, elapsedMs / totalMs);

  const expectedToday = goal.targetValue * elapsedRatio;
  const delta = goal.currentValue - expectedToday;

  const remainingDays = Math.max(
    1,
    Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const requiredPerDay = Math.max(0, (goal.targetValue - goal.currentValue) / remainingDays);

  const denom = expectedToday > 0 ? expectedToday : goal.targetValue || 1;
  const pacingScore = Math.max(0, goal.currentValue / denom);

  let state: PacingState = "on_track";
  if (pacingScore >= 1.05) state = "ahead";
  else if (pacingScore >= 0.85) state = "on_track";
  else if (pacingScore >= 0.5) state = "behind";
  else state = "critically_behind";

  return {
    goalId: goal.id,
    pacingScore,
    state,
    requiredPerDay,
    daysRemaining: remainingDays,
    expectedToday,
    delta,
  };
}

export function aggregatePacing(results: PacingResult[]): {
  globalScore: number;
  weakest: PacingResult | null;
} {
  if (results.length === 0) return { globalScore: 1, weakest: null };
  const avg = results.reduce((s, r) => s + r.pacingScore, 0) / results.length;
  const weakest = results.reduce((min, r) => (r.pacingScore < min.pacingScore ? r : min), results[0]);
  return { globalScore: avg, weakest };
}

export function toneFromGlobalScore(score: number): "warm" | "neutral" | "demanding" {
  if (score >= 1.0) return "warm";
  if (score >= 0.7) return "neutral";
  return "demanding";
}
