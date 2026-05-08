"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";

const checkInSchema = z.object({
  areaId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.enum(["advance", "keep", "regress"]),
});

export async function recordCheckIn(input: z.infer<typeof checkInSchema>) {
  const data = checkInSchema.parse(input);
  const user = await requireUser();
  await db
    .insert(schema.checkins)
    .values({ userId: user.id, areaId: data.areaId, date: data.date, value: data.value })
    .onConflictDoUpdate({
      target: [schema.checkins.userId, schema.checkins.areaId, schema.checkins.date],
      set: { value: data.value },
    });
  revalidatePath("/today");
}

const completePlanItemSchema = z.object({ planItemId: z.string().uuid() });

export async function completePlanItem(input: z.infer<typeof completePlanItemSchema>) {
  const data = completePlanItemSchema.parse(input);
  await requireUser();
  await db
    .update(schema.dailyPlanItems)
    .set({ completedAt: new Date() })
    .where(eq(schema.dailyPlanItems.id, data.planItemId));
  revalidatePath("/today");
}
