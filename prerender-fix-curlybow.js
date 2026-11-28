#!/usr/bin/env node
// prerender-fix-curlybow.js — 重新 prerender 7 个缺 SPA 引导脚本的薄壳产品页
// 背景（2026-11-28 SEO 巡检）：new-site/products/curly-bow/* 下 7 个页面是
// 11-07「47 个薄页修复」留下的静态壳——只有 h1 + 产品图，没有
// <script type="module" src="/assets/index-*.js">，SPA 不会启动，Google 抓到的
// 正文只有 9 个字符。注入引导脚本后用本脚本重新 prerender 成完整静态 HTML。
//
// 口径：msdribbon.com = 厦门美丝达，成立于 2007-08-17 → 一律「since 2007」。
//       严禁出现 2004 / Smith Ribbon。

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8790';
const SITE = '/workspace/new-site';

const ROUTES = [
  '/products/curly-bow/curly-bow',
  '/products/curly-bow/msd-egg-shaped-curly-bow-balloon-ribbon-party-decoration-p',
  '/products/curly-bow/msd-plain-curly-bow-football-ribbon-egg-roll-ball-balloon',
  '/products/curly-bow/msd-10m-birthday-curly-bow-balloon-ribbon-silver-color-egg',
  '/products/curly-bow/msd-pp-5mm-10m-curly-bow-wedding-party-flower-packaging-ri',
  '/products/curly-bow/msd-curly-bow-christmas-holiday-decoration-fabric-ribbon-o',
  '/products/curly-bow/msd-gift-decoration-curly-bow-ribbon-egg-roll-flower-wrap',
];

function outPath(route) {
  const segs = route.replace(/^\//, '').split('/').filter(Boolean);
  return path.join(SITE, ...segs, 'index.html');
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'],
  });

  let ok = 0;
  let fail = 0;

  for (const route of ROUTES) {
    const page = await browser.newPage();
    try {
      await page.setDefaultTimeout(20000);
      await page.setDefaultNavigationTimeout(25000);
      await page.goto(BASE + route + '/', { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 1200));

      const html = await page.content();
      const out = outPath(route);
      fs.writeFileSync(out, html, 'utf8');

      const body = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // 口径自检：不得出现 2004 / Smith
      const bad = /2004|Smith Ribbon/i.test(html);

      console.log(
        `✓ ${route} -> ${path.relative(SITE, out)} (${Math.round(html.length / 1024)}KB, body=${body.length}ch)${bad ? '  ⚠️ 口径违规!' : ''}`
      );
      ok++;
      if (bad) fail++;
    } catch (e) {
      console.log(`✗ ${route}: ${String(e.message).slice(0, 120)}`);
      fail++;
    } finally {
      await page.close().catch(() => {});
    }
  }

  await browser.close();
  console.log(`\n完成: ${ok} 成功 / ${fail} 失败`);
})();
