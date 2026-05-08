import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { loadActiveGoalsForPacing, loadActiveHabits } from "@/lib/plan/load-context";
import { buildRuleBasedPlan } from "@/lib/plan/rule-based-plan";
import { aggregatePacing, toneFromGlobalScore } from "@/lib/pacing/calculator";
import { PlanCard, type PlanCardItem } from "@/components/today/PlanCard";
import { QuickCheckIn } from "@/components/today/QuickCheckIn";
import { todayISO, formatDate } from "@/lib/utils";

const TONE_LABEL: Record<ReturnType<typeof toneFromGlobalScore>, string> = {
  warm: "Vas bien — sigue el ritmo.",
  neutral: "En zona neutra. Hoy importa la consistencia.",
  demanding: "Atrasado. Hoy es para retomar terreno.",
};

export default async function TodayPage() {
  const user = await requireUser();
  const date = todayISO();

  const [goals, habits, areas] = await Promise.all([
    loadActiveGoalsForPacing(user.id),
    loadActiveHabits(user.id),
    db.select().from(schema.lifeAreas).orderBy(schema.lifeAreas.sortOrder),
  ]);

  const plan = buildRuleBasedPlan({ goals, habits, calendarBusyMinutes: 0 });

  const pacingResults = plan.flatMap((p) => (p.pacing ? [p.pacing] : []));
  const { globalScore } = aggregatePacing(pacingResults);
  const tone = toneFromGlobalScore(globalScore);

  const items: PlanCardItem[] = plan.map((p) => ({
    id: p.refId,
    kind: p.kind,
    title: p.title,
    rationale: p.rationale,
    estMinutes: p.estMinutes,
    pacingState: p.pacing?.state,
  }));

  const todaysCheckins = await db
    .select({ areaId: schema.checkins.areaId, value: schema.checkins.value })
    .from(schema.checkins)
    .where(and(eq(schema.checkins.userId, user.id), eq(schema.checkins.date, date)));
  const checkInMap = new Map(todaysCheckins.map((c) => [c.areaId, c.value]));

  const checkInAreas = areas.map((a) => ({
    id: a.id,
    nameEs: a.nameEs,
    emoji: a.emoji,
    todayValue: (checkInMap.get(a.id) as "advance" | "keep" | "regress" | undefined) ?? null,
  }));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {formatDate(date)}
        </p>
        <h1 className="text-2xl font-semibold">Plan de hoy</h1>
        <p className="text-sm text-muted-foreground">{TONE_LABEL[tone]}</p>
      </header>

      <section aria-labelledby="plan-heading" className="space-y-2">
        <h2 id="plan-heading" className="text-sm font-medium text-muted-foreground">
          Prioridades
        </h2>
        <PlanCard items={items} />
      </section>

      <section aria-labelledby="checkin-heading" className="space-y-2">
        <h2 id="checkin-heading" className="text-sm font-medium text-muted-foreground">
          Check-in rápido por área
        </h2>
        <QuickCheckIn areas={checkInAreas} date={date} />
      </section>
    </div>
  );
}
