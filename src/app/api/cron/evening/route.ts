import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { listUsersForDailyJobs } from "@/lib/cron/run-for-all-users";
import { sendPushToUser } from "@/lib/push/web-push";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userIds = await listUsersForDailyJobs();
  for (const userId of userIds) {
    await sendPushToUser(userId, {
      title: "Reflexión de noche",
      body: "Toma 1 minuto y marca avancé / mantuve / retrocedí en cada área.",
      url: "/today#checkin-heading",
      tag: "evening",
    });
  }
  return NextResponse.json({ ok: true });
}
