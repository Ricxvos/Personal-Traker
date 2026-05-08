"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function EnableNotificationsButton() {
  const [status, setStatus] = useState<"idle" | "asking" | "ok" | "denied" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function enable() {
    setStatus("asking");
    setError(null);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Tu navegador no soporta Web Push.");
      }
      const reg =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error("VAPID no configurado en el servidor.");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      });
      if (!res.ok) throw new Error("No se pudo registrar la suscripción.");
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={enable}
        disabled={status === "asking"}
        className="w-full rounded-xl bg-primary text-primary-foreground font-medium py-3 text-sm disabled:opacity-50"
      >
        {status === "ok"
          ? "Notificaciones activas"
          : status === "asking"
            ? "Configurando..."
            : "Activar notificaciones"}
      </button>
      {status === "denied" && (
        <p className="text-xs text-warning-foreground bg-warning/20 rounded-lg px-3 py-2">
          Permiso denegado. Actívalo en los ajustes de Chrome.
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive-foreground bg-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
