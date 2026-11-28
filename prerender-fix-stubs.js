#!/usr/bin/env node
// prerender-fix-stubs.js — 修复全站「静态壳」产品页
//
// 背景（2026-11-28 SEO 巡检）：
//   new-site/products/** 下有 ~44 个页面是早期手工写的静态壳——只有 h1 + 产品图，
//   缺 <script type="module" src="/assets/index-*.js">（SPA 不启动）
//   且缺 <div id="root">（React 没有挂载点）
//   → Google 抓到的正文只有几十个字符，属 thin content / soft-404 风险。
//   同一批 URL 在 _prerendered/ 下也存了一份壳。
//
// 做法：
//   1. 给每个壳页面注入 SPA 引导脚本 + <div id="root"> 容器（保留原有 h1/figure 作为无 JS 兜底）
//   2. 用系统 Chromium 打开本地 SPA，networkidle2 后把渲染好的 HTML 写回
//   3. 写回前做口径自检：msdribbon.com = 厦门美丝达，since 2007，
//      禁止出现 2004 / Smith Ribbon
//
// 口径：msdribbon.com = 厦门美丝达 Xiamen Meisida Decoration Co., Ltd.
//       成立于 2007-08-17 → 一律用「since 2007」，禁止出现 2004 / Smith Ribbon。

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8790';
const SITE = '/workspace/new-site';
const BUNDLE = '/assets/index-4WtaRPLf.js';
const BOOT_TAG = `    <script type="module" crossorigin="" src="${BUNDLE}"></script>\n`;

// 只处理 < 25KB 的静态壳；正常 prerender 页 > 30KB
const MAX_SHELL = 25000;

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name.startsWith('_backup')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === 'index.html') acc.push(p);
  }
  return acc;
}

function isShell(p) {
  const s = fs.readFileSync(p, 'utf8');
  if (s.length > MAX_SHELL) return false;
  if (s.includes('assets/index-') && s.includes('id="root"')) return false;
  return true;
}

// 注入 SPA 引导脚本 + root 容器
function inject(p) {
  let s = fs.readFileSync(p, 'utf8');
  const before = s;

  if (!s.includes(BUNDLE)) {
    if (s.includes('</head>')) s = s.replace('</head>', BOOT_TAG + '</head>');
    else return null;
  }
  if (!s.includes('id="root"')) {
    const m = s.match(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i);
    if (!m) return null;
    s = s.slice(0, m.index) + m[1] + '\n    <div id="root">' + m[2].trim() + '\n    </div>\n' + m[3] + s.slice(m.index + m[0].length);
  }
  if (s === before) return null;
  fs.writeFileSync(p, s, 'utf8');
  return p;
}

// 从文件路径反推路由： products/a/b/index.html -> /products/a/b
function routeOf(p) {
  const rel = path.relative(SITE, p).split(path.sep);
  rel.pop(); // index.html
  return '/' + rel.join('/');
}

(async () => {
  // 1) 找出所有壳
  const all = walk(path.join(SITE, 'products')).concat(walk(path.join(SITE, 'blog')));
  const shells = all.filter(isShell);
  console.log(`[fix] 发现静态壳: ${shells.length}`);

  // 2) 先处理 live 的 products/ 目录（线上真正服务的目录）
  const live = shells.filter((p) => !p.includes('/_prerendered/'));
  const pre = shells.filter((p) => p.includes('/_prerendered/'));
  console.log(`[fix] live=${live.length} _prerendered=${pre.length}`);

  for (const p of live) inject(p);
  console.log(`[fix] 已注入 SPA 引导脚本 + root 容器`);

  // 3) prerender live 的壳页面
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'],
  });

  let ok = 0;
  let fail = 0;
  const failed = [];

  for (const p of live) {
    const route = routeOf(p);
    const page = await browser.newPage();
    try {
      await page.setDefaultTimeout(20000);
      await page.setDefaultNavigationTimeout(25000);
      await page.goto(BASE + route + '/', { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 900));

      const html = await page.content();
      const body = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (/2004|Smith Ribbon/i.test(html)) {
        console.log(`⚠️  口径违规，跳过: ${route}`);
        failed.push(route + ' (entity year)');
        fail++;
        continue;
      }
      if (body.length < 500) {
        console.log(`⚠️  渲染仍然太薄(${body.length}ch)，跳过: ${route}`);
        failed.push(route + ` (thin ${body.length}ch)`);
        fail++;
        continue;
      }

      fs.writeFileSync(p, html, 'utf8');
      console.log(`✓ ${route} → ${Math.round(html.length / 1024)}KB body=${body.length}ch`);
      ok++;
    } catch (e) {
      console.log(`✗ ${route}: ${String(e.message).slice(0, 100)}`);
      failed.push(route + ' (error)');
      fail++;
    } finally {
      await page.close().catch(() => {});
    }
  }
  await browser.close();

  // 4) _prerendered/ 下的壳同步（用同样的注入，让下次跑 prerender.js 时能正确覆盖）
  for (const p of pre) inject(p);

  console.log(`\n[fix] 完成: ${ok} 成功 / ${fail} 失败`);
  if (failed.length) {
    console.log('[fix] 失败清单:');
    failed.forEach((f) => console.log('   - ' + f));
  }
  fs.writeFileSync('/workspace/tools/_fix_stubs_1128.json', JSON.stringify({ ok, fail, failed }, null, 2));
})();
