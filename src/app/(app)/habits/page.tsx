import Link from "next/link";
import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { currentStreak } from "@/lib/habits/streak";
import { todayISO } from "@/lib/utils";
import { HabitRow } from "@/components/habits/HabitRow";

export default async function HabitsPage() {
  const user = await requireUser();
  const today = todayISO();
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceISO = since.toISOString().slice(0, 10);

  const [habits, areas, logs] = await Promise.all([
    db
      .select()
      .from(schema.habits)
      .where(and(eq(schema.habits.userId, user.id), eq(schema.habits.active, true))),
    db.select().from(schema.lifeAreas),
    db
      .select()
      .from(schema.habitLogs)
      .where(and(eq(schema.habitLogs.userId, user.id), gte(schema.habitLogs.date, sinceISO))),
  ]);

  const areaMap = new Map(areas.map((a) => [a.id, a]));
  const logsByHabit = new Map<string, { date: string; done: boolean }[]>();
  for (const l of logs) {
    const list = logsByHabit.get(l.habitId) ?? [];
    list.push({ date: l.date as unknown as string, done: l.done });
    logsByHabit.set(l.habitId, list);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hábitos</h1>
        <Link
          href="/habits/new"
          className="rounded-xl bg-primary text-primary-foreground text-sm px-3 py-1.5 font-medium"
        >
          + Nuevo
        </Link>
      </header>

      {habits.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
          No tienes hábitos aún. Empieza con uno pequeño.
        </div>
      )}

      <ul className="space-y-2">
        {habits.map((h) => {
          const log = logsByHabit.get(h.id) ?? [];
          const streak = currentStreak(log, today);
          const todayLog = log.find((l) => l.date === today);
          return (
            <HabitRow
              key={h.id}
              habit={{
                id: h.id,
                title: h.title,
                area: areaMap.get(h.areaId) ?? null,
                streak,
                todayDone: todayLog?.done ?? false,
              }}
              date={today}
            />
          );
        })}
      </ul>
    </div>
  );
}
