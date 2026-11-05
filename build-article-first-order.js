#!/usr/bin/env node
// build-article-first-order.js — 注入 JSON-LD / 更新 blog/index.html / sitemap.xml / _routes.txt
const fs = require('fs');
const path = require('path');

const ROOT = '/workspace/new-site';
const SLUG = 'custom-ribbon-first-order-program-planning-guide';
const URL = `https://msdribbon.com/blog/${SLUG}`;
const DATE = '2026-11-05';
const IMG = 'https://msdribbon.com/assets/images/cat-satin-ribbons.jpg';
const TITLE_FULL = 'Custom Ribbon First Order Guide: How to Plan Your First OEM Ribbon Program';
const DESC = 'How to plan your first custom ribbon order with a manufacturer: MOQ strategy, artwork setup, realistic lead times, first-shipment risk control and a 90-day timeline.';

// ---- FAQ (与正文一致) ----
const FAQS = [
  ['What is a realistic minimum order quantity for custom printed ribbon?',
   'Printed ribbon normally starts at around 1,000 to 3,000 metres per colourway per design per width, and woven jacquard typically starts higher. The important detail is that the minimum applies per colourway and per design rather than to the order as a whole, so a brief with six colourways of one design at a 3,000 metre minimum is an 18,000 metre programme, and six colourways of two designs is 36,000 metres. Always get the definition stated in writing on the quotation and the purchase order, and ask separately whether a smaller trial quantity is available for a first order.'],
  ['How long does a first custom ribbon order take from artwork to shipment?',
   'For printed ribbon, a realistic range from approved artwork to goods ready for shipment is seven to nine weeks, broken down as roughly three to seven days for artwork preparation and screen making, ten to fifteen days for dyeing, five to ten days for printing, three to five days for finishing and rewinding and three to five days for inspection and packing. Add one to two weeks for a first production run because of setup learning, and add more if the order lands between September and December when factory queues are at their longest. Transit is a separate number on top and depends on your chosen mode and route.'],
  ['Should I order more colourways or more metres in my first order?',
   'Order more metres and fewer colourways. Minimum order quantity is a setup-recovery figure, so each additional colourway and each additional design carries its own setup cost and its own minimum. Ordering one design at the full minimum usually gives a materially better per-metre price than ordering three designs at a third each, and it keeps your working capital in ribbon you will actually sell rather than in inventory across three shades. Sequence the other colourways into a second order once the first has sold through; if they come from the same plate, the second colourway carries no new setup cost at all.'],
  ['Do I need a physical sample before placing a first custom ribbon order?',
   'Yes. The physical sample in your actual colour is the single most cost-effective step in the whole process, and on a first order it is not optional. Screen colour, thread colour and paper colour are three different things, so a digital mock-up tells you very little about how the ribbon will look in the pack. Test the sample by tying a bow, wrapping the actual box, leaving it overnight to see whether the bow slumps, measuring the width at three points and rubbing the print with a damp cloth. Then approve it in writing, ideally with a marked sample or a signed photo that shows the measurement scale.'],
  ['What artwork format does a ribbon manufacturer need for screen printing?',
   'The factory needs the artwork separated into the individual colours that will be printed, each colour on its own layer, in a vector format, with the repeat dimension specified and scaled to the physical ribbon width. A single flattened file with all colours merged is the most common cause of a rejected artwork submission, because it cannot be separated into screens without re-inking, and re-inking changes the colour. Ask the factory for their artwork specification sheet before you prepare files, and if you have no prepress capability, ask whether they can prepare artwork and what that costs.'],
  ['When should I raise certification requirements for a first ribbon order?',
   'Before the order is placed, ideally before you approve a material. Certification depends on the specific fibre and the specific factory, and a certificate issued for one colourway or one construction is not automatically valid for another. Ask what the certificate covers, whether it will be issued against your transaction or against the factory, and when it will be issued relative to shipment. A certificate that arrives a few weeks after the goods is still useful, but a certificate that cannot be obtained because the material has already been woven is a programme-ending problem.'],
  ['How do I reduce the risk of a first ribbon order arriving in the wrong volume?',
   'Start from your sell-through rate and your existing stock cover for the category rather than from the minimum order quantity, and order to the cover you need. If your forecast genuinely cannot absorb the minimum, ask the factory for a trial quantity at their stated trial rate and plan a second order once you have real sell-through data. For the first shipment, leave at least two weeks of buffer before your sell-in date and consider splitting the order so that a smaller part arrives early by air, which lets you react to actual sales rather than to a forecast.']
];

