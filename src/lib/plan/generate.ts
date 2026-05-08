import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { anthropic, CLAUDE_MODEL, recordUsage, dailyAiCallCount, maxAiCallsPerDay } from "@/lib/ai/claude";
import { SYSTEM_PROMPT, buildUserContent, type DailyPromptContext } from "@/lib/ai/prompts/daily-plan";
import type { RulePlanItem } from "@/lib/plan/rule-based-plan";

const aiPlanSchema = z.object({
  tone: z.enum(["warm", "neutral", "demanding"]),
  summary: z.string().max(500),
  priorities: z
    .array(
      z.object({
        refId: z.string(),
        kind: z.enum(["goal", "habit"]),
        title: z.string(),
        rationale: z.string(),
        estMinutes: z.number().int().nonnegative().optional().nullable(),
        priority: z.number().nonnegative().optional().nullable(),
      }),
    )
    .max(5),
  habits: z
    .array(
      z.object({ refId: z.string(), title: z.string(), note: z.string().optional().default("") }),
    )
    .default([]),
  scopeProposals: z
    .array(
      z.object({
        goalId: z.string(),
        kind: z.enum(["reduce", "rephase", "archive"]),
        reason: z.string(),
        suggested: z
          .object({
            targetValue: z.number().optional().nullable(),
            endDate: z.string().optional().nullable(),
          })
          .default({}),
      }),
    )
    .default([]),
});

export type AiDailyPlan = z.infer<typeof aiPlanSchema>;

export interface GenerateOptions {
  userId: string;
  context: DailyPromptContext;
  rulePlan: RulePlanItem[];
  purpose: "morning" | "midday" | "evening";
}

export async function generateAiDailyPlan(opts: GenerateOptions): Promise<AiDailyPlan> {
  const used = await dailyAiCallCount(opts.userId);
  if (used >= maxAiCallsPerDay()) {
    throw new Error("Cuota de llamadas a Claude alcanzada para hoy.");
  }

  const client = anthropic();
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildUserContent(opts.context),
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `Genera el plan para el momento "${opts.purpose}". Responde sólo con JSON válido.`,
          },
        ],
      },
    ],
  });

  const usage = {
    inputTokens: response.usage.input_tokens ?? 0,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
    outputTokens: response.usage.output_tokens ?? 0,
  };
  await recordUsage(opts.userId, opts.purpose, usage);

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) {
    throw new Error("Respuesta de Claude sin JSON parseable.");
  }
  const payload = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  return aiPlanSchema.parse(payload);
}
