import { describe, it, expect } from "vitest";
import { currentStreak, longestStreak } from "./streak";

function logs(...entries: [string, boolean][]) {
  return entries.map(([date, done]) => ({ date, done }));
}

describe("currentStreak", () => {
  it("returns 0 with no logs", () => {
    expect(currentStreak([], "2026-05-08")).toBe(0);
  });

  it("counts consecutive completed days backwards from today", () => {
    const data = logs(
      ["2026-05-08", true],
      ["2026-05-07", true],
      ["2026-05-06", true],
      ["2026-05-05", true],
      ["2026-05-04", true],
    );
    expect(currentStreak(data, "2026-05-08")).toBe(5);
  });

  it("does not break the streak if today has no log yet", () => {
    const data = logs(
      ["2026-05-07", true],
      ["2026-05-06", true],
      ["2026-05-05", true],
    );
    expect(currentStreak(data, "2026-05-08")).toBe(3);
  });

  it("breaks the streak on a missed past day", () => {
    const data = logs(
      ["2026-05-08", true],
      ["2026-05-07", true],
      ["2026-05-06", false],
      ["2026-05-05", true],
    );
    expect(currentStreak(data, "2026-05-08")).toBe(2);
  });

  it("returns 0 when today and yesterday were both missed", () => {
    const data = logs(
      ["2026-05-07", false],
      ["2026-05-06", true],
      ["2026-05-05", true],
    );
    expect(currentStreak(data, "2026-05-08")).toBe(0);
  });
});

describe("longestStreak", () => {
  it("returns 0 with no completed logs", () => {
    expect(longestStreak([])).toBe(0);
    expect(longestStreak(logs(["2026-05-01", false], ["2026-05-02", false]))).toBe(0);
  });

  it("returns the longest run of consecutive completed days", () => {
    const data = logs(
      ["2026-05-01", true],
      ["2026-05-02", true],
      ["2026-05-03", false],
      ["2026-05-04", true],
      ["2026-05-05", true],
      ["2026-05-06", true],
      ["2026-05-07", true],
      ["2026-05-08", false],
      ["2026-05-09", true],
    );
    expect(longestStreak(data)).toBe(4);
  });

  it("ignores incomplete entries when measuring runs", () => {
    const data = logs(
      ["2026-05-01", true],
      ["2026-05-02", false],
      ["2026-05-03", true],
      ["2026-05-04", true],
    );
    expect(longestStreak(data)).toBe(2);
  });
});
