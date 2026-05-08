import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { refreshGoogleToken } from "./google";

const FIT_AGGREGATE = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate";

interface FitBucket {
  startTimeMillis: string;
  endTimeMillis: string;
  dataset: Array<{
    point: Array<{
      value: Array<{ intVal?: number; fpVal?: number }>;
    }>;
  }>;
}

async function getValidAccessToken(userId: string) {
  const [row] = await db
    .select()
    .from(schema.integrations)
    .where(
      and(eq(schema.integrations.userId, userId), eq(schema.integrations.provider, "google_fit")),
    )
    .limit(1);
  if (!row) throw new Error("Google Fit no conectado");
  if (row.expiresAt && row.expiresAt.getTime() > Date.now() + 30_000) {
    return row.accessToken!;
  }
  if (!row.refreshToken) throw new Error("Sin refresh token; reconecta Google Fit");
  const refreshed = await refreshGoogleToken(row.refreshToken);
  await db
    .update(schema.integrations)
    .set({
      accessToken: refreshed.access_token,
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      updatedAt: new Date(),
    })
    .where(eq(schema.integrations.id, row.id));
  return refreshed.access_token;
}

export async function syncStepsLastNDays(userId: string, days = 7) {
  const token = await getValidAccessToken(userId);
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - days);

  const body = {
    aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
    bucketByTime: { durationMillis: 86_400_000 },
    startTimeMillis: start.getTime(),
    endTimeMillis: end.getTime(),
  };

  const res = await fetch(FIT_AGGREGATE, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google Fit error ${res.status}`);
  const data = (await res.json()) as { bucket: FitBucket[] };

  const [metric] = await db
    .select()
    .from(schema.metrics)
    .where(and(eq(schema.metrics.userId, userId), eq(schema.metrics.name, "Pasos diarios")))
    .limit(1);
  if (!metric) return { synced: 0 };

  let synced = 0;
  for (const bucket of data.bucket ?? []) {
    const ts = new Date(Number(bucket.startTimeMillis));
    const value = bucket.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal ?? 0;
    if (value === 0) continue;
    const sourceRef = `gfit:steps:${ts.toISOString().slice(0, 10)}`;
    await db
      .insert(schema.metricEntries)
      .values({
        metricId: metric.id,
        userId,
        value: value.toString(),
        ts,
        sourceRef,
      })
      .onConflictDoNothing();
    synced++;
  }
  return { synced };
}
