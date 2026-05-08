# Personal Tracker

[![CI](https://github.com/Ricxvos/Personal-Traker/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Ricxvos/Personal-Traker/actions/workflows/ci.yml)

Dashboard personal mobile-first que convierte metas anuales en una decisión clara cada día. Construido como PWA para Android (objetivo: Samsung Galaxy S24 Ultra) con plan diario híbrido (reglas deterministas + Claude Sonnet 4.6).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind + shadcn-style UI
- **Supabase** (Auth + Postgres) con **Drizzle ORM**
- **Anthropic Claude Sonnet 4.6** con prompt caching para el plan diario
- **Web Push** (VAPID) para notificaciones nativas en Chrome Android
- **Coupler.io** como hub de datos para redes sociales
- **Microsoft Graph** para Outlook (con fallback a feed ICS)
- **Google Fit / Health Connect** para datos del Galaxy Watch

## Áreas (9)

Salud · Trabajo · Emprendimiento/Proyectos · Redes Sociales · Relaciones · Finanzas · Estudio · Espiritual · Lectura.

## Demo local (sin cuentas externas)

Levanta Postgres en docker, aplica migraciones, siembra un usuario demo con 3 metas, 2 hábitos (con streak de 5 días), métricas y check-ins de 14 días. No requiere Supabase, Anthropic, Google ni Microsoft.

```bash
npm install
npm run demo:setup    # docker up + migrate + seed-demo
npm run demo          # http://localhost:3000 ya autenticado
npm run demo:down     # apagar Postgres del docker
```

En modo demo:

- `DEMO_MODE=true` desactiva Supabase Auth y devuelve un usuario fijo (`Demo Ricxvos`).
- El plan diario se genera **solo con reglas deterministas** (sin llamar a Claude).
- Se omite el envío de Web Push real.

## Setup local con servicios reales

```bash
npm install
cp .env.example .env.local   # llena las claves
npx drizzle-kit generate     # genera migraciones desde el schema
npm run db:migrate            # aplica migraciones a Postgres
npm run db:seed               # siembra las 9 áreas
npm run dev                   # http://localhost:3000
```

Generar par de claves VAPID:

```bash
npx web-push generate-vapid-keys
```

## Estructura

```
src/
├── app/                      # Next App Router
│   ├── (auth)/login          # login con Google + magic link
│   ├── (app)/today           # vista principal
│   ├── (app)/goals           # árbol de metas
│   ├── (app)/habits          # hábitos + streaks
│   ├── (app)/progress        # gráficas y heatmap de check-ins
│   ├── (app)/integrations    # Google Fit, MS Graph, ICS, Coupler, CSV
│   ├── (app)/onboarding      # wizard guiado
│   ├── api/plan/today        # generador IA + reglas
│   ├── api/cron/{morning,midday,evening}  # 3 push diarios
│   └── api/integrations/*    # OAuth callbacks + sync endpoints
├── components/               # UI reutilizable
└── lib/
    ├── ai/                   # cliente Claude + prompts + caching
    ├── pacing/               # algoritmo determinista + scope advisor
    ├── habits/streak.ts      # cálculo de streaks
    ├── plan/                 # rule-based-plan + generate (IA)
    ├── catalog/              # áreas + métricas sugeridas por área
    ├── integrations/         # google-fit, ms-graph, ms-ics, coupler, csv
    ├── push/                 # web-push wrapper
    ├── cron/                 # auth + helpers para crons
    ├── db/                   # schema, client, seed, migrate
    ├── i18n/es.ts            # textos en español
    └── supabase/             # cliente browser + server
```

## Crons (Vercel)

- `06:00 MX` (12:00 UTC) — `/api/cron/morning`: genera plan + push #1
- `13:00 MX` (19:00 UTC) — `/api/cron/midday`: re-prioriza + push #2
- `21:00 MX` (03:00 UTC siguiente) — `/api/cron/evening`: pide reflexión + push #3

## Verificación

```bash
npm run lint        # ESLint flat config (eslint-config-next)
npm run typecheck   # tsc --noEmit
npm test            # vitest run (pacing + scope-advisor)
npm run build       # next build
```

CI corre los cuatro pasos en cada PR hacia `main`.

## Costos estimados

Free tier todo en lo posible (~$0–10/mes con prompt caching agresivo y `MAX_AI_CALLS_PER_DAY` capado).
