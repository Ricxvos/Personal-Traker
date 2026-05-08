import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { syncStepsLastNDays } from "@/lib/integrations/google-fit";

export async function POST() {
  const user = await requireUser();
  const result = await syncStepsLastNDays(user.id, 7);
  return NextResponse.json({ ok: true, ...result });
}
