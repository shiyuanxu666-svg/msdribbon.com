#!/usr/bin/env node
// build-article-durability.js — 注入 JSON-LD / 更新 blog/index.html / sitemap.xml / _routes.txt
const fs = require('fs');
const path = require('path');

const ROOT = '/workspace/new-site';
const SLUG = 'custom-ribbon-print-durability-colorfastness-testing-guide';
const URL = `https://msdribbon.com/blog/${SLUG}`;
const DATE = '2026-11-10';
const IMG = 'https://msdribbon.com/assets/images/cat-satin-ribbons.jpg';
const TITLE_FULL = 'Custom Ribbon Print Durability: Colorfastness, Rub-Fastness and Print Adhesion Testing for OEM Buyers';
const DESC = 'Custom ribbon print durability and colorfastness guide for OEM buyers: rub-fastness, wash and lightfastness, print adhesion tests and how to write test clauses.';

// ---- FAQ (与正文一致) ----
const FAQS = [
  ['What is the difference between rub-fastness and crocking when testing printed ribbon?',
   'They are related but not identical, and the distinction matters when you write the requirement. Rub-fastness is the general term for testing how much colour transfers from the ribbon to an adjacent white cloth when the two surfaces are rubbed together under a defined load for a defined number of strokes, and it is commonly performed in both dry and wet variants. Crocking more specifically refers to the transfer of colour to an adjacent surface in ordinary handling, and the term is used loosely in commercial conversation to mean the same practical behaviour. The reason to distinguish them in a purchase order is that dry and wet rub are genuinely different tests and only one of them may be relevant to your use. A ribbon on a gift box needs dry rub. A ribbon worn against skin or hand-washed needs wet rub, which is the stricter test. If the requirement simply says rub-fastness with a grade and no dry or wet condition, a supplier and a laboratory may interpret it differently, and you lose the ability to compare results over time.'],
  ['Which durability test does a custom ribbon actually need for a gift packaging application?',
   'For a ribbon that wraps or decorates a boxed gift and is handled in dry household conditions, dry rub-fastness is the primary requirement, along with reasonable general colourfastness and adequate print adhesion so that the design survives being tied, untied and handled. Wash fastness is largely irrelevant for a ribbon that will never be laundered, and lightfastness only matters if the gift is displayed in a lit retail window for a sustained period. A useful additional check for packaged goods is a bleed or staining test against the packaging material, because a ribbon that transfers colour onto a white card or a tissue wrap generates complaints about the presentation even though the ribbon itself has passed every test that was specified. The common mistake is over-specifying, ordering a full panel of tests for an application that only experiences one or two stresses, and paying for assurance that tells you nothing.'],
  ['How do I specify colourfastness requirements for a printed ribbon without over-complicating the purchase order?',
   'Name the method, the condition and the threshold, in that order, and add the sampling plan. For example, wet rub-fastness to a named standard with a stated number of strokes, graded to a stated value on a stated scale, tested on specimens drawn from the bulk production run at a stated sampling rate, with a stated procedure for retesting a failed lot. If you are not certain of the correct condition, it is more effective to state the intended end use and require the supplier to propose the method, since the supplier holds the process knowledge about what is achievable on a given construction, and this still produces a written and testable requirement. The single most important thing is that the requirement be specific enough that two different laboratories would run the same test, because a threshold without a method cannot be defended or meaningfully compared.'],
  ['Does testing the approval sample tell me anything about the bulk production?',
   'It tells you about the approval sample, which is a useful but limited result. Approval samples are typically produced on a small piece of equipment or in a small lot, sometimes with a different print system or a slightly different finishing route than the bulk run, and they are frequently selected because they are good examples of the target. A strike-off that passes every test tells you that the colour and construction are right and that the process is capable, which is a genuine and important result, but it does not confirm that three thousand metres produced over three weeks on a different machine met the same standard. The reliable practice is to draw test specimens from the bulk production itself, taken from the beginning, the middle and the end of the run, and to test those. Where the programme justifies it, we recommend testing bulk production before shipment rather than on receipt, since the point of testing is to prevent a problem reaching the customer, not to document it afterwards.'],
  ['Can a print that passes adhesion testing still fail after the ribbon is made into a bow?',
   'Yes, and it is a common cause of field failures. Adhesion is tested on a flat strip of ribbon, but assembly concentrates stress. Folding the ribbon into a bow creates a sharp curvature and puts the print under tension on the outer radius, and the edge finishing operation that seals the raw edge of a woven ribbon uses heat and sometimes a hot blade, both of which can degrade an ink film that passed a flat-strip test. Tying and untying repeatedly puts a flexing cycle through the print at exactly the point where the ribbon turns. This is why it is worth asking a supplier who makes both flat ribbon and finished bows whether the print has been tested in the assembled form. It also means the assembly method and the materials used in it belong in the specification, because the print is only as durable as the weakest step in the process that assembles it.'],
  ['What does wash fastness tell me about a ribbon used as a garment trim?',
   'Wash fastness tells you how well the print and the base colour survive laundering, and for a garment trim that is one of the most important tests you can specify. The result is only meaningful when the wash condition is stated, because a wash at 30 degrees with a mild detergent and a wash at 60 degrees with a strong detergent are different tests with different outcomes, and the ribbon should be required to survive the condition that the finished garment will actually be laundered under. Whether the ribbon is washed alone or with other garments also changes the result, since the tumbling and soiling of a mixed load is a harsher and more realistic environment for a trim than an isolated specimen. If the garment will be ironed, specify that separately, because heat from an iron is a distinct stress on the print that a wash test does not capture, and it is a frequent failure point on woven trims and printed ribbons applied to apparel.'],
  ['Is RPET recycled polyester ribbon as durable as virgin polyester ribbon for printed applications?',
   'In general it is, and there is no need to assume a performance penalty. RPET ribbon is made from recovered and recycled polyester, and the fibre chemistry and the resulting filament properties are comparable to virgin polyester, so colourfastness and print adhesion performance are essentially equivalent when the same yarn, the same dye route and the same print system are used. The variables that actually determine durability are the construction, the dye quality, the print method and the substrate finish, and these are independent of whether the feedstock is recycled. What recycled material does change is the story behind the product, which matters for brands with a sustainability commitment and for market access requirements in some jurisdictions. At MSD Ribbon we produce RPET alongside conventional polyester, and we would note that the durability conversation for an RPET programme is the same as for a conventional one: the use conditions determine the specification, and the construction determines what is achievable.'],
  ['How often should custom ribbon be durability tested during an ongoing production programme?',
   'Test the bulk production of every lot, because this is the test that has commercial value, and it does not need to be an expensive process if the sampling plan is agreed in advance. For an established programme with a stable construction and a proven print method, testing the first roll of each production run plus additional specimens drawn at defined intervals through the run is normally sufficient, since the purpose is to detect a change in the process rather than to re-characterise a material whose characteristics are already known. A more demanding regime is appropriate when something has changed, whether that is the dye lot, the print system, the base fabric source, the finishing route or the physical construction, and in that case the first run after the change should be tested more comprehensively. The key discipline is that the testing plan is written into the purchase order, so the sampling rate, the methods and the thresholds are all agreed before the goods are made rather than negotiated when a result is in dispute.'],
  ['Who should pay for durability testing when a bulk order fails the agreed standard?',
   'The default position should be that the supplier bears the cost of retesting, because the requirement was agreed in writing before production and the goods did not meet it. That is why the retest procedure needs to be set out in the purchase order rather than left to be worked out afterwards. The purchase order should specify the procedure to be followed when a result fails, which includes a retest on new specimens drawn from the same lot using the same methods, the point at which the result is deemed final, and the disposition of the lot, which is normally replacement or credit rather than acceptance. Where the failure turns out to be attributable to something outside the supplier\'s control, such as an error in the specification that was corrected mid-production, the position can reasonably be different, and the purchase order is the place to set the mechanism for handling that situation. What should never happen is a dispute about who pays for the test, because that argument stops the two parties from dealing with the issue that actually matters, which is why the supply of ribbons by a compliant factory through a properly written specification is the cheapest form of insurance available to a buyer in this category.'],
  ['What should a buyer do when a durability failure is discovered after the ribbon has already been assembled into finished bows?',
   'Separate the question of what to do about the current delivery from the question of what to change for the next one, because mixing them leads to a poor outcome for both parties. For the current delivery, establish whether the failure is a materials defect, a process defect or a specification gap, and this is done by testing the remaining bulk ribbon against the same agreed methods rather than by examining the finished bows alone, since a failure that appears on the finished product but not on the flat ribbon points to assembly as the cause. Any credit, replacement or rework should then follow from that finding. For the next delivery, the corrective action depends entirely on the cause. A materials defect calls for a change of dye lot or base fabric, a process defect calls for tightening control at the printing or finishing step, and a specification gap means the requirement was never written down and needs to be formalised. Recording which of the three applies is what stops the same failure recurring on the following order.']
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
    console.error(`  body: ${bodyFaqQs[i].slice(0, 100)}`);
    console.error(`  ld  : ${FAQS[i][0].slice(0, 100)}`);
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
for (const t of ['og:title', 'og:description', 'og:url', 'og:type', 'og:image']) {
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
        "Custom ribbon print durability testing",
        "Ribbon colorfastness standards",
        "Rub-fastness and crocking testing",
        "Printed ribbon wash fastness",
        "Print adhesion testing for ribbon",
        "OEM ribbon quality control"
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
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon print durability, colorfastness and rub-fastness testing guide for OEM buyers" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">15 min read</p>
          <h3 class="news-card__title">Custom Ribbon Print Durability: Colorfastness and Rub-Fastness Testing Guide</h3>
          <p class="t-body-sm muted-text">How to specify and verify printed ribbon durability &#8212; rub-fastness, wash and lightfastness, print adhesion, test reports and purchase order clauses.</p>
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
