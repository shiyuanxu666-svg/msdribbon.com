#!/usr/bin/env bash
set -u
cd /workspace/new-site

# 1. static server
nohup node static-server.js > /tmp/ss.log 2>&1 &
SS_PID=$!
sleep 3
curl -s -o /dev/null -w "server root: %{http_code}\n" http://127.0.0.1:8790/

# 2. swap routes to just the new article
cp _routes.txt /tmp/routes-backup.txt
printf '/blog/custom-ribbon-supplier-quality-agreement-guide\n' > _routes.txt

# 3. prerender
node prerender.js 2>&1 | tail -6

# 4. restore routes
cp /tmp/routes-backup.txt _routes.txt
echo "routes restored: $(wc -l < _routes.txt) lines"

kill $SS_PID 2>/dev/null
echo done
