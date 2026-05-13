#!/bin/sh
set -eu
cd /app
./node_modules/.bin/prisma migrate deploy
node dist/prisma/seed.js
exec "$@"
