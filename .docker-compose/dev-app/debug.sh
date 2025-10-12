#!/bin/sh

npx npm-watch openapi:bundle &

npx prisma generate --watch &

npx tsc-watch --noClear --noColors --onSuccess "node --inspect /app/dist/index.js" &

tail -f /dev/null
