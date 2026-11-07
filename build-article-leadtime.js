#!/usr/bin/env node
// build-article-leadtime.js — 注入 JSON-LD / 更新 blog/index.html / sitemap.xml / _routes.txt
const fs = require('fs');
const path = require('path');

const ROOT = '/workspace/new-site';
const SLUG = 'custom-ribbon-lead-time-production-scheduling-guide';
const URL = `https://msdribbon.com/blog/${SLUG}`;
const DATE = '2026-11-07';
const IMG = 'https://msdribbon.com/assets/images/cat-satin-ribbons.jpg';
const TITLE_FULL = 'Custom Ribbon Lead Time Guide: Scheduling Production to Protect Your Launch Date';
const DESC = 'Custom ribbon lead time guide for OEM buyers: production scheduling, seasonal peak planning, sample-to-delivery timelines and how to protect your launch date.';

// ---- FAQ (与正文一致) ----
const FAQS = [
  ['How long does custom ribbon production take from order to delivery?',
   'A straightforward custom printed ribbon programme realistically takes ten to sixteen weeks from first contact to delivery, and considerably longer during peak season or with a bespoke fibre. That total breaks down into artwork and technical preparation of three to seven days, sampling and your approval of seven to twenty-one days, material sourcing and dyeing of ten to twenty-five days, weaving or base production of seven to fifteen days, printing and decoration of seven to fifteen days, finishing, inspection and packing of five to ten days, and ocean transit of twenty to forty days excluding customs on your side. A supplier offering four weeks end to end for a custom printed ribbon with an approved sample is excluding material sourcing or decoration from the quoted figure.'],
  ['Does lead time change during peak season for Christmas and holiday production?',
   'Yes, materially, and for two separate reasons. Capacity tightens because the same equipment and the same design team are running sampling requests alongside confirmed production orders, so slot availability becomes something the buyer has to negotiate rather than accept. Freight tightens at the same time, because ocean space from China to Europe and North America becomes scarce and expensive in the weeks before the festive shipping period, so a programme that is production-ready in mid-November can still be at sea in December. The practical advice is to have sampling complete and a firm purchase order placed well before the peak, typically between April and June for a December sell-in date, rather than ordering in September and asking for priority.'],
  ['What is the difference between production lead time and total order-to-delivery lead time?',
   'Production lead time is the period during which the goods are physically being made, and it is the number most often quoted because it is the easiest to answer from the production floor. It assumes all inputs are available, including yarn or film stock in the right colour, a completed dye batch, approved artwork and print setup, and packaging components in place. Total order-to-delivery lead time is the elapsed time from purchase order to goods being loaded onto a vessel, and it additionally includes artwork preparation, raw material sourcing, decoration scheduling, inspection, packing and inland transport to the port. Only the second number matters for inventory planning, because only it determines when the ribbon physically becomes available to you.'],
  ['How can I shorten the lead time on a custom ribbon order?',
   'The levers differ in how much they actually move the date. Accepting a stock colour over a bespoke dye usually helps most, because a new dye lot with a lab dip, a production dye and a drying cycle is often the longest single leg. Consolidating sample feedback into one round-trip decision with a named decision-maker typically saves one to two weeks per sample cycle. Ordering the repeat run before the first shipment helps because approved constructions run faster on the second order. Booking shipping space as soon as production is confirmed removes the vessel-booking risk that frequently turns finished goods into late deliveries. Air freight compresses the last leg fastest and at the highest cost, and it is appropriate only for genuine deadline recovery. It is worth noting that no factory can pull a programme forward without displacing somebody else’s production, which is why the marginal cost of rushing peaks in the busiest months.'],
  ['Should I order custom ribbon well before the seasonal season I need it for?',
   'Yes, and for most seasonal programmes the working answer is April to June for a December sell-in date. Beyond the factory’s own capacity, ordering early also lets you maintain buffer stock, because once a construction is approved the repeat order is faster, with material in stock and print setup already done. Buffer stock is the only reliable way to remove seasonal scheduling from your calendar, since it means a demand spike is met from inventory rather than from an expedited production slot. The exception is a programme with a genuinely uncertain demand profile, where holding buffer stock on a wide range of colours is more expensive than the schedule risk it covers, and where a smaller run ordered closer to the season makes more sense.'],
  ['Why does my ribbon supplier’s quoted lead time seem shorter than the actual schedule?',
   'Most often the quoted figure is production time only, excluding material sourcing, decoration, packing and transit. It may also assume your colour is one the factory runs regularly, when a unique shade requires a new dye lot and adds weeks, and it almost always assumes artwork is already approved, since that is the factory’s internal trigger for starting the clock. Finally, a quote made during the quiet season will be shorter than the same quote made in September, because the factory’s order book is genuinely different. The response is the same in each case: ask for a milestone plan with actual dates, ask which clock the quoted figure uses, and ask whether the colour is a stock dye or a new one, then have the quote re-confirmed against your required date.'],
  ['How do public holidays in China affect ribbon delivery schedules?',
   'They affect them more than most buyers expect, because the Chinese public holiday calendar reduces the working year in ways that are measured in weeks rather than days. The Spring Festival falls between January and February, moves each year, and closes factories for a period that effectively removes several weeks of capacity, with the effect propagating backwards into December and forwards into March because dye lots, print slots and shipping schedules all have to be re-planned around it. Golden Week in early October has a smaller but real effect, particularly on trucking and inland logistics. The practical implication for a buyer is that a December sell-in should be finished and shipped before the Spring Festival closure, and that lead time quotes spanning January and February should be treated as indicative until the dates are confirmed against the specific holiday calendar.'],
  ['What should a custom ribbon lead time commitment include in the purchase order?',
   'It should include the milestone dates themselves rather than a duration: artwork approval date, material or dye ready date, weaving completion, decoration completion, inspection, packing and vessel departure with estimated arrival. It should also separate the factory’s obligations from yours by naming the approval windows you are committed to, because the largest single source of slippage in most programmes is approval rather than production and a date that ignores this is not a real commitment. Add the inspection standard and a stated position on remedy for delay, since a commitment without consequences is an aspiration. Finally, confirm whether the date assumes a specific shipping method, since the ocean and air timelines differ by more than a month and the freight mode is frequently the largest single variable in the date.']
];

// ---- 校验：正文 FAQ 必须与 JSON-LD 一致 ----
const artPath = path.join(ROOT, 'blog', `${SLUG}.html`);
let html = fs.readFileSync(artPath, 'utf8');

// 归一化：统一弯引号/直引号，避免排版字符差异导致误判
const norm = s => s.trim()
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/ /g, ' ');
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
        "Custom ribbon lead time",
        "Ribbon production scheduling",
        "Seasonal ribbon peak planning",
        "Sample to delivery timeline",
        "Protecting a ribbon launch date",
        "OEM ribbon lead time negotiation"
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
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon production scheduling and lead time planning for OEM buyers" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">13 min read</p>
          <h3 class="news-card__title">Custom Ribbon Lead Time Guide: Scheduling Production to Protect Your Launch Date</h3>
          <p class="t-body-sm muted-text">How ribbon lead time is actually built: production scheduling, seasonal peak planning, sample-to-delivery timelines and how to get a committed date instead of an average.</p>
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
