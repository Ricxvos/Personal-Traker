CREATE TYPE "public"."area_slug" AS ENUM('health', 'work', 'venture', 'social', 'relationships', 'finance', 'study', 'spiritual', 'reading');--> statement-breakpoint
CREATE TYPE "public"."checkin_value" AS ENUM('advance', 'keep', 'regress');--> statement-breakpoint
CREATE TYPE "public"."goal_level" AS ENUM('annual', 'quarter', 'week', 'day');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('active', 'paused', 'archived', 'completed');--> statement-breakpoint
CREATE TYPE "public"."habit_cadence" AS ENUM('daily', 'weekly', 'n_per_week');--> statement-breakpoint
CREATE TYPE "public"."metric_source" AS ENUM('manual', 'google_fit', 'google_calendar', 'ms_graph', 'ms_ics', 'coupler', 'csv', 'sheets');--> statement-breakpoint
CREATE TYPE "public"."plan_item_source" AS ENUM('rule', 'ai');--> statement-breakpoint
CREATE TABLE "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid,
	"title" text NOT NULL,
	"est_minutes" integer,
	"recurrence" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"cache_read_tokens" integer DEFAULT 0 NOT NULL,
	"cache_write_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"purpose" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"date" date NOT NULL,
	"value" "checkin_value" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"action_id" uuid,
	"habit_id" uuid,
	"title" text NOT NULL,
	"rationale" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"est_minutes" integer,
	"completed_at" timestamp with time zone,
	"source" "plan_item_source" DEFAULT 'rule' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"ai_summary" text,
	"tone" text,
	"pacing_score" numeric,
	"json_plan" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"parent_id" uuid,
	"level" "goal_level" NOT NULL,
	"title" text NOT NULL,
	"why" text,
	"target_value" numeric,
	"current_value" numeric DEFAULT '0',
	"unit" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"scope_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"habit_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"done" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"title" text NOT NULL,
	"cadence" "habit_cadence" DEFAULT 'daily' NOT NULL,
	"target_count" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"scopes" text,
	"account_email" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "life_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" "area_slug" NOT NULL,
	"name_es" text NOT NULL,
	"emoji" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "life_areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "metric_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"value" numeric NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"source_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"source" "metric_source" DEFAULT 'manual' NOT NULL,
	"source_config" jsonb DEFAULT '{}'::jsonb,
	"higher_is_better" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth_key" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'America/Mexico_City' NOT NULL,
	"locale" text DEFAULT 'es-MX' NOT NULL,
	"focus_area_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tone_override" text,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_area_id_life_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."life_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_plan_id_daily_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."daily_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_plan_items" ADD CONSTRAINT "daily_plan_items_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_area_id_life_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."life_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_area_id_life_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."life_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_entries" ADD CONSTRAINT "metric_entries_metric_id_metrics_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_area_id_life_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."life_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actions_user_idx" ON "actions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_usage_user_date_idx" ON "ai_usage" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "checkins_user_area_date_idx" ON "checkins" USING btree ("user_id","area_id","date");--> statement-breakpoint
CREATE INDEX "daily_plan_items_plan_idx" ON "daily_plan_items" USING btree ("plan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_plans_user_date_idx" ON "daily_plans" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goals_parent_idx" ON "goals" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "habit_logs_habit_date_idx" ON "habit_logs" USING btree ("habit_id","date");--> statement-breakpoint
CREATE INDEX "habits_user_idx" ON "habits" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_user_provider_idx" ON "integrations" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "metric_entries_metric_ts_idx" ON "metric_entries" USING btree ("metric_id","ts");--> statement-breakpoint
CREATE UNIQUE INDEX "metric_entries_unique_ref_idx" ON "metric_entries" USING btree ("metric_id","source_ref");--> statement-breakpoint
CREATE INDEX "metrics_user_idx" ON "metrics" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "metrics_user_name_idx" ON "metrics" USING btree ("user_id","area_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subs_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");