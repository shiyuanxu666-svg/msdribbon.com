#!/usr/bin/env node
// build-article-payment-terms.js — 注入 JSON-LD / 更新 blog/index.html / sitemap.xml / _routes.txt
const fs = require('fs');
const path = require('path');

const ROOT = '/workspace/new-site';
const SLUG = 'custom-ribbon-payment-terms-supplier-risk-guide';
const URL = `https://msdribbon.com/blog/${SLUG}`;
const DATE = '2026-11-08';
const IMG = 'https://msdribbon.com/assets/images/cat-satin-ribbons.jpg';
const TITLE_FULL = 'Custom Ribbon Payment Terms Guide: Securing Your Supply Beyond the Purchase Order';
const DESC = 'Custom ribbon payment terms guide for OEM buyers: deposit structures, L/C vs T/T, inspection milestones, IP protection and how to reduce supplier risk.';

// ---- FAQ (与正文一致) ----
const FAQS = [
  ['What are the standard payment terms for custom ribbon orders from a China manufacturer?',
   'The most common structure for custom ribbon is a deposit of 30% on order with the balance of 70% payable against inspection and before shipment, typically linked to the copy bill of lading. Full prepayment is offered by some suppliers and is the least favourable position for a first-time buyer, because it removes every lever before the goods have been verified. Irrevocable letters of credit at sight are available where the buyer’s bank and country permit them and typically add one to three percent in fees, while open account terms of 30 to 90 days are usually only granted after a trading history. The structure a buyer should aim for on a first order is a deposit proportionate to the work actually committed, with the balance tied to a verifiable inspection milestone rather than to a calendar date.'],
  ['How much deposit should I pay for a first custom ribbon order?',
   'A deposit in the range of 20% to 30% is defensible for a first order, because it covers the genuinely non-recoverable elements of the transaction, which are the fibre or film stock, the dye batch at its minimum quantity and the print setup or screen. A 100% deposit before artwork approval and before a physical sample has been seen commits the buyer to the factory’s risk rather than sharing it, and is difficult to justify. A deposit above 50% needs a specific explanation, such as a large material minimum or a fully bespoke fibre, and should be negotiated against a clear statement of what it funds. The number that is defensible falls as the relationship develops and rises for genuinely custom constructions with high material minimums.'],
  ['Should I use a letter of credit for ribbon, and does it protect me against quality problems?',
   'A letter of credit protects the payment event, not the product. If the shipping documents conform, the supplier is paid regardless of whether the ribbon in the container matches the approved sample. To obtain real protection you need the L/C combined with a pre-shipment inspection clause that allows the buyer to withhold release of the documents or the balance when the goods fail inspection, and with a written remedy for non-conforming goods. Buyers should also understand that an L/C is a documentary instrument, so a trivial discrepancy such as a differently formatted date or a differently spelled port name can block presentation and delay payment. For most buyers at moderate order values, a staged payment tied to third-party inspection is simpler, cheaper and gives stronger protection than an L/C alone.'],
  ['When should the balance be paid relative to inspection of the ribbon?',
   'The balance should always be payable after the goods have passed inspection and before shipment, never before. A buyer cannot inspect goods that have already been paid for and sealed into a container, so inspection is only meaningful if it happens before the money moves. The workable arrangements are a pre-shipment inspection attended by a third-party agency appointed by the buyer, with the balance released against the inspection report and shipping documents, or where a full inspection is impractical, a partial holdback until the goods are inspected on arrival at the buyer’s warehouse. Whatever route is chosen, the standard, the sample size and the claims window must all be defined in writing, otherwise the inspection will not bind anyone when it matters.'],
  ['Who owns the printed screens, plates and artwork files used for my custom ribbon?',
   'As a matter of good practice and in most well-drafted supply agreements, the buyer owns the artwork, the design files, the screens, plates and samples made from the buyer’s design, and the supplier holds them solely to produce the buyer’s goods. The agreement should require them to be returned or destroyed on written request and should cover subcontractors, since a substantial share of printing and finishing in this industry is subcontracted. In practice the most common failure is not deliberate misuse but accidental reproduction, where a leftover screen runs on another customer’s order, so buyers should require their reference to be marked on every physical sample, screen and strike-off and should require a photographic record of the tooling at the start of production.'],
  ['What should I do if my ribbon supplier changes their bank account details?',
   'Verify the change out of band before acting on it. Call a telephone number that the supplier has used previously and that is already held on file, never a number supplied in the change request itself, and confirm the new account details, the entity name and the reason for the change with a known contact. Requesting a change of bank account is precisely the mechanism used in business email compromise fraud, which has caused heavy losses to importers in this sector, and it is a simple step that prevents most of that exposure. A legitimate supplier will not object to a verification call, because a legitimate supplier does not change bank accounts frequently. If the explanation given is a change of trading entity, require the new entity’s business licence and verify it independently before any payment is made to it.'],
  ['How do I write a claim if the ribbon I received does not match the approved sample?',
   'Act inside the claims window, which should be defined in days and should be long enough to cover the point at which the ribbon enters your own production or retail process rather than just the date the carton is opened. Report the defect in writing, quantify the affected quantity against the packing list, and provide photographic evidence that shows the ribbon against a scale reference and, where possible, the approved sample held in the same frame. Then rely on the agreed remedy, which for most buyers should be replacement of the non-conforming goods as the first option, followed by credit against a future order, then rework where the fault is correctable, with a refund reserved for goods that cannot be used at all. Define a de minimis threshold in advance, typically around one percent of order value, below which the remedy is a credit rather than replacement, because replacing a small quantity of ribbon costs more in freight than the value of the ribbon.'],
  ['What should a written supply agreement with a ribbon manufacturer cover?',
   'Twelve elements cover most of the risk in a custom ribbon relationship: the legal entities and the specification including the approved sample as the reference standard, the measurable quality tolerances and inspection standard, the required in-stock date with milestone schedule and remedy for delay, the payment structure with trigger events and currency, the inspection and claims regime including evidence and thresholds, intellectual property ownership and confidentiality with a subcontractor flow-down, notification of any change to fibre source or dye house or production line, the required certifications, a defined scope for force majeure, the order of remedies for non-conformance, term and termination including the treatment of open orders, and the governing law and dispute resolution route. The two clauses buyers most often omit are tooling ownership and notification of source changes, and they are the two that most often matter in a made-to-order trim business.'],
  ['Will payment terms improve once I have a trading history with a ribbon supplier?',
   'They should, and the progression is a useful signal in both directions. On a first order a supplier’s exposure is at its maximum and a 30% deposit tied to inspection is the reasonable market position. Once a construction has been approved and an inspection has passed, a well-managed supplier will accept a lower deposit, a longer production window and better terms, and this is the natural moment to formalise the agreement now that both sides understand each other. On an established relationship terms should improve again to a deposit of 20% or less with open account terms at 30 days. A supplier that will not improve terms as the relationship matures is either carrying unmanaged risk or has no incentive to improve its service, and it is better to learn that early than at the point where you depend on them. A supplier that also responds constructively to a genuine defect claim has demonstrated something rarer: that the relationship can absorb a problem.']
];

// ---- 校验：正文 FAQ 必须与 JSON-LD 一致 ----
const artPath = path.join(ROOT, 'blog', `${SLUG}.html`);
let html = fs.readFileSync(artPath, 'utf8');

// 归一化：统一弯引号/直引号，避免排版字符差异导致误判
const norm = s => s.trim()
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/ /g, ' ');
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
        "Custom ribbon payment terms",
        "Custom ribbon manufacturer contracts",
        "Ribbon supplier risk reduction",
        "Letter of credit versus T/T for ribbon",
        "Pre-shipment inspection for ribbon orders",
        "Ribbon tooling and artwork ownership"
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
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon payment terms, contracts and supplier risk for OEM buyers" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">13 min read</p>
          <h3 class="news-card__title">Custom Ribbon Payment Terms Guide: Securing Your Supply Beyond the Purchase Order</h3>
          <p class="t-body-sm muted-text">How ribbon payment terms really work: deposit structures, L/C vs T/T, linking payment to inspection, IP protection and reducing supplier risk.</p>
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
