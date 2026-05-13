#!/bin/sh
set -eu
cd /app
if [ "${SKIP_PRISMA_MIGRATE:-}" != "1" ]; then
  ./node_modules/.bin/prisma migrate deploy
fi
if [ "${SKIP_PRISMA_SEED:-}" != "1" ]; then
  node dist/prisma/seed.js
fi
exec "$@"
