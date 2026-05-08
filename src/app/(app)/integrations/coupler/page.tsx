import { listDataflows } from "@/lib/integrations/coupler";

export default async function CouplerPage() {
  let dataflows: Awaited<ReturnType<typeof listDataflows>> = [];
  let error: string | null = null;
  try {
    dataflows = await listDataflows();
  } catch (err) {
    error = err instanceof Error ? err.message : "Error";
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Coupler.io</h1>
        <p className="text-sm text-muted-foreground">
          Dataflows configurados que alimentan tus métricas de redes sociales.
        </p>
      </header>

      {error && (
        <p className="text-xs text-warning-foreground bg-warning/20 rounded-lg px-3 py-2">
          {error} · Verifica COUPLER_MCP_URL y COUPLER_MCP_TOKEN.
        </p>
      )}

      {dataflows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay dataflows. Configura uno en el panel de Coupler.io para arrancar.
        </p>
      ) : (
        <ul className="space-y-2">
          {dataflows.map((d) => (
            <li
              key={d.id}
              className="rounded-2xl border border-border bg-card p-4 text-sm"
            >
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-muted-foreground">
                {d.source} → {d.destination}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
