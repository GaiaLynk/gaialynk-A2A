#!/usr/bin/env bash
set -euo pipefail

export DATABASE_URL="${DATABASE_URL:-postgres://gaialynk:gaialynk@localhost:5432/gaialynk}"

echo "[1/6] Start local postgres service"
docker compose up -d postgres

echo "[2/6] Wait for postgres readiness"
for i in {1..20}; do
  if docker compose exec -T postgres pg_isready -U gaialynk -d gaialynk >/dev/null 2>&1; then
    echo "Postgres is ready."
    break
  fi

  if [[ "$i" -eq 20 ]]; then
    echo "Postgres did not become ready in time."
    exit 1
  fi
  sleep 1
done

echo "[3/6] Run migrations"
npm run db:migrate

echo "[4/6] Reset database"
npm run db:reset

echo "[5/6] Seed database"
npm run db:seed

echo "[6/6] Verify PostgreSQL path"
npm run verify:pg:local

echo "Local PostgreSQL bootstrap and verification completed."
