export interface HabitLogPoint {
  date: string;
  done: boolean;
}

export function currentStreak(logs: HabitLogPoint[], today: string): number {
  const map = new Map(logs.map((l) => [l.date, l.done]));
  let streak = 0;
  const cursor = new Date(today + "T00:00:00");
  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    const done = map.get(iso);
    if (done) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (iso === today) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }
  return streak;
}

export function longestStreak(logs: HabitLogPoint[]): number {
  const sorted = [...logs].filter((l) => l.done).sort((a, b) => a.date.localeCompare(b.date));
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const l of sorted) {
    if (prev) {
      const prevD = new Date(prev + "T00:00:00");
      prevD.setDate(prevD.getDate() + 1);
      const expected = prevD.toISOString().slice(0, 10);
      run = expected === l.date ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = l.date;
  }
  return best;
}
