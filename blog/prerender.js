#!/usr/bin/env node
// prerender.js — 用系统 Chromium 把 SPA 的 357 个路由 prerender 成静态 HTML
// 让 Google/Bing 不依赖 JS 也能抓到完整内容 + 正确的 title/description/canonical/JSON-LD

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8790';
const OUT_DIR = '/workspace/new-site/_prerendered';
const ROUTES_FILE = '/workspace/new-site/_routes.txt';

// 读路由列表
const routes = fs.readFileSync(ROUTES_FILE, 'utf8').split('\n').filter(Boolean);
console.log(`[prerender] 总路由数: ${routes.length}`);

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
    ],
  });

  let success = 0, fail = 0;
  const startTime = Date.now();

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const url = BASE + route;
    const page = await browser.newPage();

    try {
      // 设置资源超时
      await page.setDefaultTimeout(15000);
      await page.setDefaultNavigationTimeout(20000);

      // User-Agent 让 React Router 走客户端渲染
      await page.setUserAgent('Mozilla/5.0 (compatible; PrerenderBot/1.0; +https://msdribbon.com)');

      // 抓取页面（等到 networkidle2 = 主资源加载完，JS 执行完）
      const resp = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 20000,
      });

      // 给 React 一些时间执行 SEO 注入（setState 后 useEffect 跑 head meta 写入）
      await new Promise(r => setTimeout(r, 800));

      // 取出最终 HTML（含 JS 执行后的完整 DOM + 写入的 head meta）
      const html = await page.content();

      // 保存路径：route → 文件
      // /  → /index.html
      // /products → /products/index.html
      // /products/satin-ribbons → /products/satin-ribbons/index.html
      // /products/satin-ribbons/foo → /products/satin-ribbons/foo.html
      let outPath;
      if (route === '/' || route === '') {
        outPath = path.join(OUT_DIR, 'index.html');
      } else {
        const cleanRoute = route.replace(/^\//, '');
        const segments = cleanRoute.split('/').filter(Boolean);
        if (segments.length === 1) {
          // /products → /products/index.html
          outPath = path.join(OUT_DIR, segments[0], 'index.html');
        } else {
          // /products/satin-ribbons → /products/satin-ribbons/index.html
          outPath = path.join(OUT_DIR, ...segments, 'index.html');
        }
      }

      // 创建目录
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      // 强制把 <html lang> 改成英文（默认渲染是英文，?lang=zh 时才是中文）
      // 这里 prerender 英文版；中文版路由 = 路由路径 + index.html?lang=zh 但 Google 看 hreflang
      const finalHtml = html;

      fs.writeFileSync(outPath, finalHtml, 'utf8');

      // 检查 status
      const status = resp ? resp.status() : 0;
      if (status === 200) {
        success++;
        const size = (finalHtml.length / 1024).toFixed(1);
        process.stdout.write(`[${i + 1}/${routes.length}] ✓ ${status} ${route} → ${path.relative(OUT_DIR, outPath)} (${size}KB)\n`);
      } else {
        fail++;
        process.stdout.write(`[${i + 1}/${routes.length}] ✗ ${status} ${route}\n`);
      }
    } catch (err) {
      fail++;
      process.stdout.write(`[${i + 1}/${routes.length}] ✗ ERROR ${route}: ${err.message.slice(0, 80)}\n`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n[prerender] 完成! ✓ ${success} 成功 / ✗ ${fail} 失败 / 用时 ${elapsed}s`);
  console.log(`[prerender] 输出目录: ${OUT_DIR}`);
  process.exit(fail > success ? 1 : 0);
})();