#!/usr/bin/env node
// build-article.js — 注入 JSON-LD / 更新 blog/index.html / sitemap.xml / _routes.txt
const fs = require('fs');
const path = require('path');

const ROOT = '/workspace/new-site';
const SLUG = 'custom-ribbon-colour-matching-pantone-guide';
const URL = `https://msdribbon.com/blog/${SLUG}`;
const DATE = '2026-11-02';
const IMG = 'https://msdribbon.com/assets/images/cat-satin-ribbons.jpg';
const TITLE_FULL = 'Custom Ribbon Colour Matching: A Pantone Guide for OEM Buyers';
const DESC = 'How custom ribbon colour matching works: Pantone vs dye matching, lab dips, Delta E tolerance, dye lots and colour continuity for repeat orders.';

// ---- FAQ (与正文一致) ----
const FAQS = [
  ['What is the difference between Pantone matching and dye matching for custom ribbon?',
   'Pantone matching means reproducing a specific Pantone reference, and it is the right approach when your design is defined by a brand palette, when the ribbon must sit alongside printed packaging, tissue or cards from the same production run, or when you need the same colour across several different suppliers or materials. Dye matching, sometimes called colour development or custom dyeing, means creating a new shade from a colour description or a physical reference without a formal Pantone index. It is the right approach when you are matching an existing product, a competitor sample, a photograph, or a colour that simply does not exist in any Pantone book. In practice a Pantone match is technically easier to repeat because both sides are working from the same defined target, while a dye match is a negotiation and usually needs a physical reference to be sent to the factory.'],
  ['What colour tolerance should I specify for a custom ribbon order?',
   'Most experienced buyers specify colour acceptance in terms of a Delta E value measured with a spectrophotometer, and the figure depends on how visible the ribbon is and how critical the match is. For a functional or generic ribbon where the colour is decorative, Delta E of 1.5 to 2.0 is normally acceptable. For a brand colour on a premium satin ribbon that must match printed packaging, Delta E below 1.0 is a reasonable target. For a large-volume programme where the colour must hold across repeat orders, many buyers set the limit at Delta E 1.0 and ask for a colour continuity guarantee. Important context: a Delta E reading is measured under a specific light source and geometry, so the number is meaningless unless the standard and the instrument are specified. Ask for readings under D65 or TL84 as the industry default, and always ask for the readings to be taken on the actual ribbon surface rather than on the printed proof, because the finish of a satin ribbon changes how it reflects light.'],
  ['Why does the colour of my ribbon shift between production runs?',
   'Almost always because of dye lot variation. Ribbon is produced in dye lots, and each lot is a separate batch of dye with its own small chemical and thermal variation. Within one lot the colour is consistent to a very tight tolerance, which is why a factory can hold colour across a single run, but a different lot may read slightly differently. This is normal in textiles and is why experienced buyers always order against a sealed physical standard rather than against a photograph or a Pantone chip alone. Three practices reduce the problem: always order against a sealed swatch or an approved bulk sample rather than a Pantone book chip, request the same dye lot across the order where the volume and timeline allow it, and ask the factory to reserve a length of production ribbon from each lot as a retention sample so that a later reorder can be matched against the exact cloth that shipped.'],
  ['Do I need a lab dip, and what is the difference between a lab dip and a bulk sample?',
   'A lab dip, or strike-off, is a small hand-dyed sample of yarn or fabric used to develop a colour before you commit to a full dyeing run. It is the standard first step for a custom dye match and it is cheap and fast, usually taking three to seven days. A bulk sample is a length of ribbon woven and finished from an actual production dye lot, so it shows the real colour together with the real finish, the real width and the real handle of the material. A lab dip tells you whether the dye recipe is right; a bulk sample tells you what the finished ribbon actually looks like, and the two are not always identical because weaving, calendaring, sizing and the surface finish all affect the final appearance. For a new Pantone match, experienced buyers approve the lab dip first to confirm the direction of the shade, then approve a bulk sample before the full production run.'],
  ['How long does custom ribbon colour matching take?',
   'A lab dip for a new custom colour typically takes three to seven working days from the receipt of your reference, plus transit time if a physical swatch has to be sent to the factory. A bulk sample then takes a further five to ten days because the dye lot must be produced, the ribbon woven, and the finish applied. If the colour is being matched to an existing Pantone reference, the lab dip can often be removed from the sequence and the first step becomes a production sample, which saves roughly a week. Add 15 to 20 percent buffer to these figures for a first programme with an unfamiliar material, because some shades behave differently on satin than on organza, some shift on velvet because of the pile direction, and some react differently to a metallic or pearlescent finish.'],
  ['Will a Pantone number alone be enough to get the exact colour I need?',
   'No, and this is the single most common source of colour disappointment in ribbon sourcing. A Pantone reference is defined for a specific coated or uncoated paper stock under a specific light source, and ribbon is neither paper nor a flat surface. Satin ribbon has a specular sheen that shifts the perceived colour depending on the angle of view, organza is translucent so the background shows through, velvet has a directional pile that reverses from light to dark, and a metallic finish adds a base tone underneath. The reliable practice is to treat the Pantone number as the starting point and the physical ribbon as the standard. Ask the factory to wet a sample of the actual ribbon with the target Pantone chip so you can compare them side by side under the same light, and approve a bulk sample as the sealed colour standard that all future orders are checked against.'],
  ['What happens if I need the same colour across several different ribbon types?',
   'This is a common requirement in a coordinated gift or seasonal programme, where the same shade has to appear on satin ribbon, grosgrain ribbon, organza, velvet and a printed card, and the shopper compares them together in the bag. Each of those materials reflects light differently, so achieving an identical perceived colour across all of them is not simply a matter of using one dye lot. The workable approach is to develop the colour once against the most critical material, usually the largest-area material in the pack, and then adjust each secondary material to the same perceived colour rather than to the same measured value. Ask the factory for a coordinated swatch board showing all materials together under one light source, and set your approval against that board rather than against each material in isolation. Budget more development time and a higher tolerance on the secondary materials, because forcing an identical measured value across a velvet and an organza can leave both looking wrong.']
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
        "Custom ribbon colour matching",
        "Pantone matching for ribbon",
        "Lab dip and strike-off",
        "Delta E colour tolerance",
        "Dye lot consistency",
        "Colour continuity on reorders"
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
const marker = '<div class="news-list">\n      <article class="news-card" data-component="article-card">\n        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Hand-tied custom ribbon bows packed for export from an OEM ribbon bow manufacturer in Xiamen, China"';
if (!idx.includes(marker)) { console.error('FATAL: blog/index.html 锚点未找到'); process.exit(1); }

const card = `<div class="news-list">
      <article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Custom ribbon colour swatches and dye-lot samples from a ribbon manufacturer in Xiamen, China" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">14 min read</p>
          <h3 class="news-card__title">Custom Ribbon Colour Matching: A Pantone Guide for OEM Buyers</h3>
          <p class="t-body-sm muted-text">How ribbon colour is actually specified &#8212; Pantone versus dye matching, lab dips and bulk samples, Delta E tolerances, dye-lot continuity and the sealed colour standard behind every repeat order.</p>
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
