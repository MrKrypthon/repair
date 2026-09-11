#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"
export DATABASE_URL="postgresql://electronica:electronica_dev@localhost:5433/electronica_tech?schema=public"
export S3_ENDPOINT="http://localhost:9000"
export S3_PUBLIC_URL="http://localhost:9000"
export S3_REGION="us-east-1"
export S3_BUCKET="electronica-tech-attachments"
export S3_ACCESS_KEY="electronica"
export S3_SECRET_KEY="electronica_dev_minio"
API_PORT="${API_PORT:-3001}"

while ss -ltn | rg -q ":${API_PORT}[[:space:]]"; do
  echo "El puerto ${API_PORT} está ocupado; usando ${API_PORT} + 1 para la API."
  API_PORT=$((API_PORT + 1))
done

export API_PORT

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "[1/4] Iniciando PostgreSQL y MinIO..."
docker compose -f "$COMPOSE_FILE" up -d postgres minio minio-init

echo "[2/4] Esperando PostgreSQL..."
until docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U electronica -d electronica_tech >/dev/null 2>&1; do
  sleep 1
done

echo "[3/4] Aplicando migraciones y levantando API en http://localhost:3001..."
(
  cd "$ROOT_DIR/backend"
  npx prisma migrate deploy
  npm run prisma:seed
  PORT="$API_PORT" npm run start:dev
) &
BACKEND_PID=$!

echo "[4/4] Levantando frontend en http://localhost:3000..."
cd "$ROOT_DIR"
VITE_API_URL="http://localhost:${API_PORT}/api" npm run start
