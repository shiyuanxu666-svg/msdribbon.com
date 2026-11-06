#!/usr/bin/env node
// build-article-packaging.js — 注入 JSON-LD / 更新 blog/index.html / sitemap.xml / _routes.txt
const fs = require('fs');
const path = require('path');

const ROOT = '/workspace/new-site';
const SLUG = 'custom-ribbon-packaging-packing-format-guide';
const URL = `https://msdribbon.com/blog/${SLUG}`;
const DATE = '2026-11-06';
const IMG = 'https://msdribbon.com/assets/images/cat-satin-ribbons.jpg';
const TITLE_FULL = 'Custom Ribbon Packaging Guide: Choosing Retail-Ready Packing Formats for OEM Buyers';
const DESC = 'Custom ribbon packaging guide for OEM buyers: roll, spool and card formats, bow sets, master carton specs, labelling requirements and packing cost control.';

// ---- FAQ (与正文一致) ----
const FAQS = [
  ['What are the most common packaging formats for custom ribbon?',
   'The main formats are bulk rolls on a paper core, spools with flanged reels, ribbon wound onto printed cards, pre-made bow sets on backing cards, pre-cut lengths banded or tied, and retail display kits with a printed inner tray. Bulk rolls on a core are the cheapest and suit repacking into your own packaging; cards and bow sets are retail-ready and suit selling ribbon or bows direct to end consumers; pre-cut lengths suit gift-set assembly where you want the factory to do the cutting on consistent equipment. The right answer depends on whether the ribbon is repacked, sold as a product, or assembled into a kit.'],
  ['How do I specify ribbon rolls so they arrive usable?',
   'State the metres per roll, the core diameter, and the winding direction. The core is commonly 25mm or 38mm in diameter, and the winding direction is either edge-to-edge or centre-pull, which must be specified because the two are different products for the same purpose. Also state the number of rolls per carton and whether the roll label should carry the colour, length, width and lot number. A roll specification that omits the winding direction will be defaulted by the factory to whatever its winding machines are set up for, and changing it later requires a new order rather than a rewind.'],
  ['What is the difference between a ribbon spool and a ribbon card?',
   'A spool is a flanged reel with a defined hub, usually in plastic or cardboard, and it is the format for ribbon sold by the metre in retail and for ribbon used on automated wrapping equipment, because the flanges prevent the ribbon springing off and help it unwind predictably. A card is a flat printed substrate, usually 25mm or 38mm wide, holding between 5 and 50 metres, and it is the standard retail format for craft and gift ribbon because the printed card already carries the branding, colour name, length and barcode. Spools protect the ribbon and suit machinery; cards sell the ribbon and suit a gift shop shelf.'],
  ['How much does packaging add to my landed cost per metre?',
   'It depends almost entirely on how much ribbon is in each pack, because packaging cost is per unit while your cost base is per metre. A fifty-metre retail spool carries the same packaging cost as a five-metre card but spreads it over ten times the ribbon. Freight also enters the calculation, because ocean freight is charged on volume before weight, so bulky packaging on the same metres can inflate the freight bill by a factor rather than a percentage. Ask for the packed dimensions, gross weight and carton count, then cost the pack per metre and per retail unit before deciding. In many programmes the packaging cost is recovered through a higher retail price rather than a lower unit cost, so it should be modelled as part of the product economics rather than as a logistics afterthought.'],
  ['Should mixed colourways be allowed inside one master carton?',
   'It depends on your picking model. Single-colourway cartons are simpler to receive, count and pick, and mixed cartons are where missing-roll disputes begin because the goods must be opened, sorted and re-labelled at the goods-in bench. If you want mixed cartons, specify the exact composition in writing, for example three green, two ivory and one red, because the word mixed on a packing list becomes whatever was at the end of the production run in practice. Match the carton quantity to your internal ordering unit as well, so that a carton divides cleanly into your reorder quantity and short-picks do not accumulate on the bench.'],
  ['What information should be on a ribbon carton label?',
   'At minimum: your purchase order number, the factory\u2019s item or style code, the colour name or code, the ribbon width in millimetres, the total metres, the number of rolls or units inside, the colourway or design reference, the production lot number, the production date, and the factory\u2019s name and address. The lot number is the field worth arguing for, because it lets you trace a customer colour complaint back to a specific dye lot, and dye lots are the usual root cause of a colour drift dispute. If the goods are cut lengths or pre-tied bows, put the piece length on the label too, because a length is a functional attribute of that product and it lets the team pick and put the goods away without measuring them.'],
  ['Does custom ribbon packaging have its own minimum order quantity?',
   'Frequently, yes, and it is routinely overlooked. Printed cards, branded spools and printed display trays are separate manufactured items with their own setup and minimum quantities, and on a small programme the packaging minimum rather than the ribbon minimum becomes the binding constraint on your total order value. A factory that quotes a low per-metre price on a small ribbon run can quote a high per-unit packaging cost on the same run, which can make the programme more expensive than the headline ribbon figure suggests. Ask for the packaging minimum and cost to be quoted as separate lines so you can see exactly where the constraint sits.']
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
    console.error(`  body: ${bodyFaqQs[i].slice(0,80)}`);
    console.error(`  ld  : ${FAQS[i][0].slice(0,80)}`);
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
        "Custom ribbon packaging specification",
        "Ribbon roll and spool formats",
        "Retail ready ribbon card packing",
        "Master carton specification",
        "Ribbon carton labelling requirements",
        "Packing cost control for OEM buyers"
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

if (html.includes('__JSONLD__')) {
  html = html.replace('__JSONLD__', jsonld);
  fs.writeFileSync(artPath, html, 'utf8');
  console.log(`✓ JSON-LD 已注入: ${artPath}`);
} else {
  console.log('· JSON-LD 已注入（跳过，文章已构建）');
}

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
// 幂等：若已存在该 slug 则跳过插入
if (idx.includes(`/blog/${SLUG}`)) {
  console.log('· blog/index.html 已含该文章卡片，跳过');
} else {
  // 定位 featured-guides 区块里的 news-list，在其第一张卡片之前插入
  const fgIdx = idx.indexOf('data-component="featured-guides"');
  if (fgIdx < 0) { console.error('FATAL: blog/index.html 找不到 featured-guides 区块'); process.exit(1); }
  const listIdx = idx.indexOf('<div class="news-list">', fgIdx);
  if (listIdx < 0) { console.error('FATAL: blog/index.html featured-guides 内找不到 news-list'); process.exit(1); }
  const cardIdx = idx.indexOf('<article class="news-card"', listIdx);
  if (cardIdx < 0) { console.error('FATAL: blog/index.html featured-guides 内找不到 news-card'); process.exit(1); }

  const card = `<article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon packaging formats compared: bulk rolls, spools, printed cards, bow sets and retail display kits for OEM buyers" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">13 min read</p>
          <h3 class="news-card__title">Custom Ribbon Packaging Guide: Choosing Retail-Ready Packing Formats</h3>
          <p class="t-body-sm muted-text">How to specify packaging for custom ribbon: roll and spool formats, printed cards, bow sets, master carton specifications, labelling requirements and packing cost control.</p>
          <a class="inline-link news-card__link" href="/blog/${SLUG}">Read more<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>
        </div>
      </article>
`;
  idx = idx.slice(0, cardIdx) + card + idx.slice(cardIdx);
  fs.writeFileSync(idxPath, idx, 'utf8');
  console.log('✓ blog/index.html 已插入新文章卡片');
}

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
