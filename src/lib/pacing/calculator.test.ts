import { describe, it, expect } from "vitest";
import {
  pacingForGoal,
  aggregatePacing,
  toneFromGlobalScore,
  type GoalForPacing,
  type PacingResult,
} from "./calculator";

function buildGoal(overrides: Partial<GoalForPacing> = {}): GoalForPacing {
  return {
    id: "g1",
    title: "Correr 800 km",
    targetValue: 800,
    currentValue: 0,
    unit: "km",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    level: "annual",
    areaId: "salud",
    ...overrides,
  };
}

describe("pacingForGoal", () => {
  it("returns null when targetValue is missing", () => {
    const goal = buildGoal({ targetValue: null });
    expect(pacingForGoal(goal, new Date("2026-05-08"))).toBeNull();
  });

  it("returns null when end is before start", () => {
    const goal = buildGoal({ startDate: "2026-12-31", endDate: "2026-01-01" });
    expect(pacingForGoal(goal, new Date("2026-05-08"))).toBeNull();
  });

  it("computes expected progress proportional to elapsed time", () => {
    const goal = buildGoal({ targetValue: 365, currentValue: 0 });
    const result = pacingForGoal(goal, new Date("2026-07-02"));
    expect(result).not.toBeNull();
    expect(result!.expectedToday).toBeGreaterThan(180);
    expect(result!.expectedToday).toBeLessThan(185);
  });

  it("flags critically_behind when far below expected", () => {
    const goal = buildGoal({ targetValue: 365, currentValue: 10 });
    const result = pacingForGoal(goal, new Date("2026-12-30"));
    expect(result!.state).toBe("critically_behind");
  });

  it("flags ahead when current exceeds expected by margin", () => {
    const goal = buildGoal({ targetValue: 100, currentValue: 60 });
    const result = pacingForGoal(goal, new Date("2026-04-01"));
    expect(result!.state).toBe("ahead");
  });

  it("computes requiredPerDay distributing remaining work over remaining days", () => {
    const goal = buildGoal({ targetValue: 800, currentValue: 200 });
    const result = pacingForGoal(goal, new Date("2026-07-01"));
    const remainingDays = result!.daysRemaining;
    expect(result!.requiredPerDay).toBeCloseTo((800 - 200) / remainingDays, 2);
  });

  it("clamps requiredPerDay to zero once target is met", () => {
    const goal = buildGoal({ targetValue: 100, currentValue: 150 });
    const result = pacingForGoal(goal, new Date("2026-06-01"));
    expect(result!.requiredPerDay).toBe(0);
  });

  it("clamps elapsed ratio to 1 after end date", () => {
    const goal = buildGoal({ targetValue: 100, currentValue: 100 });
    const result = pacingForGoal(goal, new Date("2027-06-01"));
    expect(result!.expectedToday).toBe(100);
    expect(result!.daysRemaining).toBeGreaterThanOrEqual(1);
  });
});

describe("aggregatePacing", () => {
  it("returns globalScore=1 when there are no goals", () => {
    expect(aggregatePacing([])).toEqual({ globalScore: 1, weakest: null });
  });

  it("computes average pacing and identifies the weakest goal", () => {
    const r: PacingResult[] = [
      makeResult("a", 1.2),
      makeResult("b", 0.4),
      makeResult("c", 0.9),
    ];
    const out = aggregatePacing(r);
    expect(out.globalScore).toBeCloseTo((1.2 + 0.4 + 0.9) / 3, 4);
    expect(out.weakest?.goalId).toBe("b");
  });
});

describe("toneFromGlobalScore", () => {
  it("returns warm when on or ahead of pace", () => {
    expect(toneFromGlobalScore(1.0)).toBe("warm");
    expect(toneFromGlobalScore(1.3)).toBe("warm");
  });

  it("returns neutral when slightly behind", () => {
    expect(toneFromGlobalScore(0.9)).toBe("neutral");
    expect(toneFromGlobalScore(0.7)).toBe("neutral");
  });

  it("returns demanding when notably behind", () => {
    expect(toneFromGlobalScore(0.69)).toBe("demanding");
    expect(toneFromGlobalScore(0)).toBe("demanding");
  });
});

function makeResult(id: string, score: number): PacingResult {
  return {
    goalId: id,
    pacingScore: score,
    state: "on_track",
    requiredPerDay: 0,
    daysRemaining: 30,
    expectedToday: 0,
    delta: 0,
  };
}
