import { describe, it, expect } from "vitest";
import { buildRuleBasedPlan } from "./rule-based-plan";
import type { GoalForPacing } from "@/lib/pacing/calculator";

function goal(overrides: Partial<GoalForPacing> = {}): GoalForPacing {
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

describe("buildRuleBasedPlan", () => {
  it("returns an empty array when there are no goals or habits", () => {
    const plan = buildRuleBasedPlan({
      goals: [],
      habits: [],
      calendarBusyMinutes: 0,
      today: new Date("2026-05-08"),
    });
    expect(plan).toEqual([]);
  });

  it("skips goals without targetValue (pacing returns null)", () => {
    const plan = buildRuleBasedPlan({
      goals: [goal({ targetValue: null })],
      habits: [],
      calendarBusyMinutes: 0,
      today: new Date("2026-05-08"),
    });
    expect(plan).toEqual([]);
  });

  it("ranks more-behind goals higher (greater urgency = greater priority)", () => {
    const plan = buildRuleBasedPlan({
      goals: [
        goal({ id: "ahead", targetValue: 100, currentValue: 60, areaId: "a" }),
        goal({ id: "behind", targetValue: 100, currentValue: 5, areaId: "b" }),
      ],
      habits: [],
      calendarBusyMinutes: 0,
      today: new Date("2026-04-01"),
    });
    const ids = plan.filter((p) => p.kind === "goal").map((p) => p.refId);
    expect(ids[0]).toBe("behind");
    expect(ids[1]).toBe("ahead");
  });

  it("applies a calendar penalty when the day is busy (>360 min)", () => {
    const base = {
      goals: [goal({ id: "g", targetValue: 100, currentValue: 5 })],
      habits: [],
      today: new Date("2026-04-01"),
    };
    const free = buildRuleBasedPlan({ ...base, calendarBusyMinutes: 60 });
    const busy = buildRuleBasedPlan({ ...base, calendarBusyMinutes: 480 });
    const freePriority = free.find((p) => p.kind === "goal")!.priority;
    const busyPriority = busy.find((p) => p.kind === "goal")!.priority;
    expect(busyPriority).toBeLessThan(freePriority);
    expect(freePriority - busyPriority).toBeCloseTo(0.2, 5);
  });

  it("caps goals at 5 even when more are provided", () => {
    const goals = Array.from({ length: 8 }, (_, i) =>
      goal({ id: `g${i}`, targetValue: 100, currentValue: i * 5, areaId: `a${i}` }),
    );
    const plan = buildRuleBasedPlan({
      goals,
      habits: [],
      calendarBusyMinutes: 0,
      today: new Date("2026-04-01"),
    });
    expect(plan.filter((p) => p.kind === "goal")).toHaveLength(5);
  });

  it("appends habits after goals with descending priority", () => {
    const plan = buildRuleBasedPlan({
      goals: [goal({ targetValue: 100, currentValue: 5 })],
      habits: [
        { id: "h1", title: "Meditar", areaId: "espiritual" },
        { id: "h2", title: "Leer", areaId: "lectura" },
        { id: "h3", title: "Caminar", areaId: "salud" },
      ],
      calendarBusyMinutes: 0,
      today: new Date("2026-04-01"),
    });
    const habits = plan.filter((p) => p.kind === "habit");
    expect(habits.map((h) => h.refId)).toEqual(["h1", "h2", "h3"]);
    expect(habits[0].priority).toBeGreaterThan(habits[1].priority);
    expect(habits[1].priority).toBeGreaterThan(habits[2].priority);
  });

  it("uses pacing state to drive the rationale text", () => {
    const plan = buildRuleBasedPlan({
      goals: [goal({ targetValue: 100, currentValue: 1 })],
      habits: [],
      calendarBusyMinutes: 0,
      today: new Date("2026-12-30"),
    });
    expect(plan[0].rationale).toMatch(/atrasado/i);
  });
});
