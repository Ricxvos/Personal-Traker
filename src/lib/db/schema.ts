import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  uuid,
  timestamp,
  date,
  integer,
  numeric,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const areaSlug = pgEnum("area_slug", [
  "health",
  "work",
  "venture",
  "social",
  "relationships",
  "finance",
  "study",
  "spiritual",
  "reading",
]);

export const goalLevel = pgEnum("goal_level", ["annual", "quarter", "week", "day"]);
export const goalStatus = pgEnum("goal_status", ["active", "paused", "archived", "completed"]);
export const metricSource = pgEnum("metric_source", [
  "manual",
  "google_fit",
  "google_calendar",
  "ms_graph",
  "ms_ics",
  "coupler",
  "csv",
  "sheets",
]);
export const habitCadence = pgEnum("habit_cadence", ["daily", "weekly", "n_per_week"]);
export const planItemSource = pgEnum("plan_item_source", ["rule", "ai"]);
export const checkinValue = pgEnum("checkin_value", ["advance", "keep", "regress"]);

export const lifeAreas = pgTable("life_areas", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: areaSlug("slug").notNull().unique(),
  nameEs: text("name_es").notNull(),
  emoji: text("emoji").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey(),
  timezone: text("timezone").notNull().default("America/Mexico_City"),
  locale: text("locale").notNull().default("es-MX"),
  focusAreaIds: jsonb("focus_area_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  toneOverride: text("tone_override"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    areaId: uuid("area_id")
      .notNull()
      .references(() => lifeAreas.id),
    parentId: uuid("parent_id"),
    level: goalLevel("level").notNull(),
    title: text("title").notNull(),
    why: text("why"),
    targetValue: numeric("target_value"),
    currentValue: numeric("current_value").default("0"),
    unit: text("unit"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: goalStatus("status").notNull().default("active"),
    scopeHistory: jsonb("scope_history").$type<
      Array<{
        at: string;
        kind: "reduce" | "rephase" | "archive";
        previous: { targetValue?: string; endDate?: string };
        next: { targetValue?: string; endDate?: string };
        reason?: string;
      }>
    >()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("goals_user_idx").on(t.userId),
    parentIdx: index("goals_parent_idx").on(t.parentId),
  }),
);

export const metrics = pgTable(
  "metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    areaId: uuid("area_id")
      .notNull()
      .references(() => lifeAreas.id),
    name: text("name").notNull(),
    unit: text("unit").notNull(),
    source: metricSource("source").notNull().default("manual"),
    sourceConfig: jsonb("source_config").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    higherIsBetter: boolean("higher_is_better").notNull().default(true),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("metrics_user_idx").on(t.userId),
    uniqPerUser: uniqueIndex("metrics_user_name_idx").on(t.userId, t.areaId, t.name),
  }),
);

export const metricEntries = pgTable(
  "metric_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    metricId: uuid("metric_id")
      .notNull()
      .references(() => metrics.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    value: numeric("value").notNull(),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
    sourceRef: text("source_ref"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byMetricTs: index("metric_entries_metric_ts_idx").on(t.metricId, t.ts),
    uniqRef: uniqueIndex("metric_entries_unique_ref_idx").on(t.metricId, t.sourceRef),
  }),
);

export const actions = pgTable(
  "actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    estMinutes: integer("est_minutes"),
    recurrence: text("recurrence"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("actions_user_idx").on(t.userId),
  }),
);

export const habits = pgTable(
  "habits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    areaId: uuid("area_id")
      .notNull()
      .references(() => lifeAreas.id),
    title: text("title").notNull(),
    cadence: habitCadence("cadence").notNull().default("daily"),
    targetCount: integer("target_count").notNull().default(1),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("habits_user_idx").on(t.userId),
  }),
);

export const habitLogs = pgTable(
  "habit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    done: boolean("done").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqPerDay: uniqueIndex("habit_logs_habit_date_idx").on(t.habitId, t.date),
  }),
);

export const dailyPlans = pgTable(
  "daily_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    aiSummary: text("ai_summary"),
    tone: text("tone"),
    pacingScore: numeric("pacing_score"),
    jsonPlan: jsonb("json_plan").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqPerDay: uniqueIndex("daily_plans_user_date_idx").on(t.userId, t.date),
  }),
);

export const dailyPlanItems = pgTable(
  "daily_plan_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => dailyPlans.id, { onDelete: "cascade" }),
    actionId: uuid("action_id").references(() => actions.id, { onDelete: "set null" }),
    habitId: uuid("habit_id").references(() => habits.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    rationale: text("rationale"),
    priority: integer("priority").notNull().default(0),
    estMinutes: integer("est_minutes"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    source: planItemSource("source").notNull().default("rule"),
  },
  (t) => ({
    byPlan: index("daily_plan_items_plan_idx").on(t.planId),
  }),
);

export const checkins = pgTable(
  "checkins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    areaId: uuid("area_id")
      .notNull()
      .references(() => lifeAreas.id),
    date: date("date").notNull(),
    value: checkinValue("value").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqPerArea: uniqueIndex("checkins_user_area_date_idx").on(t.userId, t.areaId, t.date),
  }),
);

export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    provider: text("provider").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    scopes: text("scopes"),
    accountEmail: text("account_email"),
    config: jsonb("config").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    status: text("status").notNull().default("active"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqPerUser: uniqueIndex("integrations_user_provider_idx").on(t.userId, t.provider),
  }),
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    authKey: text("auth_key").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqEndpoint: uniqueIndex("push_subs_endpoint_idx").on(t.endpoint),
  }),
);

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    purpose: text("purpose").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byUserDate: index("ai_usage_user_date_idx").on(t.userId, t.date),
  }),
);
