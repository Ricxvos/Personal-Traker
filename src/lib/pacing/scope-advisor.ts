import type { PacingResult } from "./calculator";

export interface ScopeProposal {
  goalId: string;
  kind: "reduce" | "rephase" | "archive";
  reason: string;
  suggested: { targetValue?: number; endDate?: string };
}

export interface ScopeAdvisorInput {
  pacing: PacingResult;
  goal: { id: string; targetValue: number | null; endDate: string; currentValue: number };
  daysCriticallyBehind: number;
}

const CRITICAL_DAYS_TRIGGER = 14;

export function suggestScopeChange(input: ScopeAdvisorInput): ScopeProposal | null {
  const { pacing, goal, daysCriticallyBehind } = input;
  if (daysCriticallyBehind < CRITICAL_DAYS_TRIGGER) return null;
  if (pacing.state !== "critically_behind") return null;
  if (goal.targetValue == null) return null;

  if (pacing.pacingScore < 0.25) {
    return {
      goalId: goal.id,
      kind: "archive",
      reason: `Llevas ${daysCriticallyBehind} días con pacing < 0.25. La meta probablemente requiere un reset.`,
      suggested: {},
    };
  }

  const proRated = Math.round(goal.targetValue * Math.max(0.4, pacing.pacingScore));
  return {
    goalId: goal.id,
    kind: "reduce",
    reason: `Reducir el target a ${proRated} para mantener una meta alcanzable y conservar momentum.`,
    suggested: { targetValue: proRated },
  };
}
