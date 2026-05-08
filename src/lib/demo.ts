import type { User } from "@supabase/supabase-js";

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_USER_EMAIL = "demo@personal-tracker.local";

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function demoUser(): User {
  return {
    id: DEMO_USER_ID,
    email: DEMO_USER_EMAIL,
    app_metadata: { provider: "demo", providers: ["demo"] },
    user_metadata: { full_name: "Demo Ricxvos" },
    aud: "authenticated",
    role: "authenticated",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    confirmed_at: "2026-01-01T00:00:00Z",
    email_confirmed_at: "2026-01-01T00:00:00Z",
    last_sign_in_at: "2026-01-01T00:00:00Z",
    phone: "",
    factors: undefined,
    identities: [],
    is_anonymous: false,
  };
}
