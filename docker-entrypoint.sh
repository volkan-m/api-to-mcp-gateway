#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] Starting server..."
exec node server.js
