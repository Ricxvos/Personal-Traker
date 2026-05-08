"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";

const createGoalSchema = z.object({
  areaId: z.string().uuid(),
  level: z.enum(["annual", "quarter", "week", "day"]),
  title: z.string().min(1).max(200),
  why: z.string().max(500).optional(),
  targetValue: z.coerce.number().nonnegative().optional(),
  unit: z.string().max(40).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  parentId: z.string().uuid().optional(),
});

export async function createGoal(input: z.infer<typeof createGoalSchema>) {
  const data = createGoalSchema.parse(input);
  const user = await requireUser();
  const [row] = await db
    .insert(schema.goals)
    .values({
      userId: user.id,
      areaId: data.areaId,
      level: data.level,
      title: data.title,
      why: data.why,
      targetValue: data.targetValue?.toString(),
      unit: data.unit,
      startDate: data.startDate,
      endDate: data.endDate,
      parentId: data.parentId,
    })
    .returning({ id: schema.goals.id });
  revalidatePath("/goals");
  revalidatePath("/today");
  return row;
}

const updateProgressSchema = z.object({
  goalId: z.string().uuid(),
  currentValue: z.coerce.number().nonnegative(),
});

export async function updateGoalProgress(input: z.infer<typeof updateProgressSchema>) {
  const data = updateProgressSchema.parse(input);
  const user = await requireUser();
  await db
    .update(schema.goals)
    .set({ currentValue: data.currentValue.toString(), updatedAt: new Date() })
    .where(and(eq(schema.goals.id, data.goalId), eq(schema.goals.userId, user.id)));
  revalidatePath("/goals");
  revalidatePath("/today");
}

const archiveGoalSchema = z.object({ goalId: z.string().uuid() });

export async function archiveGoal(input: z.infer<typeof archiveGoalSchema>) {
  const data = archiveGoalSchema.parse(input);
  const user = await requireUser();
  await db
    .update(schema.goals)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(schema.goals.id, data.goalId), eq(schema.goals.userId, user.id)));
  revalidatePath("/goals");
}
