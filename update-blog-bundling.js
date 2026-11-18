#!/usr/bin/env node
// update-blog-bundling.js — 把新文章接入 blog 列表页 + sitemap + blog/<slug>/index.html
// 接口沿用既有的 update-blog-index.js / update-sitemap.js 约定
const fs = require('fs');
const path = require('path');

const P_INDEX = path.join(__dirname, 'blog', 'index.html');
const P_SITEMAP = path.join(__dirname, 'sitemap.xml');
const SLUG = 'custom-ribbon-bundling-kitting-guide';
const SITE = 'https://msdribbon.com';
const DATE = '2026-11-18';

/* ---------- 1. blog/index.html — 在 Featured sourcing guides 区块首位插入卡片 ---------- */
let h = fs.readFileSync(P_INDEX, 'utf8');

if (!h.includes(SLUG)) {
  // anchor = 上一篇文章的卡片（featured 区块当前首张）
  const anchor = '<article class="news-card" data-component="article-card">\n        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon labelling and compliance requirements guide for OEM buyers"';
  if (!h.includes(anchor)) {
    console.error('ANCHOR NOT FOUND — aborting without changes');
    process.exit(1);
  }

  const card = `<article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon bundling and kitting guide for OEM buyers" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">30 min read</p>
          <h3 class="news-card__title">Custom Ribbon Bundling and Kitting: A Buyer Guide for OEM Buyers</h3>
          <p class="t-body-sm muted-text">Custom ribbon bundling and kitting guide for OEM buyers: sourcing ribbon, bows and die-cut tags as one kit, packing sequence, MOQ planning and QC control.</p>
          <a class="inline-link news-card__link" href="/blog/${SLUG}">Read more<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>
        </div>
      </article>
`;

  h = h.replace(anchor, card + anchor, 1);

  // 结果数量 +1
  const m = h.match(/(<p class="result-count" aria-live="polite">)(\d+)( items<\/p>)/);
  if (!m) { console.error('result-count not found — aborting'); process.exit(1); }
  const oldCount = Number(m[2]);
  h = h.replace(m[0], `${m[1]}${oldCount + 1}${m[3]}`);
  console.log(`blog/index.html: card inserted, result-count ${oldCount} -> ${oldCount + 1}`);
  fs.writeFileSync(P_INDEX, h, 'utf8');
} else {
  console.log('blog/index.html: card already present');
}

/* ---------- 2. blog/<slug>/index.html — GitHub Pages clean URL 变体 ---------- */
const articleSrc = fs.readFileSync(path.join(__dirname, 'blog', `${SLUG}.html`), 'utf8');
const dirPath = path.join(__dirname, 'blog', SLUG);
fs.mkdirSync(dirPath, { recursive: true });
fs.writeFileSync(path.join(dirPath, 'index.html'), articleSrc, 'utf8');
console.log(`blog/${SLUG}/index.html: created`);

/* ---------- 3. sitemap.xml ---------- */
let sm = fs.readFileSync(P_SITEMAP, 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => x[1]);
const dup = locs.filter((v, i) => locs.indexOf(v) !== i);
if (dup.length) { console.error('sitemap already has duplicate locs: ' + dup.join(', ')); process.exit(1); }

const newLoc = `${SITE}/blog/${SLUG}`;
if (!sm.includes(`<loc>${newLoc}</loc>`)) {
  const lastEnd = sm.lastIndexOf('</url>');
  if (lastEnd === -1) { console.error('no </url> in sitemap'); process.exit(1); }
  const entry = `
    <url>
        <loc>${newLoc}</loc>
        <lastmod>${DATE}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`;
  sm = sm.slice(0, lastEnd + 6) + entry + sm.slice(lastEnd + 6);
  fs.writeFileSync(P_SITEMAP, sm, 'utf8');
  console.log(`sitemap.xml: inserted ${newLoc}`);
} else {
  console.log('sitemap.xml: entry already present');
}

const finalLocs = [...fs.readFileSync(P_SITEMAP, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => x[1]);
const dup2 = finalLocs.filter((v, i) => finalLocs.indexOf(v) !== i);
console.log(`sitemap.xml: total URLs = ${finalLocs.length}, duplicates = ${dup2.length}`);
if (dup2.length) { console.error('duplicate URLs after insert'); process.exit(1); }
if (!finalLocs.includes(newLoc)) { console.error('new URL missing from sitemap'); process.exit(1); }
