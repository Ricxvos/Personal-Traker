import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";

export async function GET() {
  const areas = await db.select().from(schema.lifeAreas).orderBy(schema.lifeAreas.sortOrder);
  return NextResponse.json({ areas });
}
