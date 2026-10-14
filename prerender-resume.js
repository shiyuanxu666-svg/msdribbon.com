#!/usr/bin/env node
// prerender-resume.js — 只跑 _prerendered/ 里还没生成 index.html 的路由
// 并发 4 个 tab 提速

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8770';
const OUT_DIR = '/workspace/new-site/_prerendered';
const ROUTES_FILE = '/workspace/new-site/_routes.txt';
const CONCURRENCY = 4;  // 并发数

const routes = fs.readFileSync(ROUTES_FILE, 'utf8').split('\n').filter(Boolean);
console.log(`[resume] 总路由: ${routes.length}`);

const pending = routes.filter(route => {
  let outPath;
  if (route === '/' || route === '') {
    outPath = path.join(OUT_DIR, 'index.html');
  } else {
    const clean = route.replace(/^\//, '');
    const segs = clean.split('/').filter(Boolean);
    outPath = path.join(OUT_DIR, ...segs, 'index.html');
  }
  return !fs.existsSync(outPath);
});
console.log(`[resume] 待跑: ${pending.length}`);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const startTime = Date.now();
  let done = 0, fail = 0;

  async function worker(id) {
    while (pending.length > 0) {
      const route = pending.shift();
      if (!route) break;
      const page = await browser.newPage();
      try {
        await page.setDefaultTimeout(20000);
        await page.setUserAgent('Mozilla/5.0 (compatible; PrerenderBot/1.0)');
        const resp = await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 25000 });
        await new Promise(r => setTimeout(r, 600));
        const html = await page.content();

        let outPath;
        if (route === '/' || route === '') {
          outPath = path.join(OUT_DIR, 'index.html');
        } else {
          const clean = route.replace(/^\//, '');
          const segs = clean.split('/').filter(Boolean);
          outPath = path.join(OUT_DIR, ...segs, 'index.html');
        }
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, html, 'utf8');

        done++;
        const status = resp ? resp.status() : 0;
        if (status === 200) {
          process.stdout.write(`[W${id} ${done}/${pending.length + done}] ✓ ${route}\n`);
        } else {
          fail++;
          process.stdout.write(`[W${id} ✗${status}] ${route}\n`);
        }
      } catch (err) {
        fail++;
        process.stdout.write(`[W${id} ✗ERR] ${route}: ${err.message.slice(0, 60)}\n`);
      } finally {
        await page.close();
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1)));
  await browser.close();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n[resume] 完成 ✓ ${done} 成功 / ✗ ${fail} 失败 / 用时 ${elapsed}s`);
})();