// ---- 校验：正文 FAQ 必须与 JSON-LD 一致 ----
const artPath = path.join(ROOT, 'blog', `${SLUG}.html`);
let html = fs.readFileSync(artPath, 'utf8');

const bodyFaqQs = [...html.matchAll(/<p class="faq-q">([\s\S]*?)<\/p>/g)].map(m => m[1].trim());
const bodyFaqAs = [...html.matchAll(/<p class="faq-a">([\s\S]*?)<\/p>/g)].map(m => m[1].trim());
if (bodyFaqQs.length !== FAQS.length || bodyFaqAs.length !== FAQS.length) {
  console.error(`FATAL: FAQ 数量不一致 正文=${bodyFaqQs.length}/${bodyFaqAs.length} jsonld=${FAQS.length}`);
  process.exit(1);
}
for (let i = 0; i < FAQS.length; i++) {
  if (bodyFaqQs[i] !== FAQS[i][0] || bodyFaqAs[i] !== FAQS[i][1]) {
    console.error(`FATAL: FAQ #${i + 1} 正文与 JSON-LD 不一致`);
    process.exit(1);
  }
}

// ---- 词数校验 ----
const text = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
const words = text.split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w)).length;
console.log(`正文词数(含 FAQ): ${words}`);
if (words < 1200) { console.error('FATAL: 正文不足 1200 词'); process.exit(1); }

// ---- meta description 长度校验 ----
const mDesc = html.match(/<meta name="description" content="([^"]+)"/);
if (mDesc) {
  const len = mDesc[1].length;
  console.log(`meta description 长度: ${len}`);
  if (len < 150 || len > 160) { console.error(`FATAL: meta description 长度 ${len} 不在 150-160`); process.exit(1); }
} else { console.error('FATAL: meta description 缺失'); process.exit(1); }

// ---- canonical / hreflang 校验 ----
if (!html.includes(`<link rel="canonical" href="${URL}">`)) { console.error('FATAL: canonical 缺失/错误'); process.exit(1); }
if (!html.includes(`hreflang="en" href="${URL}"`)) { console.error('FATAL: hreflang en 缺失'); process.exit(1); }
if (!html.includes(`hreflang="x-default" href="${URL}"`)) { console.error('FATAL: hreflang x-default 缺失'); process.exit(1); }
console.log('✓ canonical + hreflang (en/x-default) 校验通过');

// ---- JSON-LD ----
const jsonld = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${URL}#article`,
      "headline": TITLE_FULL,
      "description": DESC,
      "image": [IMG],
      "datePublished": DATE,
      "dateModified": DATE,
      "inLanguage": "en",
      "mainEntityOfPage": { "@type": "WebPage", "@id": URL },
      "author": {
        "@type": "Organization",
        "name": "MSD Bow",
        "legalName": "Xiamen Meisida Decoration Co., Ltd.",
        "url": "https://msdribbon.com/",
        "email": "admin@msdribbon.com",
        "telephone": "+8613779951780",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "7th Floor, No. 16, Tong'an Industrial Park, Meixi Road, Tong'an District",
          "addressLocality": "Xiamen",
          "addressRegion": "Fujian",
          "postalCode": "361100",
          "addressCountry": "CN"
        }
      },
      "publisher": { "@id": "https://msdribbon.com/#organization" },
      "about": [
        "Custom ribbon first order planning",
        "OEM ribbon program roadmap",
        "Ribbon MOQ strategy",
        "Ribbon artwork preparation",
        "Ribbon lead time planning",
        "First shipment risk control"
      ],
      "wordCount": words
    },
    {
      "@type": "FAQPage",
      "@id": `${URL}#faq`,
      "mainEntity": FAQS.map(([q, a]) => ({
        "@type": "Question", "name": q,
        "acceptedAnswer": { "@type": "Answer", "text": a }
      }))
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${URL}#breadcrumb`,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://msdribbon.com/" },
        { "@type": "ListItem", "position": 2, "name": "Blogs", "item": "https://msdribbon.com/" },
        { "@type": "ListItem", "position": 3, "name": TITLE_FULL, "item": URL }
      ]
    }
  ]
}, null, 2);

