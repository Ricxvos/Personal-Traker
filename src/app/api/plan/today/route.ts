import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { loadActiveGoalsForPacing, loadActiveHabits } from "@/lib/plan/load-context";
import { buildRuleBasedPlan } from "@/lib/plan/rule-based-plan";
import { aggregatePacing, pacingForGoal, toneFromGlobalScore } from "@/lib/pacing/calculator";
import { generateAiDailyPlan } from "@/lib/plan/generate";
import { todayISO } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const purpose = (url.searchParams.get("purpose") ?? "morning") as
    | "morning"
    | "midday"
    | "evening";

  const date = todayISO();

  const [goals, habits, areas, prefs, todayHabitLogs] = await Promise.all([
    loadActiveGoalsForPacing(user.id),
    loadActiveHabits(user.id),
    db.select().from(schema.lifeAreas).orderBy(schema.lifeAreas.sortOrder),
    db
      .select()
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, user.id))
      .limit(1),
    db
      .select()
      .from(schema.habitLogs)
      .where(and(eq(schema.habitLogs.userId, user.id), eq(schema.habitLogs.date, date))),
  ]);

  const rulePlan = buildRuleBasedPlan({ goals, habits, calendarBusyMinutes: 0 });
  const pacingResults = rulePlan.flatMap((p) => (p.pacing ? [p.pacing] : []));
  const { globalScore } = aggregatePacing(pacingResults);
  const tone = toneFromGlobalScore(globalScore);

  const habitLogMap = new Map(todayHabitLogs.map((l) => [l.habitId, l.done]));

  const ai = await generateAiDailyPlan({
    userId: user.id,
    purpose,
    rulePlan,
    context: {
      date,
      timezone: prefs[0]?.timezone ?? "America/Mexico_City",
      tone,
      globalPacingScore: globalScore,
      focusAreaIds: prefs[0]?.focusAreaIds ?? [],
      areas: areas.map((a) => ({ id: a.id, nameEs: a.nameEs, emoji: a.emoji })),
      goals: goals.map((g) => ({
        id: g.id,
        title: g.title,
        areaId: g.areaId,
        pacing: pacingForGoal(g),
        targetValue: g.targetValue,
        currentValue: g.currentValue,
        unit: g.unit,
      })),
      habits: habits.map((h) => ({
        id: h.id,
        title: h.title,
        areaId: h.areaId,
        doneToday: habitLogMap.get(h.id) ?? false,
        streak: 0,
      })),
      calendarEventsToday: [],
      rulePlan,
    },
  });

  const [plan] = await db
    .insert(schema.dailyPlans)
    .values({
      userId: user.id,
      date,
      aiSummary: ai.summary,
      tone: ai.tone,
      pacingScore: globalScore.toString(),
      jsonPlan: ai as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: [schema.dailyPlans.userId, schema.dailyPlans.date],
      set: {
        aiSummary: ai.summary,
        tone: ai.tone,
        pacingScore: globalScore.toString(),
        jsonPlan: ai as unknown as Record<string, unknown>,
      },
    })
    .returning({ id: schema.dailyPlans.id });

  await db
    .delete(schema.dailyPlanItems)
    .where(eq(schema.dailyPlanItems.planId, plan.id));

  if (ai.priorities.length > 0) {
    await db.insert(schema.dailyPlanItems).values(
      ai.priorities.map((p, idx) => ({
        planId: plan.id,
        actionId: p.kind === "goal" ? null : null,
        habitId: p.kind === "habit" ? p.refId : null,
        title: p.title,
        rationale: p.rationale,
        priority: p.priority ?? idx,
        estMinutes: p.estMinutes ?? null,
        source: "ai" as const,
      })),
    );
  }

  return NextResponse.json({ ok: true, plan: ai });
}
