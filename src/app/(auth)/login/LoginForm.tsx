"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const supabase = createSupabaseBrowserClient();
  const params = useSearchParams();
  const next = params.get("next") ?? "/today";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setError(error.message);
  }

  async function signInWithMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <header className="text-center space-y-1">
        <h1 className="text-2xl font-semibold">Personal Tracker</h1>
        <p className="text-sm text-muted-foreground">Tu coach diario impulsado por IA.</p>
      </header>

      <button
        onClick={signInWithGoogle}
        className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium hover:bg-accent transition"
      >
        Continuar con Google
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={signInWithMagicLink} className="space-y-3">
        <input
          type="email"
          required
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
        >
          {status === "sending" ? "Enviando..." : "Enviar enlace mágico"}
        </button>
      </form>

      {status === "sent" && (
        <p className="text-sm text-success-foreground bg-success/20 rounded-lg px-3 py-2">
          Te envié un enlace a {email}. Revísalo en el celular.
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive-foreground bg-destructive/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
