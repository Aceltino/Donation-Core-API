#!/bin/sh
set -e

echo "Running database migrations..."
cd apps/donation-core
pnpm exec prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "Running database seed..."
  pnpm exec prisma db seed
fi

echo "Starting application..."
exec node /app/apps/donation-core/dist/main.js