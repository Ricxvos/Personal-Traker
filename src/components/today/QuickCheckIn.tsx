"use client";

import { useState, useTransition } from "react";
import { recordCheckIn } from "@/app/(app)/today/actions";
import { cn } from "@/lib/utils";

interface AreaItem {
  id: string;
  nameEs: string;
  emoji: string;
  todayValue: "advance" | "keep" | "regress" | null;
}

export function QuickCheckIn({ areas, date }: { areas: AreaItem[]; date: string }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState(areas);

  function set(areaId: string, value: "advance" | "keep" | "regress") {
    setState((prev) =>
      prev.map((a) => (a.id === areaId ? { ...a, todayValue: value } : a)),
    );
    startTransition(async () => {
      await recordCheckIn({ areaId, date, value });
    });
  }

  return (
    <ul className="space-y-1.5">
      {state.map((a) => (
        <li
          key={a.id}
          className="rounded-xl bg-card border border-border px-3 py-2 flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-2 text-sm">
            <span aria-hidden>{a.emoji}</span>
            <span>{a.nameEs}</span>
          </span>
          <div className="flex gap-1">
            {(["regress", "keep", "advance"] as const).map((v) => (
              <button
                key={v}
                aria-pressed={a.todayValue === v}
                onClick={() => set(a.id, v)}
                disabled={pending}
                className={cn(
                  "h-8 w-8 rounded-lg text-xs font-medium border transition",
                  a.todayValue === v
                    ? v === "advance"
                      ? "bg-success text-success-foreground border-success"
                      : v === "keep"
                        ? "bg-secondary border-border"
                        : "bg-destructive text-destructive-foreground border-destructive"
                    : "border-border bg-transparent hover:bg-secondary",
                )}
              >
                {v === "advance" ? "↑" : v === "keep" ? "=" : "↓"}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
