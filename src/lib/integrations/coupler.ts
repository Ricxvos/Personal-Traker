export interface CouplerDataflow {
  id: string;
  name: string;
  source: string;
  destination: string;
}

const DEFAULT_BASE = process.env.COUPLER_MCP_URL;

function authHeaders() {
  const token = process.env.COUPLER_MCP_TOKEN;
  if (!token) throw new Error("COUPLER_MCP_TOKEN no configurado");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function listDataflows(): Promise<CouplerDataflow[]> {
  if (!DEFAULT_BASE) return [];
  const res = await fetch(`${DEFAULT_BASE}/dataflows`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Coupler list error ${res.status}`);
  const data = (await res.json()) as { items?: CouplerDataflow[] };
  return data.items ?? [];
}

export async function runDataflow(id: string) {
  if (!DEFAULT_BASE) throw new Error("Coupler no configurado");
  const res = await fetch(`${DEFAULT_BASE}/dataflows/${id}/run`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Coupler run error ${res.status}`);
  return res.json();
}

export async function getDataflowData<T = Record<string, unknown>>(
  id: string,
  sql: string,
): Promise<T[]> {
  if (!DEFAULT_BASE) return [];
  const res = await fetch(`${DEFAULT_BASE}/dataflows/${id}/query`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) throw new Error(`Coupler query error ${res.status}`);
  const data = (await res.json()) as { rows?: T[] };
  return data.rows ?? [];
}
