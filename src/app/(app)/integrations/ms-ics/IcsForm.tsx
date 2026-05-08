"use client";

import { useState, useTransition } from "react";

export function IcsForm({
  initialUrl,
  save,
}: {
  initialUrl: string;
  save: (input: { url: string }) => Promise<void>;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setDone(false);
    start(async () => {
      await save({ url });
      setDone(true);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="url"
        required
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://outlook.office365.com/owa/calendar/.../calendar.ics"
        className="w-full rounded-xl bg-secondary border border-border px-3 py-2.5 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary text-primary-foreground font-medium py-3 text-sm disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar URL"}
      </button>
      {done && <p className="text-xs text-success-foreground">Guardado.</p>}
    </form>
  );
}
