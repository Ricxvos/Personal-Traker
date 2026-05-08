"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createHabit } from "../actions";

interface AreaOption {
  id: string;
  nameEs: string;
  emoji: string;
}

export default function NewHabitPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    areaId: string;
    title: string;
    cadence: "daily" | "weekly" | "n_per_week";
    targetCount: number;
  }>({
    areaId: "",
    title: "",
    cadence: "daily",
    targetCount: 1,
  });

  useEffect(() => {
    fetch("/api/areas")
      .then((r) => r.json())
      .then((data) => {
        setAreas(data.areas);
        if (data.areas[0]) setForm((f) => ({ ...f, areaId: data.areas[0].id }));
      });
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await createHabit({
          areaId: form.areaId,
          title: form.title,
          cadence: form.cadence,
          targetCount: form.targetCount,
        });
        router.push("/habits");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo hábito</h1>

      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">Área</span>
        <select
          value={form.areaId}
          onChange={(e) => setForm({ ...form, areaId: e.target.value })}
          className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
          required
        >
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.emoji} {a.nameEs}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">Hábito</span>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ej. Meditar 10 minutos"
          className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">Frecuencia</span>
        <select
          value={form.cadence}
          onChange={(e) => setForm({ ...form, cadence: e.target.value as typeof form.cadence })}
          className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
        >
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
          <option value="n_per_week">N veces por semana</option>
        </select>
      </label>

      {form.cadence === "n_per_week" && (
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Veces por semana</span>
          <input
            type="number"
            min={1}
            max={7}
            value={form.targetCount}
            onChange={(e) => setForm({ ...form, targetCount: Number(e.target.value) })}
            className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
          />
        </label>
      )}

      {error && <p className="text-sm text-destructive-foreground">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary text-primary-foreground font-medium py-3 text-sm disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar hábito"}
      </button>
    </form>
  );
}
