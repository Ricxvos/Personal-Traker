import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/supabase/server";
import { buildMsAuthUrl } from "@/lib/integrations/ms-graph";

export async function GET() {
  const user = await requireUser();
  const state = `ms_graph:${user.id}:${randomBytes(8).toString("hex")}`;
  return NextResponse.redirect(buildMsAuthUrl(state));
}
