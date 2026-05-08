import { cn } from "@/lib/utils";

interface Entry {
  date: string;
  value: string;
}

const COLOR: Record<string, string> = {
  advance: "bg-success",
  keep: "bg-secondary",
  regress: "bg-destructive",
};

export function CheckinHeatmap({ entries, days = 60 }: { entries: Entry[]; days?: number }) {
  const map = new Map(entries.map((e) => [e.date, e.value]));
  const today = new Date();
  const cells: { date: string; value?: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ date: iso, value: map.get(iso) });
  }

  return (
    <div className="grid grid-cols-[repeat(15,_minmax(0,_1fr))] gap-1">
      {cells.map((c) => (
        <div
          key={c.date}
          title={`${c.date}: ${c.value ?? "sin dato"}`}
          className={cn(
            "aspect-square rounded-sm",
            c.value ? COLOR[c.value] : "bg-muted/40",
          )}
        />
      ))}
    </div>
  );
}
