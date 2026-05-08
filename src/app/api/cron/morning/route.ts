import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { listUsersForDailyJobs } from "@/lib/cron/run-for-all-users";
import { loadActiveGoalsForPacing, loadActiveHabits } from "@/lib/plan/load-context";
import { buildRuleBasedPlan } from "@/lib/plan/rule-based-plan";
import { aggregatePacing, pacingForGoal, toneFromGlobalScore } from "@/lib/pacing/calculator";
import { generateAiDailyPlan } from "@/lib/plan/generate";
import { sendPushToUser } from "@/lib/push/web-push";
import { todayISO } from "@/lib/utils";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const date = todayISO();
  const userIds = await listUsersForDailyJobs();
  let processed = 0;

  for (const userId of userIds) {
    try {
      const [goals, habits, areas, prefs] = await Promise.all([
        loadActiveGoalsForPacing(userId),
        loadActiveHabits(userId),
        db.select().from(schema.lifeAreas),
        db
          .select()
          .from(schema.userPreferences)
          .where(eq(schema.userPreferences.userId, userId))
          .limit(1),
      ]);

      const rulePlan = buildRuleBasedPlan({ goals, habits, calendarBusyMinutes: 0 });
      const pacingResults = rulePlan.flatMap((p) => (p.pacing ? [p.pacing] : []));
      const { globalScore } = aggregatePacing(pacingResults);
      const tone = toneFromGlobalScore(globalScore);

      const ai = await generateAiDailyPlan({
        userId,
        purpose: "morning",
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
            doneToday: false,
            streak: 0,
          })),
          calendarEventsToday: [],
          rulePlan,
        },
      });

      await db
        .insert(schema.dailyPlans)
        .values({
          userId,
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
        });

      await sendPushToUser(userId, {
        title: "Plan de hoy listo",
        body: ai.summary.slice(0, 240),
        url: "/today",
        tag: "morning",
      });

      processed++;
    } catch (err) {
      console.error("[cron/morning] user", userId, err);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
