import { db, schema } from "./client";
import { AREAS } from "@/lib/catalog/areas";

async function main() {
  console.log("[seed] insertando áreas...");
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
        set: {
          nameEs: area.nameEs,
          emoji: area.emoji,
          sortOrder: area.sortOrder,
        },
      });
  }
  console.log(`[seed] ${AREAS.length} áreas listas.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
