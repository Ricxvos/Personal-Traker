"use client";

import { useState, useTransition } from "react";

export function CsvUploader({
  upload,
}: {
  upload: (content: string) => Promise<{ inserted: number }>;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result);
      start(async () => {
        try {
          const { inserted } = await upload(content);
          setResult(`Importé ${inserted} registros mensuales.`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error al importar.");
        }
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-2">
      <label className="block rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground cursor-pointer">
        <input type="file" accept=".csv" className="hidden" onChange={onChange} />
        {pending ? "Importando..." : "Toca para subir CSV"}
      </label>
      {result && <p className="text-xs text-success-foreground">{result}</p>}
      {error && <p className="text-xs text-destructive-foreground">{error}</p>}
    </div>
  );
}
