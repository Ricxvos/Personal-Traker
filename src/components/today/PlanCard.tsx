import { cn } from "@/lib/utils";

export interface PlanCardItem {
  id: string;
  kind: "goal" | "habit";
  title: string;
  rationale?: string;
  estMinutes?: number;
  completed?: boolean;
  pacingState?: "ahead" | "on_track" | "behind" | "critically_behind";
}

const STATE_DOT: Record<NonNullable<PlanCardItem["pacingState"]>, string> = {
  ahead: "bg-success",
  on_track: "bg-primary",
  behind: "bg-warning",
  critically_behind: "bg-destructive",
};

export function PlanCard({ items }: { items: PlanCardItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-sm text-muted-foreground">
        Aún no hay plan. Configura tus metas en el onboarding.
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {items.map((item, idx) => (
        <li
          key={item.id}
          className={cn(
            "rounded-2xl border border-border bg-card p-4 flex gap-3",
            item.completed && "opacity-60",
          )}
        >
          <div className="flex flex-col items-center gap-1 pt-0.5 w-6">
            <span className="text-xs text-muted-foreground tabular-nums">{idx + 1}</span>
            {item.pacingState && (
              <span
                aria-hidden
                className={cn("h-2 w-2 rounded-full", STATE_DOT[item.pacingState])}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{item.title}</p>
            {item.rationale && (
              <p className="text-xs text-muted-foreground mt-1">{item.rationale}</p>
            )}
          </div>
          {item.kind === "habit" && (
            <span className="self-start text-[10px] uppercase tracking-wide text-muted-foreground rounded-full bg-secondary px-2 py-0.5">
              Hábito
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
