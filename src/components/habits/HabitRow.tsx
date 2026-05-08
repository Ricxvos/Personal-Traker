"use client";

import { useState, useTransition } from "react";
import { Flame } from "lucide-react";
import { toggleHabitLog } from "@/app/(app)/habits/actions";
import { cn } from "@/lib/utils";

interface HabitRowProps {
  habit: {
    id: string;
    title: string;
    area: { nameEs: string; emoji: string } | null;
    streak: number;
    todayDone: boolean;
  };
  date: string;
}

export function HabitRow({ habit, date }: HabitRowProps) {
  const [done, setDone] = useState(habit.todayDone);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !done;
    setDone(next);
    start(async () => {
      await toggleHabitLog({ habitId: habit.id, date, done: next });
    });
  }

  return (
    <li className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={pending}
        aria-pressed={done}
        className={cn(
          "h-10 w-10 rounded-full border flex items-center justify-center transition",
          done
            ? "bg-primary border-primary text-primary-foreground"
            : "bg-secondary border-border",
        )}
      >
        {done ? "✓" : ""}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{habit.title}</p>
        {habit.area && (
          <p className="text-xs text-muted-foreground">
            {habit.area.emoji} {habit.area.nameEs}
          </p>
        )}
      </div>
      <span className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
        <Flame className="h-4 w-4 text-warning" aria-hidden="true" />
        {habit.streak}
      </span>
    </li>
  );
}
