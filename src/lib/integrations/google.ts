const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export const GOOGLE_FIT_SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.sleep.read",
];

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function buildGoogleAuthUrl(opts: { provider: "google_fit" | "google_calendar"; state: string }) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: opts.state,
    scope: (opts.provider === "google_fit" ? GOOGLE_FIT_SCOPES : GOOGLE_CALENDAR_SCOPES).join(" "),
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange falló: ${res.status}`);
  return res.json();
}

export async function refreshGoogleToken(refresh_token: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google refresh falló: ${res.status}`);
  return res.json();
}
