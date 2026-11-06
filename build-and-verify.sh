#!/usr/bin/env bash
# build-and-verify.sh — 构建并校验 msdribbon.com 新文章
set -u
cd /workspace/new-site
SLUG="custom-ribbon-yield-consumption-guide"
URL="https://msdribbon.com/blog/${SLUG}"

echo "===== 1. git 跟踪模式（新增 B2B 文章应为扁平 .html） ====="
git ls-files blog/ | grep -v '^blog/a-' | grep -v '^blog/index.html' | head -20

echo
echo "===== 2. 新文章是否已被 git 跟踪 ====="
git status --porcelain blog/ | head

echo
echo "===== 3. 启动静态服务器 ====="
pkill -f static-server.js 2>/dev/null
sleep 1
node static-server.js > /tmp/static-server.log 2>&1 &
sleep 2
curl -s -o /dev/null -w "server root: %{http_code}\n" http://127.0.0.1:8790/

echo
echo "===== 4. prerender 只跑新路由 ====="
cat > /tmp/routes-one.txt <<EOF
/blog/${SLUG}
EOF
cp _routes.txt /tmp/routes-backup.txt
cp /tmp/routes-one.txt _routes.txt
node prerender.js 2>&1 | tail -6
cp /tmp/routes-backup.txt _routes.txt

echo
echo "===== 5. 校验 prerender 产物 ====="
P="_prerendered/blog/${SLUG}/index.html"
if [ -f "$P" ]; then
  echo "产物存在: $P ($(wc -c < "$P") bytes)"
  echo "--- title ---"
  grep -o '<title>[^<]*</title>' "$P" | head -1
  echo "--- canonical ---"
  grep -o 'rel="canonical" href="[^"]*"' "$P" | head -1
  echo "--- hreflang ---"
  grep -o 'hreflang="[^"]*" href="[^"]*"' "$P" | head -3
  echo "--- JSON-LD types ---"
  grep -o '"@type": "[A-Za-z]*"' "$P" | sort -u | tr '\n' ' '; echo
  echo "--- FAQ count ---"
  grep -o '"@type": "Question"' "$P" | wc -l
  echo "--- 口径检查 ---"
  if grep -q '2004' "$P"; then echo "FAIL: 含 2004"; else echo "OK: 无 2004"; fi
  if grep -qi 'Smith *Ribbon' "$P"; then echo "FAIL: 含 Smith Ribbon"; else echo "OK: 无 Smith Ribbon"; fi
  if grep -q 'since 2007' "$P"; then echo "OK: 含 since 2007"; else echo "WARN: 未见 since 2007 字样"; fi
else
  echo "FAIL: 产物缺失 $P"
fi

echo
echo "===== 6. sitemap 校验 ====="
python3 - <<'PY'
import re
sm=open('/workspace/new-site/sitemap.xml',encoding='utf-8').read()
locs=re.findall(r'<loc>([^<]+)</loc>',sm)
dupes=[l for i,l in enumerate(locs) if l in locs[:i]]
print(f"URL 总数: {len(locs)}")
print(f"重复 URL: {len(dupes)}")
new='https://msdribbon.com/blog/custom-ribbon-yield-consumption-guide'
print(f"新文章已收录: {new in locs}")
print(f"lastmod 日期种类: {sorted(set(re.findall(r'<lastmod>([^<]+)</lastmod>',sm)))}")
PY

echo
echo "===== 7. blog 列表页新卡片 ====="
grep -c "custom-ribbon-yield-consumption-guide" blog/index.html

pkill -f static-server.js 2>/dev/null
echo "完成"
