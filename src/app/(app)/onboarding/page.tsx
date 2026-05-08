import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { METRICS_BY_AREA } from "@/lib/catalog/metrics-by-area";
import type { AreaSlug } from "@/lib/catalog/areas";

export default async function OnboardingPage() {
  const user = await requireUser();

  const prefs = await db
    .select()
    .from(schema.userPreferences)
    .where(eq(schema.userPreferences.userId, user.id))
    .limit(1);

  if (prefs[0]?.onboardingCompletedAt) redirect("/today");

  const areas = await db.select().from(schema.lifeAreas).orderBy(schema.lifeAreas.sortOrder);

  const seed = areas.map((a) => ({
    id: a.id,
    slug: a.slug as AreaSlug,
    nameEs: a.nameEs,
    emoji: a.emoji,
    metricSuggestions: METRICS_BY_AREA[a.slug as AreaSlug] ?? [],
  }));

  return <OnboardingWizard areas={seed} />;
}
