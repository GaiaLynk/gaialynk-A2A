#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required."
  echo "Example:"
  echo "  export DATABASE_URL=postgres://gaialynk:gaialynk@localhost:5432/gaialynk"
  exit 1
fi

echo "[1/3] Run migrations"
npm run db:migrate

echo "[2/3] Run PostgreSQL integration test"
npm run test:pg

echo "[3/3] Local PostgreSQL verification passed"
