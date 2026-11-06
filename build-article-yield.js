#!/usr/bin/env node
// build-article.js — 注入 JSON-LD / 更新 blog/index.html / sitemap.xml / _routes.txt
const fs = require('fs');
const path = require('path');

const ROOT = '/workspace/new-site';
const SLUG = 'custom-ribbon-yield-consumption-guide';
const URL = `https://msdribbon.com/blog/${SLUG}`;
const DATE = '2026-11-03';
const IMG = 'https://msdribbon.com/assets/images/cat-satin-ribbons.jpg';
const TITLE_FULL = 'Custom Ribbon Yield Guide: How to Calculate Metres per Unit and Order the Right Quantity';
const DESC = 'How to calculate ribbon consumption for packaging, bows and trim: metres per unit, shrinkage allowance, waste factors, roll maths and how to order the right quantity from a ribbon manufacturer.';

// ---- FAQ (与正文一致) ----
const FAQS = [
  ['How do I calculate how many metres of ribbon I need per unit?',
   'Build the product and measure it. For a bow, add the loop circumference of each loop, the ribbon consumed inside the knot, the centre wrap and the full tail lengths, then add 5 to 10 percent for the difference between a taut measurement and a tied one. For a cross wrap on a box, multiply the perimeter by the number of wraps, add any diagonal, and add the bow. For garment trim, take the cut length plus the trim allowance. The most accurate method is to unpick ten finished units, weigh the ribbon, and divide the total weight by the known grams per metre for that construction, which also captures the setup waste automatically. If you cannot sample yet, use typical figures as a starting point and then re-run the calculation against the first production batch.'],
  ['What shrinkage allowance should I build into a custom ribbon order?',
   'For printed polyester satin and grosgrain, budget 2 to 4 percent. For organza, which has a looser weave, 3 to 5 percent is realistic. Foil and hot stamping can shrink the section under the foil locally and cause curling, which is treated as a quality issue rather than a length allowance. The important discipline is where you apply it: build the shrinkage into the cut length rather than the order quantity, so every unit is still the intended finished size after processing. If the ribbon will be laundered by the end customer, the pre-shrink needs to be specified with the factory rather than assumed, because laundering conditions vary and the ribbon will not shrink identically in every household.'],
  ['How much waste should I allow for printed ribbon?',
   'Budget 3 to 5 percent process waste for a single-colour continuous print and 6 to 8 percent for multiple colours, where each colour needs its own registration check and setup. Add line waste of 1 to 2 percent for a single colourway, 2 to 4 percent for multiple colourways and 4 to 6 percent where several designs and colourways share a line. For jacquard-woven ribbon the loss is different in kind: if the product window shows a partial motif, you lose the unused part of each pattern repeat, which can be several percent and is a design constraint rather than a factory inefficiency. For pre-tied bows, allow 5 to 8 percent for the tying scrap. For cut-and-packed lengths, the waste is concentrated in changeover and roll tails rather than spread through the run.'],
  ['What standard roll lengths can I order, and how do they affect my order quantity?',
   'Ribbon mills commonly produce rolls of 100m, 200m, 500m and 1000m, though the exact range depends on width and construction. Each roll carries an unusable tail of a few metres, so the number of roll changes matters: 2,050m ordered as eleven 200m rolls plus 50m incurs eleven tails, while the same quantity as two 1000m rolls plus 50m incurs only two. For this reason it is worth specifying the roll split you want in your enquiry, and worth asking whether the factory can supply a different roll length for your programme, since some mills will produce to a customer\'s roll length for a sufficiently large order. It also matters for freight, because ribbon is a volumetric product and the way rolls stack affects the container utilisation.'],
  ['Is the MOQ per metre, per colour, per design or per width?',
   'In practice it is per colourway per design, per width and per decoration method. A published MOQ of 3,000m therefore means 3,000m for each colour of each design at that width, not 3,000m across the order. This matters enormously in the yield calculation, because a brief with six colourways and one design needs 18,000m to satisfy a 3,000m MOQ, while a brief with six colourways and two designs needs 36,000m. Always ask the supplier to state the MOQ definition explicitly in the quotation, and ask what the trial quantity is, because many factories will accept 500m for a first colourway even where their printed MOQ is higher.'],
  ['How do I handle a yield figure that turns out to be wrong after production starts?',
   'Design the reconciliation into the order rather than hoping it will not arise. Ask the factory to measure consumption on the first production batch and report the actual metres per unit against your calculated figure before producing the balance of the order. Where the two differ, agree a revised order quantity in writing, adjusted for the material already consumed and the remaining balance, and record it against the order number. If you are using a call-off or blanket order structure, define in the schedule how consumption variance is treated, including the tolerance band within which no adjustment is made and the process above the band. Buyers who set this up in advance resolve the issue in one email; buyers who do not negotiate against the invoice for a higher price.'],
  ['Does packaging ribbon need to be counted separately from product ribbon?',
   'Yes, and it is frequently the larger of the two. Ribbon used for retail packaging, gift set assembly, display cards, belly bands and basket wrapping is consumed separately from the ribbon that forms the product decoration, and it is frequently specified in a different width or construction. A programme that appears to need 5,000m of 19mm ribbon for the bows may need a further 3,000m of 10mm ribbon for the packaging band, with a separate MOQ, separate setup and separate colourway requirements. Build packaging, samples and any in-store display material into the yield as distinct lines with their own widths and quantities, so that a quotation covers the full programme rather than the visible product alone.']
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
        "Custom ribbon yield calculation",
        "Ribbon consumption per unit",
        "Ribbon shrinkage allowance",
        "Ribbon waste allowance",
        "Ribbon roll planning",
        "Ribbon quantity for OEM orders"
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
console.log('✓ 口径检查通过 (since 2007, 无 Smith Ribbon)');

// ---- blog/index.html: 插入到 featured guides 首位 ----
const idxPath = path.join(ROOT, 'blog', 'index.html');
let idx = fs.readFileSync(idxPath, 'utf8');
const marker = '<div class="news-list">\n      <article class="news-card" data-component="article-card">\n        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon colour swatches and dye-lot samples from a ribbon manufacturer in Xiamen, China"';
if (!idx.includes(marker)) { console.error('FATAL: blog/index.html 锚点未找到'); process.exit(1); }

const card = `<div class="news-list">
      <article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Ribbon yield calculation with roll lengths and metres per unit for OEM ribbon buyers" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">13 min read</p>
          <h3 class="news-card__title">Custom Ribbon Yield Guide: How to Calculate Metres per Unit</h3>
          <p class="t-body-sm muted-text">The ribbon quantity maths every OEM buyer needs &#8212; metres per unit by product type, shrinkage allowance, realistic waste factors, roll planning and a worked example that turns a product into a quotable order quantity.</p>
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
