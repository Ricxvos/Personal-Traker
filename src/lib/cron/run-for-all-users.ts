import { eq, and, isNotNull } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";

export async function listUsersForDailyJobs(): Promise<string[]> {
  const rows = await db
    .select({ userId: schema.userPreferences.userId })
    .from(schema.userPreferences)
    .where(isNotNull(schema.userPreferences.onboardingCompletedAt));
  return rows.map((r) => r.userId);
}

export async function getPlanForToday(userId: string, date: string) {
  const rows = await db
    .select()
    .from(schema.dailyPlans)
    .where(and(eq(schema.dailyPlans.userId, userId), eq(schema.dailyPlans.date, date)))
    .limit(1);
  return rows[0] ?? null;
}
