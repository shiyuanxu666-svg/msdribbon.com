#!/usr/bin/env node
// build-article-resilience.js — 注入 JSON-LD / 更新 blog/index.html / sitemap.xml / _routes.txt
const fs = require('fs');
const path = require('path');

const ROOT = '/workspace/new-site';
const SLUG = 'custom-ribbon-supply-chain-resilience-multi-sourcing';
const URL = `https://msdribbon.com/blog/${SLUG}`;
const DATE = '2026-11-09';
const IMG = 'https://msdribbon.com/assets/images/cat-satin-ribbons.jpg';
const TITLE_FULL = 'Custom Ribbon Supply Chain Resilience: Building a Multi-Sourcing Strategy That Survives Disruption';
const DESC = 'Custom ribbon supply chain resilience guide for OEM buyers: dual sourcing, MOQ split strategies, supplier risk scoring and contingency planning for trim.';

// ---- FAQ (与正文一致) ----
const FAQS = [
  ['Why should I dual source custom ribbon when a single supplier is cheaper?',
   'A single source is cheaper only in the narrow sense of setup and administration cost, and that saving is measured against a risk whose real cost is not captured in any of your normal accounts. If a supplier fails during a seasonal window, the loss is the entire retail period for that product, not the ribbon\u2019s share of the bill of materials. A second source does not have to be used at equal volume; a qualified backup with an approved sample and a tested production trial covers most of the exposure at a fraction of the cost of splitting the programme evenly. The defensible position is to qualify a second supplier, run a production trial against it, and decide the split volume based on what the disruption would actually cost you.'],
  ['How do I get a second ribbon supplier to accept a lower minimum order quantity?',
   'Trade commitment rather than price. Secondary suppliers are generally far more willing to reduce a minimum than to reduce a unit price, because a lower minimum changes their order economics while a discount simply reduces their margin. What you can offer in exchange is a longer programme, a forecast you commit to honour, a smaller first trial in exchange for a reduced standing minimum, or consolidated shipping that lowers their handling cost per order. The supplier will also be more receptive once it has seen your production trial succeed, because at that point it has evidence about its own capability and the risk of your programme becomes much easier for it to price. Set the minimum discussion at the point of the trial order rather than at the point of the first commercial negotiation.'],
  ['How long does it take to transfer a custom ribbon programme to a second supplier?',
   'Realistically three to five weeks from the decision to a shipment, and the components that determine it are artwork and tooling transfer, a strike-off against the colour standard, approval of that strike-off, sourcing the yarn or film stock in the correct colour, booking the production slot and then the shipping slot. The two longest and most commonly underestimated steps are the strike-off approval, because it requires a dye lot and a physical sample, and the material sourcing, because a new colourway may need a dye batch that runs on its own cycle. This is why buffer inventory matters: the recovery time is the reason a four to eight week buffer on the critical colourway is the minimum sensible protection for a seasonal launch, and why the exercise of writing down each step with its duration should be done before you need it rather than during a disruption.'],
  ['Will a second supplier be able to match the colour of my current ribbon?',
   'Not to the same roll, and a good buyer plans for that rather than being disappointed by it. Two dye houses producing the same Pantone reference from the same fibre will land within a defined commercial tolerance but not identically, because dye lots, water chemistry, finishing tension and finishing route all vary. The practical answer is to define the tolerance numerically using a metric such as Delta E with a stated threshold, to hold a sealed physical swatch from the approved bulk production as the standard, to require a strike-off against that standard for every new dye lot, and to agree the measurement conditions and instrument in the purchase order. If your product is shade-critical across a wide range, test the secondary on the most exposed colourway first, because the tolerance that matters commercially is the one set by your weakest product, not by your average product.'],
  ['What is the difference between a qualified backup supplier and a true dual-source arrangement?',
   'A qualified backup has been evaluated, sampled, approved and documented, but has not yet produced commercially, so it is untested at your volume and its recovery time is longer and less certain. A true dual-source arrangement has both suppliers running live production from the same specification, so both are continuously rehearsing the programme and either can step up quickly. The backup is cheaper to establish and prevents a total stoppage; the dual-source arrangement preserves the schedule and protects negotiating position. For most buyers the sensible sequence is to establish a qualified backup first, since it addresses the concentration risk immediately at low cost, and then move the most critical SKUs to a live split as the volume and the relationship justify it.'],
  ['How do I assess the supply chain risk of a ribbon manufacturer I have not audited in person?',
   'Start with the input chain rather than the factory. Ask which raw materials are single-sourced, whether the yarn or film mill relationship is exclusive, what the replenishment lead time is on each critical input, and which steps of the production route are subcontracted rather than in-house. Then examine capacity headroom, because a supplier running at full book in your peak months cannot absorb a transferred volume, which is the entire purpose of a backup. Check the production entity against the invoicing entity, and confirm that the certificates covering your product and colourway are valid with the issuing body. Where a visit is possible, prioritise the dye house and the subcontracted printing step over the weaving floor.'],
  ['What buffer stock should I hold for a seasonal ribbon programme?',
   'Enough to cover the period between discovering a disruption and getting a replacement order into production, which is generally four to eight weeks of demand for the most critical construction. Buffer stock is also the only approach that removes the supplier\u2019s lead time from the critical path entirely, since a re-order still requires a strike-off approval, a dye lot and a production slot. It is worth noting that the buffer does not need to cover the whole programme. Concentrating it on the top two or three critical colourways or constructions, rather than spreading it thinly across a wide range, buys more protection for less money. For a programme where the ribbon is the reason the product exists, a modest buffer on the critical items is the cheapest insurance available and it is the option that turns a supply failure into a stock adjustment rather than a cancelled launch.'],
  ['How should I segment my ribbon programme when deciding what to dual source?',
   'Rank the programme by criticality rather than by volume, and split only the top tier. Criticality is best measured as the revenue at risk if that specific SKU stops, which is usually a small number of colourways or constructions carrying most of the programme\u2019s exposure. Applying a blanket split across every SKU in a range is the most common mistake, because it multiplies the fixed setup cost of a second source, including separate printing setup and separate colour standards, without adding meaningful protection. The right structure is a live split on the two or three critical items, a qualified backup across the remainder of the range, and a buffer stock concentrated on the single most exposed construction. This structure also gives you a clear internal story when you present the resilience budget to a finance stakeholder, because each layer has a measurable purpose.'],
  ['What happens to my artwork and screens if I move production to a second supplier?',
   'This has to be arranged in advance, because the transfer is blocked without it and discovering the problem during a disruption is the worst possible timing. The buyer should own the artwork files, the print screens or plates and the physical colour standard, and the agreement should require them to be returned or destroyed on written request rather than retained indefinitely. Most practical problems with transferring to a second supplier are not about the supplier being unwilling but about nobody having established who physically holds the tooling, in what condition, and how it gets shipped. Keep a registered copy of every print file in your own system, have the supplier mark every screen and strike-off with your reference, and ask for a photographic record of the tooling at the start of each production run so that the condition is documented before it matters. Suppliers who object to this arrangement are telling you something important about how they will treat your intellectual property in a dispute.']
];

