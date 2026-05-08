import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { EnableNotificationsButton } from "@/components/integrations/EnableNotificationsButton";

interface Provider {
  key: string;
  name: string;
  description: string;
  authPath: string;
  area: string;
}

const PROVIDERS: Provider[] = [
  {
    key: "google_fit",
    name: "Google Fit / Health Connect",
    description:
      "Pasos, sueño, FC, calorías. Conecta tu Galaxy Watch via Samsung Health → Health Connect.",
    authPath: "/api/integrations/google-fit/connect",
    area: "Salud",
  },
  {
    key: "google_calendar",
    name: "Google Calendar",
    description: "Eventos del calendario personal.",
    authPath: "/api/integrations/google-calendar/connect",
    area: "Trabajo",
  },
  {
    key: "ms_graph",
    name: "Outlook (Microsoft Graph)",
    description: "Calendario empresarial. Si tu admin bloquea OAuth, usa el feed ICS abajo.",
    authPath: "/api/integrations/ms-graph/connect",
    area: "Trabajo",
  },
  {
    key: "ms_ics",
    name: "Outlook ICS feed (fallback)",
    description: "Para cuentas empresariales que no permiten OAuth.",
    authPath: "/integrations/ms-ics",
    area: "Trabajo",
  },
  {
    key: "coupler",
    name: "Coupler.io",
    description: "Redes sociales (Instagram, TikTok, YouTube, X).",
    authPath: "/api/integrations/coupler/configure",
    area: "Redes Sociales",
  },
  {
    key: "csv_finance",
    name: "Finanzas (CSV / Sheets)",
    description: "Sube extractos bancarios o conecta una hoja de cálculo.",
    authPath: "/integrations/finance",
    area: "Finanzas",
  },
];

export default async function IntegrationsPage() {
  const user = await requireUser();
  const connected = await db
    .select({ provider: schema.integrations.provider, status: schema.integrations.status })
    .from(schema.integrations)
    .where(eq(schema.integrations.userId, user.id));

  const connectedSet = new Set(connected.map((c) => c.provider));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Integraciones</h1>
      <p className="text-sm text-muted-foreground">
        Conecta tus fuentes para que el plan diario se calcule con datos reales.
      </p>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <h2 className="text-sm font-medium">Notificaciones</h2>
        <p className="text-xs text-muted-foreground">
          Recibe los 3 push diarios (06:00 plan, 13:00 ajuste, 21:00 reflexión).
        </p>
        <EnableNotificationsButton />
      </section>

      <ul className="space-y-2">
        {PROVIDERS.map((p) => (
          <li
            key={p.key}
            className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3"
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium">{p.name}</h3>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {p.area}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{p.description}</p>
            </div>
            <a
              href={p.authPath}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
                connectedSet.has(p.key)
                  ? "bg-secondary border border-border"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {connectedSet.has(p.key) ? "Configurar" : "Conectar"}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
