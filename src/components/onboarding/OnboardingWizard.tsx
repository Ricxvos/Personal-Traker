"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MetricSuggestion } from "@/lib/catalog/metrics-by-area";
import type { AreaSlug } from "@/lib/catalog/areas";
import { completeOnboarding } from "@/app/(app)/onboarding/actions";

interface AreaSeed {
  id: string;
  slug: AreaSlug;
  nameEs: string;
  emoji: string;
  metricSuggestions: MetricSuggestion[];
}

interface AreaState {
  areaId: string;
  goalTitle: string;
  why: string;
  targetValue: string;
  unit: string;
  selectedMetrics: string[];
  habitTitle: string;
}

const STEPS = ["focus", "details", "review"] as const;

export function OnboardingWizard({ areas }: { areas: AreaSeed[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState<(typeof STEPS)[number]>("focus");
  const [error, setError] = useState<string | null>(null);

  const [focusAreaIds, setFocusAreaIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<Record<string, AreaState>>({});
  const endDate = `${new Date().getFullYear()}-12-31`;

  const focusAreas = useMemo(
    () => areas.filter((a) => focusAreaIds.includes(a.id)),
    [areas, focusAreaIds],
  );

  function toggleFocus(areaId: string) {
    setFocusAreaIds((prev) => {
      if (prev.includes(areaId)) return prev.filter((id) => id !== areaId);
      if (prev.length >= 2) return prev;
      return [...prev, areaId];
    });
    setDraft((prev) => {
      if (prev[areaId]) return prev;
      return {
        ...prev,
        [areaId]: {
          areaId,
          goalTitle: "",
          why: "",
          targetValue: "",
          unit: "",
          selectedMetrics: [],
          habitTitle: "",
        },
      };
    });
  }

  function updateArea(areaId: string, patch: Partial<AreaState>) {
    setDraft((prev) => ({ ...prev, [areaId]: { ...prev[areaId], ...patch } }));
  }

  function toggleMetric(areaId: string, name: string) {
    setDraft((prev) => {
      const cur = prev[areaId];
      const set = new Set(cur.selectedMetrics);
      if (set.has(name)) set.delete(name);
      else if (set.size < 3) set.add(name);
      return { ...prev, [areaId]: { ...cur, selectedMetrics: Array.from(set) } };
    });
  }

  async function submit() {
    setError(null);
    const goals = focusAreas.map((a) => ({
      areaId: a.id,
      title: draft[a.id].goalTitle,
      why: draft[a.id].why || undefined,
      targetValue: draft[a.id].targetValue ? Number(draft[a.id].targetValue) : undefined,
      unit: draft[a.id].unit || undefined,
      endDate,
    }));
    const metrics = focusAreas.flatMap((a) =>
      draft[a.id].selectedMetrics.map((name) => {
        const sugg = a.metricSuggestions.find((m) => m.name === name)!;
        return {
          areaId: a.id,
          name: sugg.name,
          unit: sugg.unit,
          higherIsBetter: sugg.higherIsBetter,
          source: sugg.defaultSource,
        };
      }),
    );
    const habits = focusAreas
      .filter((a) => draft[a.id].habitTitle.trim().length > 0)
      .map((a) => ({
        areaId: a.id,
        title: draft[a.id].habitTitle.trim(),
        cadence: "daily" as const,
        targetCount: 1,
      }));

    if (goals.some((g) => !g.title.trim())) {
      setError("Cada área de foco necesita un título de meta.");
      return;
    }

    start(async () => {
      try {
        await completeOnboarding({ focusAreaIds, goals, metrics, habits });
        router.push("/today");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Onboarding</p>
        <h1 className="text-2xl font-semibold">
          {step === "focus" && "Elige 1-2 áreas de foco"}
          {step === "details" && "Define tu meta y hábito por área"}
          {step === "review" && "Revisa y confirma"}
        </h1>
      </header>

      {step === "focus" && (
        <>
          <p className="text-sm text-muted-foreground">
            9 áreas es ambicioso. Empieza fuerte con 1 o 2 este trimestre. El resto queda en
            mantenimiento (sólo check-in cualitativo).
          </p>
          <ul className="space-y-2">
            {areas.map((a) => {
              const selected = focusAreaIds.includes(a.id);
              return (
                <li key={a.id}>
                  <button
                    onClick={() => toggleFocus(a.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {a.emoji} {a.nameEs}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            disabled={focusAreaIds.length === 0}
            onClick={() => setStep("details")}
            className="w-full rounded-xl bg-primary text-primary-foreground font-medium py-3 text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </>
      )}

      {step === "details" && (
        <>
          {focusAreas.map((a) => {
            const cur = draft[a.id];
            return (
              <section key={a.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <h2 className="text-base font-medium">
                  {a.emoji} {a.nameEs}
                </h2>

                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">Meta anual</span>
                  <input
                    placeholder="Ej. Correr 800 km"
                    value={cur.goalTitle}
                    onChange={(e) => updateArea(a.id, { goalTitle: e.target.value })}
                    className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">¿Por qué te importa?</span>
                  <textarea
                    rows={2}
                    value={cur.why}
                    onChange={(e) => updateArea(a.id, { why: e.target.value })}
                    className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm resize-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs text-muted-foreground">Target</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={cur.targetValue}
                      onChange={(e) => updateArea(a.id, { targetValue: e.target.value })}
                      className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-muted-foreground">Unidad</span>
                    <input
                      placeholder="km"
                      value={cur.unit}
                      onChange={(e) => updateArea(a.id, { unit: e.target.value })}
                      className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Métricas a seguir (máx 3)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {a.metricSuggestions.map((m) => {
                      const active = cur.selectedMetrics.includes(m.name);
                      return (
                        <button
                          key={m.name}
                          type="button"
                          onClick={() => toggleMetric(a.id, m.name)}
                          className={`text-xs rounded-full px-3 py-1.5 border ${
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary border-border"
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Hábito diario (opcional)
                  </span>
                  <input
                    placeholder="Ej. Correr 30 min"
                    value={cur.habitTitle}
                    onChange={(e) => updateArea(a.id, { habitTitle: e.target.value })}
                    className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
                  />
                </label>
              </section>
            );
          })}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStep("focus")}
              className="rounded-xl bg-secondary border border-border font-medium py-3 text-sm"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep("review")}
              className="rounded-xl bg-primary text-primary-foreground font-medium py-3 text-sm"
            >
              Revisar
            </button>
          </div>
        </>
      )}

      {step === "review" && (
        <>
          <ul className="space-y-2">
            {focusAreas.map((a) => {
              const cur = draft[a.id];
              return (
                <li
                  key={a.id}
                  className="rounded-2xl border border-border bg-card p-4 space-y-1"
                >
                  <p className="text-sm font-medium">
                    {a.emoji} {a.nameEs}
                  </p>
                  <p className="text-sm">
                    Meta: <span className="font-medium">{cur.goalTitle}</span>
                  </p>
                  {cur.targetValue && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Target: {cur.targetValue} {cur.unit}
                    </p>
                  )}
                  {cur.selectedMetrics.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Métricas: {cur.selectedMetrics.join(", ")}
                    </p>
                  )}
                  {cur.habitTitle && (
                    <p className="text-xs text-muted-foreground">Hábito: {cur.habitTitle}</p>
                  )}
                </li>
              );
            })}
          </ul>

          {error && <p className="text-sm text-destructive-foreground">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStep("details")}
              className="rounded-xl bg-secondary border border-border font-medium py-3 text-sm"
            >
              Atrás
            </button>
            <button
              onClick={submit}
              disabled={pending}
              className="rounded-xl bg-primary text-primary-foreground font-medium py-3 text-sm disabled:opacity-50"
            >
              {pending ? "Guardando..." : "Terminar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
