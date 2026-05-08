import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron/auth";
import { listUsersForDailyJobs, getPlanForToday } from "@/lib/cron/run-for-all-users";
import { sendPushToUser } from "@/lib/push/web-push";
import { todayISO } from "@/lib/utils";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const date = todayISO();
  const userIds = await listUsersForDailyJobs();

  for (const userId of userIds) {
    const plan = await getPlanForToday(userId, date);
    if (!plan) continue;
    const summary = plan.aiSummary ?? "Repasa tus prioridades y reordena lo que falta.";
    await sendPushToUser(userId, {
      title: "Reajuste de mediodía",
      body: summary.slice(0, 240),
      url: "/today",
      tag: "midday",
    });
  }

  return NextResponse.json({ ok: true });
}
