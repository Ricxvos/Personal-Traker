"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";

const createHabitSchema = z.object({
  areaId: z.string().uuid(),
  title: z.string().min(1).max(120),
  cadence: z.enum(["daily", "weekly", "n_per_week"]).default("daily"),
  targetCount: z.coerce.number().int().min(1).max(7).default(1),
});

export async function createHabit(input: z.infer<typeof createHabitSchema>) {
  const data = createHabitSchema.parse(input);
  const user = await requireUser();
  await db.insert(schema.habits).values({
    userId: user.id,
    areaId: data.areaId,
    title: data.title,
    cadence: data.cadence,
    targetCount: data.targetCount,
  });
  revalidatePath("/habits");
  revalidatePath("/today");
}

const toggleSchema = z.object({
  habitId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  done: z.boolean(),
});

export async function toggleHabitLog(input: z.infer<typeof toggleSchema>) {
  const data = toggleSchema.parse(input);
  const user = await requireUser();
  await db
    .insert(schema.habitLogs)
    .values({ habitId: data.habitId, userId: user.id, date: data.date, done: data.done })
    .onConflictDoUpdate({
      target: [schema.habitLogs.habitId, schema.habitLogs.date],
      set: { done: data.done },
    });
  revalidatePath("/habits");
  revalidatePath("/today");
}

const archiveSchema = z.object({ habitId: z.string().uuid() });

export async function archiveHabit(input: z.infer<typeof archiveSchema>) {
  const data = archiveSchema.parse(input);
  const user = await requireUser();
  await db
    .update(schema.habits)
    .set({ active: false })
    .where(and(eq(schema.habits.id, data.habitId), eq(schema.habits.userId, user.id)));
  revalidatePath("/habits");
}
