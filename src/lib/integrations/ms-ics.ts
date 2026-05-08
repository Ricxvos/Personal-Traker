import nodeIcal from "node-ical";

export interface IcsEvent {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
}

export async function fetchIcsTodayEvents(url: string): Promise<IcsEvent[]> {
  const data = await nodeIcal.async.fromURL(url);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const events: IcsEvent[] = [];
  for (const key of Object.keys(data)) {
    const item = data[key];
    if (item.type !== "VEVENT") continue;
    const start = new Date(item.start);
    const end = new Date(item.end);
    if (start >= tomorrow || end <= today) continue;
    events.push({
      uid: item.uid ?? key,
      title: item.summary ?? "(sin título)",
      start,
      end,
      isAllDay: Boolean((item as { datetype?: string }).datetype === "date"),
    });
  }
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}
