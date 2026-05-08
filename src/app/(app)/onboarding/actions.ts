"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  focusAreaIds: z.array(z.string().uuid()).min(1).max(2),
  goals: z.array(
    z.object({
      areaId: z.string().uuid(),
      title: z.string().min(1).max(200),
      why: z.string().max(500).optional(),
      targetValue: z.coerce.number().nonnegative().optional(),
      unit: z.string().max(40).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  ),
  metrics: z.array(
    z.object({
      areaId: z.string().uuid(),
      name: z.string().min(1).max(120),
      unit: z.string().min(1).max(40),
      higherIsBetter: z.boolean(),
      source: z.enum([
        "manual",
        "google_fit",
        "google_calendar",
        "ms_graph",
        "ms_ics",
        "coupler",
        "csv",
        "sheets",
      ]),
    }),
  ),
  habits: z.array(
    z.object({
      areaId: z.string().uuid(),
      title: z.string().min(1).max(120),
      cadence: z.enum(["daily", "weekly", "n_per_week"]).default("daily"),
      targetCount: z.coerce.number().int().min(1).max(7).default(1),
    }),
  ),
});

export async function completeOnboarding(input: z.infer<typeof onboardingSchema>) {
  const data = onboardingSchema.parse(input);
  const user = await requireUser();

  const startDate = new Date().toISOString().slice(0, 10);

  await db.transaction(async (tx) => {
    for (const goal of data.goals) {
      await tx.insert(schema.goals).values({
        userId: user.id,
        areaId: goal.areaId,
        level: "annual",
        title: goal.title,
        why: goal.why,
        targetValue: goal.targetValue?.toString(),
        unit: goal.unit,
        startDate,
        endDate: goal.endDate,
      });
    }

    for (const metric of data.metrics) {
      await tx
        .insert(schema.metrics)
        .values({
          userId: user.id,
          areaId: metric.areaId,
          name: metric.name,
          unit: metric.unit,
          higherIsBetter: metric.higherIsBetter,
          source: metric.source,
        })
        .onConflictDoNothing();
    }

    for (const habit of data.habits) {
      await tx.insert(schema.habits).values({
        userId: user.id,
        areaId: habit.areaId,
        title: habit.title,
        cadence: habit.cadence,
        targetCount: habit.targetCount,
      });
    }

    await tx
      .insert(schema.userPreferences)
      .values({
        userId: user.id,
        focusAreaIds: data.focusAreaIds,
        onboardingCompletedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.userPreferences.userId,
        set: {
          focusAreaIds: data.focusAreaIds,
          onboardingCompletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  });

  revalidatePath("/today");
  revalidatePath("/goals");
  revalidatePath("/habits");
}
