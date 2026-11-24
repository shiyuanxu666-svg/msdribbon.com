#!/usr/bin/env node
// update-blog-index.js — 在 blog/index.html 的 "Featured sourcing guides" 区块首位插入新文章卡片
const fs = require('fs');
const path = require('path');

const P = path.join(__dirname, 'blog', 'index.html');
const SLUG = 'custom-ribbon-artwork-prepress-proofing-guide';

let h = fs.readFileSync(P, 'utf8');
if (h.includes(SLUG)) {
  console.log('card already present, nothing to do');
  process.exit(0);
}

const anchor = `<article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon MOQ and volume pricing guide for OEM buyers"`;
if (!h.includes(anchor)) {
  console.error('ANCHOR NOT FOUND — aborting without changes');
  process.exit(1);
}

const card = `<article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon artwork and prepress proofing guide for OEM buyers" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">28 min read</p>
          <h3 class="news-card__title">Custom Ribbon Artwork and Prepress Proofing: Print-Ready Files, Dielines and Strike-Offs</h3>
          <p class="t-body-sm muted-text">Custom ribbon artwork and prepress proofing guide for OEM buyers: print-ready files, dielines, repeat length, Pantone colour approval, strike-offs and reorders.</p>
          <a class="inline-link news-card__link" href="/blog/${SLUG}">Read more<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>
        </div>
      </article>
`;

h = h.replace(anchor, card + anchor, 1);

// 更新结果数量
h = h.replace('<p class="result-count" aria-live="polite">49 items</p>', '<p class="result-count" aria-live="polite">50 items</p>');

fs.writeFileSync(P, h, 'utf8');
console.log('inserted card into blog/index.html');
console.log('result-count now:', (h.match(/<p class="result-count" aria-live="polite">(\d+) items<\/p>/) || [])[1]);
