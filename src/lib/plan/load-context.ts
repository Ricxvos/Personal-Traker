import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import type { GoalForPacing } from "@/lib/pacing/calculator";

export async function loadActiveGoalsForPacing(userId: string): Promise<GoalForPacing[]> {
  const rows = await db
    .select({
      id: schema.goals.id,
      areaId: schema.goals.areaId,
      title: schema.goals.title,
      level: schema.goals.level,
      targetValue: schema.goals.targetValue,
      currentValue: schema.goals.currentValue,
      unit: schema.goals.unit,
      startDate: schema.goals.startDate,
      endDate: schema.goals.endDate,
    })
    .from(schema.goals)
    .where(
      and(
        eq(schema.goals.userId, userId),
        eq(schema.goals.status, "active"),
        inArray(schema.goals.level, ["annual", "quarter", "week"]),
      ),
    );

  return rows.map((r) => ({
    id: r.id,
    areaId: r.areaId,
    title: r.title,
    level: r.level,
    targetValue: r.targetValue == null ? null : Number(r.targetValue),
    currentValue: r.currentValue == null ? 0 : Number(r.currentValue),
    unit: r.unit,
    startDate: r.startDate as unknown as string,
    endDate: r.endDate as unknown as string,
  }));
}

export async function loadActiveHabits(userId: string) {
  return db
    .select({
      id: schema.habits.id,
      title: schema.habits.title,
      areaId: schema.habits.areaId,
    })
    .from(schema.habits)
    .where(and(eq(schema.habits.userId, userId), eq(schema.habits.active, true)));
}
