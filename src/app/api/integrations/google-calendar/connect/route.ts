import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/supabase/server";
import { buildGoogleAuthUrl } from "@/lib/integrations/google";

export async function GET() {
  const user = await requireUser();
  const state = `google_calendar:${user.id}:${randomBytes(8).toString("hex")}`;
  const url = buildGoogleAuthUrl({ provider: "google_calendar", state });
  return NextResponse.redirect(url);
}
