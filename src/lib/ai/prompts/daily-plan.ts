import type { RulePlanItem } from "@/lib/plan/rule-based-plan";
import type { PacingResult } from "@/lib/pacing/calculator";

export interface DailyPromptContext {
  date: string;
  timezone: string;
  tone: "warm" | "neutral" | "demanding";
  globalPacingScore: number;
  focusAreaIds: string[];
  areas: Array<{ id: string; nameEs: string; emoji: string }>;
  goals: Array<{
    id: string;
    title: string;
    areaId: string;
    pacing: PacingResult | null;
    targetValue: number | null;
    currentValue: number;
    unit: string | null;
  }>;
  habits: Array<{ id: string; title: string; areaId: string; doneToday: boolean; streak: number }>;
  calendarEventsToday: Array<{ start: string; end: string; title: string }>;
  rulePlan: RulePlanItem[];
}

export const SYSTEM_PROMPT = [
  "Eres el coach personal de un usuario hispanohablante de México que usa un Samsung Galaxy S24 Ultra.",
  "Tu trabajo es producir cada día un plan corto, claro y priorizado en español.",
  "Reglas de tono:",
  "- tone='warm': motivacional cálido, celebra el avance pero empuja sin perder ritmo.",
  "- tone='neutral': coach directo, datos primero, mensaje breve.",
  "- tone='demanding': exigente pero respetuoso. Confronta excusas, pide acción concreta hoy.",
  "Reglas duras:",
  "- Devuelve únicamente JSON válido conforme al schema indicado.",
  "- Máximo 5 ítems en `priorities`. Habitos van en su propia lista, no se mezclan con prioridades.",
  "- Cada `rationale` debe ser una sola oración accionable.",
  "- `summary` máximo 280 caracteres.",
  "- Usa Markdown solo dentro de `summary`. Nada de listas dentro de campos string.",
].join("\n");

export function buildUserContent(ctx: DailyPromptContext) {
  return [
    `# Contexto del día ${ctx.date} (TZ: ${ctx.timezone})`,
    `Tono solicitado: ${ctx.tone}.`,
    `Pacing global: ${ctx.globalPacingScore.toFixed(2)}.`,
    `Áreas de foco: ${ctx.focusAreaIds.length > 0 ? ctx.focusAreaIds.join(", ") : "(sin definir)"}.`,
    "",
    "## Áreas",
    JSON.stringify(ctx.areas, null, 2),
    "",
    "## Metas activas",
    JSON.stringify(ctx.goals, null, 2),
    "",
    "## Hábitos",
    JSON.stringify(ctx.habits, null, 2),
    "",
    "## Calendario de hoy",
    JSON.stringify(ctx.calendarEventsToday, null, 2),
    "",
    "## Borrador del plan (basado en reglas)",
    JSON.stringify(ctx.rulePlan, null, 2),
    "",
    "Devuelve JSON con la forma:",
    JSON.stringify(
      {
        tone: "warm | neutral | demanding",
        summary: "string",
        priorities: [
          {
            refId: "id de la meta o hábito",
            kind: "goal | habit",
            title: "string",
            rationale: "string",
            estMinutes: 0,
            priority: 0,
          },
        ],
        habits: [{ refId: "string", title: "string", note: "string" }],
        scopeProposals: [
          {
            goalId: "string",
            kind: "reduce | rephase | archive",
            reason: "string",
            suggested: { targetValue: 0, endDate: "YYYY-MM-DD" },
          },
        ],
      },
      null,
      2,
    ),
  ].join("\n");
}