if (!html.includes('__JSONLD__')) { console.error('FATAL: 占位符未找到'); process.exit(1); }
html = html.replace('__JSONLD__', jsonld);
fs.writeFileSync(artPath, html, 'utf8');
console.log(`✓ JSON-LD 已注入: ${artPath}`);

// ---- 口径检查：禁止 2004 / Smith Ribbon ----
const bad = [];
if (/\b2004\b/.test(html)) bad.push('2004');
if (/Smith\s*Ribbon/i.test(html)) bad.push('Smith Ribbon');
if (bad.length) { console.error('FATAL: 口径违规: ' + bad.join(', ')); process.exit(1); }
if (!html.includes('since 2007')) { console.error('FATAL: 缺少 since 2007'); process.exit(1); }
console.log('✓ 口径检查通过 (since 2007, 无 2004 / Smith Ribbon)');

// ---- blog/index.html: 插入到 featured guides 首位 ----
const idxPath = path.join(ROOT, 'blog', 'index.html');
let idx = fs.readFileSync(idxPath, 'utf8');
const marker = `<div class="news-list">
      <article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Satin, grosgrain, organza, velvet, polypropylene and RPET ribbon compared for OEM packaging decisions"`;
if (!idx.includes(marker)) { console.error('FATAL: blog/index.html 锚点未找到'); process.exit(1); }

const card = `<div class="news-list">
      <article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Planning a first custom ribbon order with a manufacturer: MOQ strategy, artwork setup, lead time planning and 90-day timeline" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">14 min read</p>
          <h3 class="news-card__title">Custom Ribbon First Order Guide: Planning Your First OEM Program</h3>
          <p class="t-body-sm muted-text">How to plan a first custom ribbon order with a manufacturer: MOQ strategy per colourway, artwork preparation, realistic lead times, first-shipment risk control and a practical 90-day timeline.</p>
          <a class="inline-link news-card__link" href="/blog/${SLUG}">Read more<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>
        </div>
      </article>
`;
idx = idx.replace(marker, card);
fs.writeFileSync(idxPath, idx, 'utf8');
console.log('✓ blog/index.html 已插入新文章卡片');

// ---- _routes.txt ----
const routesPath = path.join(ROOT, '_routes.txt');
let routes = fs.readFileSync(routesPath, 'utf8');
const route = `/blog/${SLUG}`;
if (!routes.includes(route)) {
  routes = routes.replace(/\s*$/, '\n') + route + '\n';
  fs.writeFileSync(routesPath, routes, 'utf8');
  console.log('✓ _routes.txt 已追加路由');
} else {
  console.log('· _routes.txt 已含该路由');
}

// ---- sitemap.xml: lastmod 全部更新 + 新增文章 ----
const smPath = path.join(ROOT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8');
sm = sm.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${DATE}</lastmod>`);
if (!sm.includes(route)) {
  const entry = `  <url>\n    <loc>${URL}</loc>\n    <lastmod>${DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  sm = sm.replace('</urlset>', entry + '</urlset>');
}
fs.writeFileSync(smPath, sm, 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const dupes = locs.filter((v, i) => locs.indexOf(v) !== i);
console.log(`✓ sitemap.xml 已更新: ${locs.length} URLs, 重复 ${dupes.length}`);
if (dupes.length) { console.error('FATAL: sitemap 有重复 URL: ' + [...new Set(dupes)].join(', ')); process.exit(1); }

console.log('\n全部完成 ✅');
