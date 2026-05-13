#!/bin/sh
set -eu
cd /app
if [ "${RESET_DB:-}" = "1" ]; then
  echo "RESET_DB=1: dropping and recreating schema, then re-seeding."
  ./node_modules/.bin/prisma migrate reset --force --skip-seed
  node dist/prisma/seed.js
else
  if [ "${SKIP_PRISMA_MIGRATE:-}" != "1" ]; then
    ./node_modules/.bin/prisma migrate deploy
  fi
  if [ "${SKIP_PRISMA_SEED:-}" != "1" ]; then
    node dist/prisma/seed.js
  fi
fi
exec "$@"
