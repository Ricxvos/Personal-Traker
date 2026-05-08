import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { CheckinHeatmap } from "@/components/progress/CheckinHeatmap";

export default async function ProgressPage() {
  const user = await requireUser();
  const since = new Date();
  since.setDate(since.getDate() - 60);
  const sinceISO = since.toISOString().slice(0, 10);

  const [areas, checkins] = await Promise.all([
    db.select().from(schema.lifeAreas).orderBy(schema.lifeAreas.sortOrder),
    db
      .select()
      .from(schema.checkins)
      .where(and(eq(schema.checkins.userId, user.id), gte(schema.checkins.date, sinceISO))),
  ]);

  const byArea = new Map<string, { date: string; value: string }[]>();
  for (const c of checkins) {
    const list = byArea.get(c.areaId) ?? [];
    list.push({ date: c.date as unknown as string, value: c.value });
    byArea.set(c.areaId, list);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Progreso</h1>
      <p className="text-sm text-muted-foreground">
        Últimos 60 días de check-ins por área.
      </p>

      <ul className="space-y-3">
        {areas.map((a) => (
          <li key={a.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span aria-hidden>{a.emoji}</span>
              <span>{a.nameEs}</span>
            </div>
            <CheckinHeatmap entries={byArea.get(a.id) ?? []} days={60} />
          </li>
        ))}
      </ul>
    </div>
  );
}
