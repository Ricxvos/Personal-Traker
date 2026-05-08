import { sql } from "drizzle-orm";
import { db, schema } from "./client";
import { AREAS } from "@/lib/catalog/areas";
import { DEMO_USER_ID } from "@/lib/demo";

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("[seed-demo] insertando áreas...");
  for (const area of AREAS) {
    await db
      .insert(schema.lifeAreas)
      .values({
        slug: area.slug,
        nameEs: area.nameEs,
        emoji: area.emoji,
        sortOrder: area.sortOrder,
      })
      .onConflictDoUpdate({
        target: schema.lifeAreas.slug,
        set: { nameEs: area.nameEs, emoji: area.emoji, sortOrder: area.sortOrder },
      });
  }

  const allAreas = await db.select().from(schema.lifeAreas);
  const areaBySlug = new Map(allAreas.map((a) => [a.slug, a]));
  const health = areaBySlug.get("health")!;
  const work = areaBySlug.get("work")!;
  const reading = areaBySlug.get("reading")!;
  const spiritual = areaBySlug.get("spiritual")!;

  console.log("[seed-demo] limpiando datos previos del usuario demo...");
  await db.execute(sql`DELETE FROM checkins WHERE user_id = ${DEMO_USER_ID}::uuid`);
  await db.execute(sql`DELETE FROM habit_logs WHERE user_id = ${DEMO_USER_ID}::uuid`);
  await db.execute(sql`DELETE FROM habits WHERE user_id = ${DEMO_USER_ID}::uuid`);
  await db.execute(sql`DELETE FROM metric_entries WHERE user_id = ${DEMO_USER_ID}::uuid`);
  await db.execute(sql`DELETE FROM metrics WHERE user_id = ${DEMO_USER_ID}::uuid`);
  await db.execute(sql`DELETE FROM daily_plan_items WHERE plan_id IN (SELECT id FROM daily_plans WHERE user_id = ${DEMO_USER_ID}::uuid)`);
  await db.execute(sql`DELETE FROM daily_plans WHERE user_id = ${DEMO_USER_ID}::uuid`);
  await db.execute(sql`DELETE FROM goals WHERE user_id = ${DEMO_USER_ID}::uuid`);
  await db.execute(sql`DELETE FROM user_preferences WHERE user_id = ${DEMO_USER_ID}::uuid`);

  console.log("[seed-demo] preferencias del usuario demo...");
  await db.insert(schema.userPreferences).values({
    userId: DEMO_USER_ID,
    timezone: "America/Mexico_City",
    locale: "es-MX",
    focusAreaIds: [health.id, work.id],
    onboardingCompletedAt: new Date(),
  });

  console.log("[seed-demo] creando 3 metas anuales...");
  const goalsInserted = await db
    .insert(schema.goals)
    .values([
      {
        userId: DEMO_USER_ID,
        areaId: health.id,
        level: "annual",
        title: "Correr 800 km en 2026",
        why: "Mantener salud cardiovascular y disciplina semanal.",
        targetValue: "800",
        currentValue: "240",
        unit: "km",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        status: "active",
      },
      {
        userId: DEMO_USER_ID,
        areaId: work.id,
        level: "annual",
        title: "Lanzar 3 features grandes del producto",
        why: "Demostrar impacto medible en el equipo.",
        targetValue: "3",
        currentValue: "1",
        unit: "features",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        status: "active",
      },
      {
        userId: DEMO_USER_ID,
        areaId: reading.id,
        level: "annual",
        title: "Leer 12 libros este año",
        why: "Aprender de gente que ya pasó por donde voy.",
        targetValue: "12",
        currentValue: "5",
        unit: "libros",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        status: "active",
      },
    ])
    .returning({ id: schema.goals.id });

  console.log(`[seed-demo] ${goalsInserted.length} metas creadas.`);

  console.log("[seed-demo] creando 2 hábitos diarios...");
  const habitsInserted = await db
    .insert(schema.habits)
    .values([
      {
        userId: DEMO_USER_ID,
        areaId: spiritual.id,
        title: "Meditar 10 min",
        cadence: "daily",
        targetCount: 1,
      },
      {
        userId: DEMO_USER_ID,
        areaId: reading.id,
        title: "Leer 20 páginas",
        cadence: "daily",
        targetCount: 1,
      },
    ])
    .returning({ id: schema.habits.id });

  console.log("[seed-demo] sembrando logs de hábitos (streak de 5 días)...");
  const habitLogValues: typeof schema.habitLogs.$inferInsert[] = [];
  for (const h of habitsInserted) {
    for (let i = 0; i < 5; i++) {
      habitLogValues.push({
        habitId: h.id,
        userId: DEMO_USER_ID,
        date: isoDaysAgo(i),
        done: true,
      });
    }
  }
  await db.insert(schema.habitLogs).values(habitLogValues);

  console.log("[seed-demo] creando métricas de salud y trabajo...");
  const metricsInserted = await db
    .insert(schema.metrics)
    .values([
      {
        userId: DEMO_USER_ID,
        areaId: health.id,
        name: "Pasos diarios",
        unit: "pasos",
        source: "manual",
        higherIsBetter: true,
      },
      {
        userId: DEMO_USER_ID,
        areaId: health.id,
        name: "Sueño",
        unit: "horas",
        source: "manual",
        higherIsBetter: true,
      },
    ])
    .returning({ id: schema.metrics.id, name: schema.metrics.name });

  console.log("[seed-demo] sembrando 14 días de datos para cada métrica...");
  const entries: typeof schema.metricEntries.$inferInsert[] = [];
  for (const m of metricsInserted) {
    for (let i = 0; i < 14; i++) {
      const ts = new Date();
      ts.setUTCHours(8, 0, 0, 0);
      ts.setUTCDate(ts.getUTCDate() - i);
      const value =
        m.name === "Pasos diarios"
          ? String(7000 + Math.floor(Math.random() * 4000))
          : (6.5 + Math.random() * 1.5).toFixed(1);
      entries.push({
        metricId: m.id,
        userId: DEMO_USER_ID,
        value,
        ts,
      });
    }
  }
  await db.insert(schema.metricEntries).values(entries);

  console.log("[seed-demo] check-ins de los últimos 7 días...");
  const checkinValues: typeof schema.checkins.$inferInsert[] = [];
  for (const a of [health, work, reading, spiritual]) {
    for (let i = 0; i < 7; i++) {
      const v: "advance" | "keep" | "regress" =
        Math.random() > 0.7 ? "regress" : Math.random() > 0.3 ? "advance" : "keep";
      checkinValues.push({
        userId: DEMO_USER_ID,
        areaId: a.id,
        date: isoDaysAgo(i),
        value: v,
      });
    }
  }
  await db.insert(schema.checkins).values(checkinValues);

  console.log("[seed-demo] listo.");
  console.log(`Demo user_id: ${DEMO_USER_ID}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