// ---- 校验：正文 FAQ 必须与 JSON-LD 一致 ----
const artPath = path.join(ROOT, 'blog', `${SLUG}.html`);
let html = fs.readFileSync(artPath, 'utf8');

const norm = s => s.trim()
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/\u00a0/g, ' ');
const bodyFaqQs = [...html.matchAll(/<p class="faq-q">([\s\S]*?)<\/p>/g)].map(m => norm(m[1]));
const bodyFaqAs = [...html.matchAll(/<p class="faq-a">([\s\S]*?)<\/p>/g)].map(m => norm(m[1]));
if (bodyFaqQs.length !== FAQS.length || bodyFaqAs.length !== FAQS.length) {
  console.error(`FATAL: FAQ 数量不一致 正文=${bodyFaqQs.length}/${bodyFaqAs.length} jsonld=${FAQS.length}`);
  process.exit(1);
}
for (let i = 0; i < FAQS.length; i++) {
  if (bodyFaqQs[i] !== norm(FAQS[i][0]) || bodyFaqAs[i] !== norm(FAQS[i][1])) {
    console.error(`FATAL: FAQ #${i + 1} 正文与 JSON-LD 不一致`);
    console.error(`  body: ${bodyFaqQs[i].slice(0,80)}`);
    console.error(`  ld  : ${FAQS[i][0].slice(0,80)}`);
    process.exit(1);
  }
}
console.log(`✓ FAQ 正文与 JSON-LD 一致 (${FAQS.length} 条)`);

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

// ---- OG / Twitter 校验 ----
const ogTags = ['og:title', 'og:description', 'og:url', 'og:type', 'og:image'];
for (const t of ogTags) {
  if (!html.includes(`property="${t}"`)) { console.error(`FATAL: 缺少 ${t}`); process.exit(1); }
}
for (const t of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
  if (!html.includes(`name="${t}"`)) { console.error(`FATAL: 缺少 ${t}`); process.exit(1); }
}
console.log('✓ OG tags + Twitter Card 校验通过');

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
        "Custom ribbon supply chain resilience",
        "Dual sourcing for custom ribbon",
        "Ribbon supplier risk scoring",
        "MOQ split strategy for ribbon programmes",
        "Ribbon contingency planning",
        "Colour consistency across multiple ribbon suppliers"
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
if (idx.includes(`/blog/${SLUG}`)) {
  console.log('· blog/index.html 已含该文章卡片，跳过');
} else {
  const fgIdx = idx.indexOf('data-component="featured-guides"');
  if (fgIdx < 0) { console.error('FATAL: blog/index.html 找不到 featured-guides 区块'); process.exit(1); }
  const listIdx = idx.indexOf('<div class="news-list">', fgIdx);
  if (listIdx < 0) { console.error('FATAL: blog/index.html featured-guides 内找不到 news-list'); process.exit(1); }
  const cardIdx = idx.indexOf('<article class="news-card"', listIdx);
  if (cardIdx < 0) { console.error('FATAL: blog/index.html featured-guides 内找不到 news-card'); process.exit(1); }

  const card = `<article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon supply chain resilience, dual sourcing and supplier risk scoring for OEM buyers" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">14 min read</p>
          <h3 class="news-card__title">Custom Ribbon Supply Chain Resilience: A Multi-Sourcing Strategy Guide</h3>
          <p class="t-body-sm muted-text">How to build a resilient custom ribbon supply chain &#8212; dual sourcing, splitting MOQs across suppliers, risk scoring, contingency planning and colour consistency.</p>
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
