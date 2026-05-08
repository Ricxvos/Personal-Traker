import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db/client";
import { requireUser } from "@/lib/supabase/server";

const schemaIn = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(request: Request) {
  const user = await requireUser();
  const body = schemaIn.parse(await request.json());
  const ua = request.headers.get("user-agent") ?? "";
  await db
    .insert(schema.pushSubscriptions)
    .values({
      userId: user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      authKey: body.keys.auth,
      userAgent: ua,
    })
    .onConflictDoUpdate({
      target: schema.pushSubscriptions.endpoint,
      set: { userId: user.id, p256dh: body.keys.p256dh, authKey: body.keys.auth, userAgent: ua },
    });
  return NextResponse.json({ ok: true });
}
