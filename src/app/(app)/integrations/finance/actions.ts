"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { parseFinanceCsv } from "@/lib/integrations/finance-csv";

export async function uploadFinanceCsv(content: string): Promise<{ inserted: number }> {
  const user = await requireUser();
  const rows = parseFinanceCsv(content);

  const incomeName = "Ingresos del mes";
  const expenseName = "Gastos del mes";

  const [areaRow] = await db
    .select()
    .from(schema.lifeAreas)
    .where(eq(schema.lifeAreas.slug, "finance"))
    .limit(1);
  if (!areaRow) return { inserted: 0 };

  const ensureMetric = async (name: string) => {
    const [existing] = await db
      .select()
      .from(schema.metrics)
      .where(
        and(
          eq(schema.metrics.userId, user.id),
          eq(schema.metrics.areaId, areaRow.id),
          eq(schema.metrics.name, name),
        ),
      )
      .limit(1);
    if (existing) return existing;
    const [inserted] = await db
      .insert(schema.metrics)
      .values({
        userId: user.id,
        areaId: areaRow.id,
        name,
        unit: "MXN",
        higherIsBetter: name === incomeName,
        source: "csv",
      })
      .returning();
    return inserted;
  };

  const incomeMetric = await ensureMetric(incomeName);
  const expenseMetric = await ensureMetric(expenseName);

  const monthly = new Map<string, { income: number; expense: number }>();
  for (const r of rows) {
    const monthKey = r.date.slice(0, 7);
    const cur = monthly.get(monthKey) ?? { income: 0, expense: 0 };
    if (r.type === "income") cur.income += r.amount;
    else cur.expense += r.amount;
    monthly.set(monthKey, cur);
  }

  let inserted = 0;
  for (const [monthKey, totals] of monthly) {
    const ts = new Date(`${monthKey}-01T12:00:00Z`);
    if (totals.income > 0) {
      await db
        .insert(schema.metricEntries)
        .values({
          metricId: incomeMetric.id,
          userId: user.id,
          value: totals.income.toFixed(2),
          ts,
          sourceRef: `csv:income:${monthKey}`,
        })
        .onConflictDoNothing();
      inserted++;
    }
    if (totals.expense > 0) {
      await db
        .insert(schema.metricEntries)
        .values({
          metricId: expenseMetric.id,
          userId: user.id,
          value: totals.expense.toFixed(2),
          ts,
          sourceRef: `csv:expense:${monthKey}`,
        })
        .onConflictDoNothing();
      inserted++;
    }
  }

  await db
    .insert(schema.integrations)
    .values({ userId: user.id, provider: "csv_finance" })
    .onConflictDoUpdate({
      target: [schema.integrations.userId, schema.integrations.provider],
      set: { updatedAt: new Date(), status: "active" },
    });

  revalidatePath("/progress");
  return { inserted };
}
