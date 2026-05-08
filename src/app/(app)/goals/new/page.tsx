"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGoal } from "../actions";

interface AreaOption {
  id: string;
  nameEs: string;
  emoji: string;
}

export default function NewGoalPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    areaId: "",
    level: "annual" as const,
    title: "",
    why: "",
    targetValue: "",
    unit: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: `${new Date().getFullYear()}-12-31`,
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
        await createGoal({
          areaId: form.areaId,
          level: form.level,
          title: form.title,
          why: form.why || undefined,
          targetValue: form.targetValue ? Number(form.targetValue) : undefined,
          unit: form.unit || undefined,
          startDate: form.startDate,
          endDate: form.endDate,
        });
        router.push("/goals");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold">Nueva meta</h1>

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
        <span className="text-xs text-muted-foreground">Nivel</span>
        <select
          value={form.level}
          onChange={(e) => setForm({ ...form, level: e.target.value as typeof form.level })}
          className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
        >
          <option value="annual">Anual</option>
          <option value="quarter">Trimestre</option>
          <option value="week">Semana</option>
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">Título</span>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ej. Correr 800 km en 2026"
          className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">¿Por qué te importa?</span>
        <textarea
          value={form.why}
          onChange={(e) => setForm({ ...form, why: e.target.value })}
          rows={2}
          className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm resize-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Target</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.targetValue}
            onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
            className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Unidad</span>
          <input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="km / hrs / libros"
            className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Inicio</span>
          <input
            type="date"
            required
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Fin</span>
          <input
            type="date"
            required
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      {error && <p className="text-sm text-destructive-foreground">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary text-primary-foreground font-medium py-3 text-sm disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar meta"}
      </button>
    </form>
  );
}
