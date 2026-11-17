#!/usr/bin/env bash
# build-and-verify-labeling.sh — 为 labelling 文章执行 prerender + 校验
set -u
cd /workspace/new-site
SLUG="custom-ribbon-labelling-compliance-requirements-guide"

echo "===== 1. 静态服务器 ====="
pkill -f static-server.js 2>/dev/null
sleep 1
node static-server.js > /tmp/static-server.log 2>&1 &
sleep 2
curl -s -o /dev/null -w "server root: %{http_code}\n" http://127.0.0.1:8790/

echo
echo "===== 2. prerender 新路由 ====="
cp _routes.txt /tmp/routes-backup.txt
printf '/blog/%s\n' "$SLUG" > _routes.txt
node prerender.js 2>&1 | tail -6
cp /tmp/routes-backup.txt _routes.txt
echo "routes restored: $(wc -l < _routes.txt) lines"

echo
echo "===== 3. 校验 prerender 产物 ====="
P="_prerendered/blog/${SLUG}/index.html"
if [ -f "$P" ]; then
  echo "产物存在: $P ($(wc -c < "$P") bytes)"
  echo "--- title ---"; grep -o '<title>[^<]*</title>' "$P" | head -1
  echo "--- canonical ---"; grep -o 'rel="canonical" href="[^"]*"' "$P" | head -1
  echo "--- hreflang ---"; grep -o 'hreflang="[^"]*" href="[^"]*"' "$P" | head -3
  echo "--- desc ---"; grep -o '<meta name="description" content="[^"]*"' "$P" | head -1
  echo "--- JSON-LD types ---"; grep -o '"@type": "[A-Za-z]*"' "$P" | sort -u | tr '\n' ' '; echo
  echo "--- FAQ count ---"; grep -o '"@type": "Question"' "$P" | wc -l
  echo "--- FAQ 板块 ---"; grep -c 'class="faq-item"' "$P"
  echo "--- OG/Twitter ---"; grep -o 'property="og:[a-z_]*"' "$P" | sort -u | tr '\n' ' '; echo
  echo "--- 口径检查 ---"
  if grep -q '2004' "$P"; then echo "FAIL: 含 2004"; else echo "OK: 无 2004"; fi
  if grep -qi 'Smith *Ribbon' "$P"; then echo "FAIL: 含 Smith Ribbon"; else echo "OK: 无 Smith Ribbon"; fi
  if grep -q 'since 2007' "$P"; then echo "OK: 含 since 2007"; else echo "WARN: 未见 since 2007"; fi
  echo "--- h1 ---"; grep -o '<h1>[^<]*</h1>' "$P" | head -1
else
  echo "FAIL: 产物缺失 $P"
fi

pkill -f static-server.js 2>/dev/null
echo "完成"
