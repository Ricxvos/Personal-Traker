import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { pacingForGoal } from "@/lib/pacing/calculator";
import { cn } from "@/lib/utils";

const STATE_DOT: Record<NonNullable<ReturnType<typeof pacingForGoal>>["state"], string> = {
  ahead: "bg-success",
  on_track: "bg-primary",
  behind: "bg-warning",
  critically_behind: "bg-destructive",
};

const STATE_LABEL: Record<NonNullable<ReturnType<typeof pacingForGoal>>["state"], string> = {
  ahead: "Adelantado",
  on_track: "En ritmo",
  behind: "Atrasado",
  critically_behind: "Muy atrasado",
};

export default async function GoalsPage() {
  const user = await requireUser();

  const [areas, goals] = await Promise.all([
    db.select().from(schema.lifeAreas).orderBy(schema.lifeAreas.sortOrder),
    db
      .select()
      .from(schema.goals)
      .where(
        and(
          eq(schema.goals.userId, user.id),
          inArray(schema.goals.status, ["active", "paused"]),
        ),
      ),
  ]);

  const byArea = new Map(areas.map((a) => [a.id, a]));
  const grouped = new Map<string, typeof goals>();
  for (const g of goals) {
    const list = grouped.get(g.areaId) ?? [];
    list.push(g);
    grouped.set(g.areaId, list);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Metas</h1>
        <Link
          href="/goals/new"
          className="rounded-xl bg-primary text-primary-foreground text-sm px-3 py-1.5 font-medium"
        >
          + Nueva
        </Link>
      </header>

      {areas.map((area) => {
        const list = grouped.get(area.id) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={area.id} className="space-y-2">
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <span aria-hidden>{area.emoji}</span>
              {area.nameEs}
            </h2>
            <ul className="space-y-2">
              {list.map((g) => {
                const pacing = pacingForGoal({
                  id: g.id,
                  title: g.title,
                  targetValue: g.targetValue == null ? null : Number(g.targetValue),
                  currentValue: g.currentValue == null ? 0 : Number(g.currentValue),
                  unit: g.unit,
                  startDate: g.startDate as unknown as string,
                  endDate: g.endDate as unknown as string,
                  level: g.level,
                  areaId: g.areaId,
                });
                return (
                  <li
                    key={g.id}
                    className="rounded-2xl border border-border bg-card p-4 space-y-1"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                        {g.level}
                      </span>
                      <h3 className="font-medium text-sm flex-1">{g.title}</h3>
                      {pacing && (
                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className={cn("h-2 w-2 rounded-full", STATE_DOT[pacing.state])} />
                          {STATE_LABEL[pacing.state]}
                        </span>
                      )}
                    </div>
                    {g.targetValue && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {g.currentValue ?? 0} / {g.targetValue} {g.unit ?? ""}
                      </p>
                    )}
                    {g.why && <p className="text-xs italic text-muted-foreground">{g.why}</p>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {goals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
          Aún no tienes metas activas.{" "}
          <Link href="/onboarding" className="underline text-primary">
            Empieza el onboarding
          </Link>
          .
        </div>
      )}
    </div>
  );
}
