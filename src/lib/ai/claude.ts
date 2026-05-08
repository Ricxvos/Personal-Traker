import Anthropic from "@anthropic-ai/sdk";
import { db, schema } from "@/lib/db/client";
import { sql } from "drizzle-orm";
import { todayISO } from "@/lib/utils";

let _client: Anthropic | null = null;
export function anthropic() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada");
  _client = new Anthropic({ apiKey });
  return _client;
}

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export interface AiUsageRecord {
  inputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
}

export async function recordUsage(
  userId: string,
  purpose: string,
  usage: AiUsageRecord,
) {
  const date = todayISO();
  await db.insert(schema.aiUsage).values({
    userId,
    date,
    model: CLAUDE_MODEL,
    purpose,
    inputTokens: usage.inputTokens,
    cacheReadTokens: usage.cacheReadTokens,
    cacheWriteTokens: usage.cacheWriteTokens,
    outputTokens: usage.outputTokens,
  });
}

export async function dailyAiCallCount(userId: string): Promise<number> {
  const date = todayISO();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.aiUsage)
    .where(sql`${schema.aiUsage.userId} = ${userId} AND ${schema.aiUsage.date} = ${date}`);
  return row?.count ?? 0;
}

export function maxAiCallsPerDay() {
  const raw = process.env.MAX_AI_CALLS_PER_DAY;
  const parsed = raw ? Number.parseInt(raw, 10) : 5;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}
