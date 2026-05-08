const MS_AUTH = (tenant: string) =>
  `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`;
const MS_TOKEN = (tenant: string) =>
  `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

export const MS_SCOPES = [
  "offline_access",
  "openid",
  "profile",
  "email",
  "Calendars.Read",
];

export interface MsTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export function buildMsAuthUrl(state: string) {
  const tenant = process.env.MS_TENANT_ID ?? "common";
  const params = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID ?? "",
    redirect_uri: process.env.MS_REDIRECT_URI ?? "",
    response_type: "code",
    response_mode: "query",
    scope: MS_SCOPES.join(" "),
    state,
  });
  return `${MS_AUTH(tenant)}?${params.toString()}`;
}

export async function exchangeMsCode(code: string): Promise<MsTokens> {
  const tenant = process.env.MS_TENANT_ID ?? "common";
  const res = await fetch(MS_TOKEN(tenant), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.MS_CLIENT_ID ?? "",
      client_secret: process.env.MS_CLIENT_SECRET ?? "",
      redirect_uri: process.env.MS_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
      scope: MS_SCOPES.join(" "),
    }),
  });
  if (!res.ok) throw new Error(`MS token exchange falló: ${res.status}`);
  return res.json();
}

export async function fetchTodayCalendarEvents(accessToken: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  const params = new URLSearchParams({
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    "$select": "subject,start,end,bodyPreview,isAllDay",
    "$orderby": "start/dateTime",
    "$top": "50",
  });
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`MS Graph error ${res.status}`);
  return res.json() as Promise<{
    value: Array<{
      subject: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      isAllDay: boolean;
    }>;
  }>;
}
