import { eq, and } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { saveIcsUrl } from "./actions";
import { IcsForm } from "./IcsForm";

export default async function MsIcsPage() {
  const user = await requireUser();
  const [existing] = await db
    .select()
    .from(schema.integrations)
    .where(and(eq(schema.integrations.userId, user.id), eq(schema.integrations.provider, "ms_ics")))
    .limit(1);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Outlook ICS feed</h1>
        <p className="text-sm text-muted-foreground">
          Si tu Outlook empresarial bloquea OAuth: en Outlook web, abre Configuración →
          Calendario → Calendarios compartidos → Publica tu calendario y copia el enlace ICS aquí.
        </p>
      </header>
      <IcsForm
        initialUrl={(existing?.config as { url?: string })?.url ?? ""}
        save={saveIcsUrl}
      />
    </div>
  );
}
