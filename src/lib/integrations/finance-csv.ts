export interface FinanceRow {
  date: string;
  amount: number;
  description: string;
  type: "income" | "expense";
}

export function parseFinanceCsv(content: string): FinanceRow[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase().split(",").map((c) => c.trim());
  const dateIdx = header.findIndex((h) => /(date|fecha)/.test(h));
  const amountIdx = header.findIndex((h) => /(amount|monto|importe)/.test(h));
  const descIdx = header.findIndex((h) => /(description|descripcion|detalle|concepto)/.test(h));
  if (dateIdx < 0 || amountIdx < 0) {
    throw new Error("CSV inválido: requiere columnas 'date'/'fecha' y 'amount'/'monto'.");
  }
  const out: FinanceRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length === 0 || !cols[dateIdx]) continue;
    const rawAmount = cols[amountIdx]?.replace(/[^\d.\-]/g, "");
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount)) continue;
    out.push({
      date: cols[dateIdx],
      amount: Math.abs(amount),
      description: descIdx >= 0 ? cols[descIdx] ?? "" : "",
      type: amount < 0 ? "expense" : "income",
    });
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}
