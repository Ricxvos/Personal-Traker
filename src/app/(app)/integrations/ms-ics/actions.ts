"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";

const schemaIn = z.object({ url: z.string().url() });

export async function saveIcsUrl(input: z.infer<typeof schemaIn>) {
  const data = schemaIn.parse(input);
  const user = await requireUser();
  await db
    .insert(schema.integrations)
    .values({
      userId: user.id,
      provider: "ms_ics",
      config: { url: data.url },
    })
    .onConflictDoUpdate({
      target: [schema.integrations.userId, schema.integrations.provider],
      set: { config: { url: data.url }, updatedAt: new Date() },
    });
  revalidatePath("/integrations");
}
