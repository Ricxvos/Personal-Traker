import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { exchangeGoogleCode } from "@/lib/integrations/google";

export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";

  if (!code) return NextResponse.redirect(new URL("/integrations?error=missing_code", url.origin));

  const provider = state.split(":")[0] === "google_calendar" ? "google_calendar" : "google_fit";
  const tokens = await exchangeGoogleCode(code);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await db
    .insert(schema.integrations)
    .values({
      userId: user.id,
      provider,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scopes: tokens.scope,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [schema.integrations.userId, schema.integrations.provider],
      set: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        scopes: tokens.scope,
        expiresAt,
        updatedAt: new Date(),
      },
    });

  return NextResponse.redirect(new URL("/integrations?connected=" + provider, url.origin));
}
