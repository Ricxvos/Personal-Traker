import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";
import { exchangeMsCode } from "@/lib/integrations/ms-graph";

export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/integrations?error=missing_code", url.origin));

  const tokens = await exchangeMsCode(code);
  await db
    .insert(schema.integrations)
    .values({
      userId: user.id,
      provider: "ms_graph",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scopes: tokens.scope,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    })
    .onConflictDoUpdate({
      target: [schema.integrations.userId, schema.integrations.provider],
      set: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        scopes: tokens.scope,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        updatedAt: new Date(),
      },
    });

  return NextResponse.redirect(new URL("/integrations?connected=ms_graph", url.origin));
}
