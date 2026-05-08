import { describe, it, expect } from "vitest";
import { suggestScopeChange } from "./scope-advisor";
import type { PacingResult } from "./calculator";

function pacing(overrides: Partial<PacingResult> = {}): PacingResult {
  return {
    goalId: "g1",
    pacingScore: 0.2,
    state: "critically_behind",
    requiredPerDay: 5,
    daysRemaining: 100,
    expectedToday: 200,
    delta: -150,
    ...overrides,
  };
}

describe("suggestScopeChange", () => {
  it("returns null before the 14-day critically-behind threshold", () => {
    const out = suggestScopeChange({
      pacing: pacing(),
      goal: { id: "g1", targetValue: 800, endDate: "2026-12-31", currentValue: 50 },
      daysCriticallyBehind: 10,
    });
    expect(out).toBeNull();
  });

  it("returns null when state is not critically_behind", () => {
    const out = suggestScopeChange({
      pacing: pacing({ state: "behind", pacingScore: 0.7 }),
      goal: { id: "g1", targetValue: 800, endDate: "2026-12-31", currentValue: 50 },
      daysCriticallyBehind: 30,
    });
    expect(out).toBeNull();
  });

  it("returns null when goal has no target", () => {
    const out = suggestScopeChange({
      pacing: pacing(),
      goal: { id: "g1", targetValue: null, endDate: "2026-12-31", currentValue: 0 },
      daysCriticallyBehind: 30,
    });
    expect(out).toBeNull();
  });

  it("proposes archive when pacingScore is collapsing", () => {
    const out = suggestScopeChange({
      pacing: pacing({ pacingScore: 0.1 }),
      goal: { id: "g1", targetValue: 800, endDate: "2026-12-31", currentValue: 50 },
      daysCriticallyBehind: 20,
    });
    expect(out?.kind).toBe("archive");
    expect(out?.reason).toMatch(/20 d/);
  });

  it("proposes reduce with a pro-rated target when partially behind", () => {
    const out = suggestScopeChange({
      pacing: pacing({ pacingScore: 0.4 }),
      goal: { id: "g1", targetValue: 800, endDate: "2026-12-31", currentValue: 200 },
      daysCriticallyBehind: 20,
    });
    expect(out?.kind).toBe("reduce");
    expect(out?.suggested.targetValue).toBe(Math.round(800 * 0.4));
  });

  it("uses 0.4 floor when pacingScore is between 0.25 and 0.4", () => {
    const out = suggestScopeChange({
      pacing: pacing({ pacingScore: 0.3 }),
      goal: { id: "g1", targetValue: 800, endDate: "2026-12-31", currentValue: 100 },
      daysCriticallyBehind: 30,
    });
    expect(out?.kind).toBe("reduce");
    expect(out?.suggested.targetValue).toBe(Math.round(800 * 0.4));
  });
});
