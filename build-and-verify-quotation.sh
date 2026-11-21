#!/usr/bin/env bash
# build-and-verify-quotation.sh — 为 quotation 比较文章执行 sitemap/index 更新 + prerender + 校验
set -u
cd /workspace/new-site
SLUG="custom-ribbon-quotation-comparison-evaluation-guide"
URL="https://msdribbon.com/blog/${SLUG}"

echo "===== 0. 生成文章 HTML ====="
node build-article-quotation.js

echo
echo "===== 1. 更新 sitemap.xml ====="
python3 - <<'PY'
import re
P='/workspace/new-site/sitemap.xml'
s=open(P,encoding='utf-8').read()
LOC='https://msdribbon.com/blog/custom-ribbon-quotation-comparison-evaluation-guide'
locs=re.findall(r'<loc>([^<]+)</loc>',s)
dupes=[l for i,l in enumerate(locs) if l in locs[:i]]
print('before total',len(locs),'dupes',len(dupes))
assert not dupes, dupes
if LOC in s:
    print('already present, skip insert')
else:
    entry=f'''    <url>
        <loc>{LOC}</loc>
        <lastmod>2026-11-21</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
'''
    i=s.rindex('</urlset>')
    s=s[:i]+entry+s[i:]
    open(P,'w',encoding='utf-8').write(s)
    print('inserted',LOC)
s2=open(P,encoding='utf-8').read()
l2=re.findall(r'<loc>([^<]+)</loc>',s2)
d2=[l for i,l in enumerate(l2) if l in l2[:i]]
print('after total',len(l2),'dupes',len(d2),'new present',LOC in l2)
print('lastmod set',sorted(set(re.findall(r'<lastmod>([^<]+)</lastmod>',s2))))
PY

echo
echo "===== 2. blog 列表页插入卡片 ====="
python3 - <<'PY'
import re
P='/workspace/new-site/blog/index.html'
SLUG='custom-ribbon-quotation-comparison-evaluation-guide'
h=open(P,encoding='utf-8').read()
if SLUG in h:
    print('card already present, skip')
else:
    anchor='<article class="news-card" data-component="article-card">\n        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon design and decoration options guide for OEM buyers"'
    assert anchor in h, 'ANCHOR NOT FOUND'
    card=f'''<article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon quotation comparison and supplier evaluation guide for OEM buyers" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">30 min read</p>
          <h3 class="news-card__title">How to Compare Ribbon Supplier Quotations: A Buyer Evaluation Guide</h3>
          <p class="t-body-sm muted-text">Custom ribbon quotation comparison guide for OEM buyers: normalising supplier quotes, hidden setup costs, tier tables, landed cost, scoring and award terms.</p>
          <a class="inline-link news-card__link" href="/blog/{SLUG}">Read more<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>
        </div>
      </article>
'''
    h=h.replace(anchor,card+anchor,1)
    m=re.search(r'<p class="result-count" aria-live="polite">(\d+) items</p>',h)
    if m:
        h=h.replace(m.group(0),f'<p class="result-count" aria-live="polite">{int(m.group(1))+1} items</p>',1)
        print('result-count ->',int(m.group(1))+1)
    open(P,'w',encoding='utf-8').write(h)
    print('inserted card')
PY

echo
echo "===== 3. 静态服务器 ====="
pkill -f static-server.js 2>/dev/null
sleep 1
node static-server.js > /tmp/static-server.log 2>&1 &
sleep 2
curl -s -o /dev/null -w "server root: %{http_code}\n" http://127.0.0.1:8790/

echo
echo "===== 4. prerender 新路由 ====="
cp _routes.txt /tmp/routes-backup.txt
printf '/blog/%s\n' "$SLUG" > _routes.txt
node prerender.js 2>&1 | tail -5
cp /tmp/routes-backup.txt _routes.txt
echo "routes restored: $(wc -l < _routes.txt) lines"

echo
echo "===== 5. 校验 prerender 产物 ====="
P="_prerendered/blog/${SLUG}/index.html"
if [ -f "$P" ]; then
  echo "产物存在: $P ($(wc -c < "$P") bytes)"
  echo "--- title ---"; grep -o '<title>[^<]*</title>' "$P" | head -1
  echo "--- desc ---"; grep -o '<meta name="description" content="[^"]*"' "$P" | head -1
  echo "--- canonical ---"; grep -o 'rel="canonical" href="[^"]*"' "$P" | head -1
  echo "--- hreflang ---"; grep -o 'hreflang="[^"]*" href="[^"]*"' "$P" | head -3
  echo "--- JSON-LD types ---"; grep -o '"@type": "[A-Za-z]*"' "$P" | sort -u | tr '\n' ' '; echo
  echo "--- FAQ count(JSON-LD) ---"; grep -o '"@type": "Question"' "$P" | wc -l
  echo "--- FAQ section ---"; grep -c 'class="faq-item"' "$P"
  echo "--- h1 ---"; grep -o '<h1>[^<]*</h1>' "$P" | head -1
  echo "--- OG tags ---"; grep -o 'property="og:[a-z_]*"' "$P" | sort -u | tr '\n' ' '; echo
  echo "--- Twitter ---"; grep -o 'name="twitter:[a-z_]*"' "$P" | sort -u | tr '\n' ' '; echo
  echo "--- 口径检查 ---"
  if grep -q '2004' "$P"; then echo "FAIL: 含 2004"; else echo "OK: 无 2004"; fi
  if grep -qi 'Smith *Ribbon' "$P"; then echo "FAIL: 含 Smith Ribbon"; else echo "OK: 无 Smith Ribbon"; fi
  echo "--- 正文词数 ---"
  python3 -c "
import re
h=open('$P',encoding='utf-8').read()
b=re.sub(r'<script.*?</script>','',h,flags=re.S)
t=re.sub(r'<[^>]+>',' ',b)
w=[x for x in t.split() if re.search(r'[A-Za-z0-9]',x)]
print('words:',len(w))
d=re.search(r'<meta name=\"description\" content=\"([^\"]*)\"',h)
print('desc len:',len(d.group(1)) if d else 'N/A')
"
else
  echo "FAIL: 产物缺失 $P"
fi

echo
echo "===== 6. 目录形态（flat + dir）====="
ls -la "blog/${SLUG}.html" && ls -la "blog/${SLUG}/"

echo
echo "===== 7. 本地 clean-URL 访问验证 ====="
curl -s -o /dev/null -w "flat  /blog/${SLUG}      -> %{http_code}\n" "http://127.0.0.1:8790/blog/${SLUG}"
curl -s -o /dev/null -w "dir   /blog/${SLUG}/     -> %{http_code}\n" "http://127.0.0.1:8790/blog/${SLUG}/"
curl -s -o /dev/null -w "blog index /blog        -> %{http_code}\n" "http://127.0.0.1:8790/blog"
curl -s -o /dev/null -w "home  /                 -> %{http_code}\n" "http://127.0.0.1:8790/"

pkill -f static-server.js 2>/dev/null
echo "完成"
