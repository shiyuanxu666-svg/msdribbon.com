#!/usr/bin/env node
// build-article-material.js — 注入 JSON-LD / 更新 blog/index.html / sitemap.xml / _routes.txt
const fs = require('fs');
const path = require('path');

const ROOT = '/workspace/new-site';
const SLUG = 'custom-ribbon-material-selection-guide';
const URL = `https://msdribbon.com/blog/${SLUG}`;
const DATE = '2026-11-04';
const IMG = 'https://msdribbon.com/assets/images/cat-satin-ribbons.jpg';
const TITLE_FULL = 'Custom Ribbon Material Guide: How to Choose the Right Ribbon Construction for Your Product';
const DESC = 'Compare satin, grosgrain, organza, velvet, polypropylene and RPET ribbon for OEM packaging: hand feel, cost, MOQ, print methods and the applications each suits best.';

// ---- FAQ (与正文一致) ----
const FAQS = [
  ['Which ribbon material is best for premium gift packaging?',
   'Polyester satin is the usual answer for a premium gift box, because it combines the sheen that signals value with a drape that lets a bow sit and fall naturally, and it accepts screen print, foil, embroidery and jacquard decoration. Grosgrain is the alternative if your design depends on a crisp edge, a defined bow shape or a hand-wrapped look, and it usually costs less per metre, so the saving can be reinvested in colour or decoration. Velvet is the third option for winter, luxury and hair accessory programmes where a soft dense pile is the point of the product. The decision turns on whether the design needs drape, structure or depth rather than on the colour alone.'],
  ['What is the minimum order quantity for custom printed ribbon?',
   'MOQ for printed ribbon is normally 1,000 to 3,000 metres per colourway per design per width, though some constructions and some factories set higher figures, and woven jacquard typically starts higher than printed. The critical detail is that the MOQ applies per colourway and per design rather than to the order as a whole, so a brief with six colourways of one design at a 3,000 metre MOQ is an 18,000 metre programme, and six colourways of two designs is 36,000 metres. Always ask a supplier to state the MOQ definition explicitly in writing, and ask separately what the trial quantity is — many factories will accept a smaller first colourway even where their published printed MOQ is higher.'],
  ['Is RPET recycled ribbon as good as virgin polyester ribbon?',
   'Functionally and visually, yes. RPET is spun from recovered post-consumer PET and woven into the same constructions as virgin yarn, so it is available in satin, grosgrain, organza and velvet, and the ribbon looks and behaves the same, taking the same decoration methods. The practical differences are that recycled yarn supply is narrower so MOQ and lead time are longer, the stock colour palette is smaller, and saturated shades can show slightly more variation between dye lots than virgin yarn. That last point is managed through lot allocation and colour continuity checks, and it is worth raising at specification stage. If you intend to make a recycled-content claim, specify the recycled percentage and ask which certificate will be issued in your name.'],
  ['Can velvet ribbon be screen printed or hot foiled?',
   'Screen printing works on velvet but needs a soft, thick ink formulated to sit on the pile without flattening it, because conventional inks can read as a stiff patch on an otherwise soft surface. Hot foil is a poor choice on velvet, since the pile does not give the foil a flat, even surface to bond to and the result is patchy and prone to flaking. Jacquard weaving and embroidered appliqué are the more reliable decoration routes for velvet, and both often produce a richer result than printing. If your design requires metallic on velvet, the practical answer is to place the foil or metallic element on a separate grosgrain or satin backing ribbon behind the velvet, which is also a common construction for luxury gift sets.'],
  ['Which ribbon construction is the most cost-effective for promotional products?',
   'Polypropylene is normally the lowest cost per metre, particularly in the 10mm to 25mm widths typical of promotional and craft programmes, and it takes screen print and hot foil very well because the surface is smooth and holds ink with high adhesion. It is also waterproof, lightweight and available in metallic and holographic finishes that polyester does not replicate well. The trade-offs are that it does not drape like a textile and reads as a lower-tier material on premium packaging, and its kerbside recyclability is weak despite being technically recyclable. If the promotional item is disposable by design, polypropylene is the right answer; if it will be kept, an RPET satin usually costs little more and performs better.'],
  ['Why does grosgrain ribbon hold a bow shape better than satin?',
   'Grosgrain is a plain weave with a heavier weft yarn that creates a pronounced rib running across the width of the ribbon. That rib gives the ribbon a firm structure and a crisp cut edge, so it resists folding into itself and springs back after being tied. Polyester satin is a float weave with a smooth, untwisted surface face that has no such structure, so it drapes and folds fluidly, which is beautiful on a flat wrap but allows a tied bow to slump and soften over weeks of handling. If your programme is bow-led, grosgrain is usually the more durable choice; if it is wrap-led and the ribbon will hang in soft folds, satin is the better one.'],
  ['How do I specify ribbon so that quotes from different suppliers are comparable?',
   'Specify the construction by name rather than by feel, and add the technical details that determine the product: width in millimetres, the yarn or denier specification where relevant, the face and reverse characteristics, whether the ribbon is single-face or double-face, the decoration method and the number of colourways, the finishing (wired, edge-cut, heat-sealed, hemmed), the total metres per colourway, the required certifications, the packaging format and the delivery date. With those in place, quotes become genuinely comparable. If a supplier cannot state the yarn specification or the MOQ definition in writing, that is itself a useful signal about the depth of the quotation you are looking at.']
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
}

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
        "Ribbon material selection",
        "Satin vs grosgrain vs organza",
        "Velvet ribbon for packaging",
        "Polypropylene ribbon applications",
        "RPET recycled ribbon",
        "Ribbon construction comparison"
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
const marker = `<div class="news-list">
      <article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Ribbon yield calculation with roll lengths and metres per unit for OEM ribbon buyers"`;
if (!idx.includes(marker)) { console.error('FATAL: blog/index.html 锚点未找到'); process.exit(1); }

const card = `<div class="news-list">
      <article class="news-card" data-component="article-card">
        <div class="news-card__media"><img src="/assets/images/cat-satin-ribbons.jpg" alt="Satin, grosgrain, organza, velvet, polypropylene and RPET ribbon compared for OEM packaging decisions" width="800" height="800" loading="lazy" decoding="async"></div>
        <div class="news-card__body">
          <p class="news-card__meta">14 min read</p>
          <h3 class="news-card__title">Custom Ribbon Material Guide: Choosing the Right Construction</h3>
          <p class="t-body-sm muted-text">Satin, grosgrain, organza, velvet, polypropylene or RPET? Compare hand feel, cost per metre, MOQ, decoration methods and the applications each ribbon construction actually suits.</p>
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
