#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "[setup-demo] copiando .env.demo -> .env.local"
  cp .env.demo .env.local
fi

echo "[setup-demo] arrancando Postgres..."
docker compose up -d postgres

echo "[setup-demo] esperando que Postgres esté listo..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U postgres -d personal_tracker >/dev/null 2>&1; then
    echo "[setup-demo] Postgres listo."
    break
  fi
  sleep 1
done

echo "[setup-demo] generando migraciones..."
npx --no drizzle-kit generate || true

echo "[setup-demo] aplicando migraciones..."
DEMO_MODE=true npm run db:migrate

echo "[setup-demo] sembrando datos de demo..."
DEMO_MODE=true npx --no tsx src/lib/db/seed-demo.ts

cat <<'MSG'

================================================================
  Demo lista. Para ver la app:

    npm run demo

  Abre http://localhost:3000 — sin login, ya estarás autenticado
  como Demo User con metas, hábitos y métricas pre-cargados.
================================================================
MSG
