#!/bin/sh
set -eu
cd /app
./node_modules/.bin/prisma migrate deploy
node dist/prisma/seed.js
node dist/scripts/migrate-artworks.js
node dist/scripts/migrate-battle-audio.js
exec "$@"
