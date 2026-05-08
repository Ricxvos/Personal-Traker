import { pacingForGoal, type GoalForPacing, type PacingResult } from "@/lib/pacing/calculator";

export interface RulePlanInput {
  goals: GoalForPacing[];
  habits: { id: string; title: string; areaId: string }[];
  calendarBusyMinutes: number;
  today?: Date;
}

export interface RulePlanItem {
  source: "rule";
  kind: "goal" | "habit";
  refId: string;
  areaId: string;
  title: string;
  rationale: string;
  priority: number;
  estMinutes?: number;
  pacing?: PacingResult;
}

export function buildRuleBasedPlan(input: RulePlanInput): RulePlanItem[] {
  const today = input.today ?? new Date();
  const goalItems: RulePlanItem[] = [];

  for (const g of input.goals) {
    const pacing = pacingForGoal(g, today);
    if (!pacing) continue;

    const urgency = 1 - pacing.pacingScore;
    const calendarPenalty = input.calendarBusyMinutes > 360 ? 0.2 : 0;
    const priority = Math.max(0, urgency - calendarPenalty);

    const unit = g.unit ?? "";
    goalItems.push({
      source: "rule",
      kind: "goal",
      refId: g.id,
      areaId: g.areaId,
      title: g.title,
      rationale:
        pacing.state === "critically_behind"
          ? `Muy atrasado: necesitas ${pacing.requiredPerDay.toFixed(1)} ${unit} hoy.`
          : pacing.state === "behind"
            ? `Atrás del ritmo. Avanza ${pacing.requiredPerDay.toFixed(1)} ${unit} hoy.`
            : pacing.state === "ahead"
              ? `Adelantado. Mantén el ritmo con ${pacing.requiredPerDay.toFixed(1)} ${unit}.`
              : `En ritmo: ${pacing.requiredPerDay.toFixed(1)} ${unit} hoy.`,
      priority,
      pacing,
    });
  }

  goalItems.sort((a, b) => b.priority - a.priority);

  const habitItems: RulePlanItem[] = input.habits.map((h, idx) => ({
    source: "rule",
    kind: "habit",
    refId: h.id,
    areaId: h.areaId,
    title: h.title,
    rationale: "Hábito diario",
    priority: 0.3 - idx * 0.01,
  }));

  const top = goalItems.slice(0, 5);
  return [...top, ...habitItems];
}
