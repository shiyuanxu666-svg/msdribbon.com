#!/usr/bin/env node
// build-article-moq.js — 生成「Custom Ribbon MOQ & Volume Pricing」B2B 文章
// 正文与 FAQ 从独立数据文件读取，避免模板字符串转义问题。
const fs = require('fs');
const path = require('path');

const SLUG = 'custom-ribbon-moq-volume-pricing-order-tiers-guide';
const SITE = 'https://msdribbon.com';
const URL = `${SITE}/blog/${SLUG}`;
const DATE = '2026-11-23T08:20:00+00:00';

const TITLE = 'Custom Ribbon MOQ & Volume Pricing Guide | Custom Ribbon Manufacturer | MSD Ribbon';
const OG_TITLE = 'Custom Ribbon MOQ and Volume Pricing: A Buyer Guide to Order Tiers and Cost per Unit';
const DESC = 'Custom ribbon MOQ and volume pricing guide for OEM buyers: order tiers, price break points, negotiation levers, hidden costs and quotation comparison.';

const BODY = fs.readFileSync('/tmp/moq_body.html', 'utf8');
const FAQ = JSON.parse(fs.readFileSync('/tmp/moq_faq.json', 'utf8'));

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      '@id': `${URL}#article`,
      headline: OG_TITLE,
      description: DESC,
      url: URL,
      mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
      datePublished: DATE,
      dateModified: DATE,
      inLanguage: 'en',
      image: `${SITE}/og-image.jpg`,
      author: { '@id': `${SITE}/#organization` },
      publisher: { '@id': `${SITE}/#organization` },
      about: [
        'Custom ribbon minimum order quantity',
        'Ribbon volume pricing and order tiers',
        'Ribbon quantity break points',
        'MOQ negotiation for ribbon buyers',
        'Cost per finished unit for ribbon',
        'Comparing ribbon quotations',
        'Volume break contracts for ribbon',
        'Custom ribbon manufacturer'
      ],
      wordCount: 3600
    },
    {
      '@type': 'FAQPage',
      '@id': `${URL}#faq`,
      mainEntity: FAQ.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    }
  ]
};

const faqHtml = FAQ.map(f =>
  `            <div class="faq-item"><p class="faq-q">${f.q}</p><p class="faq-a">${f.a}</p></div>`
).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${TITLE}</title>
    <meta name="description" content="${DESC}">
    <link rel="canonical" href="${URL}">
    <link rel="alternate" hreflang="en" href="${URL}">
    <link rel="alternate" hreflang="x-default" href="${URL}">
    <meta property="og:title" content="${OG_TITLE}">
    <meta property="og:description" content="${DESC}">
    <meta property="og:url" content="${URL}">
    <meta property="og:type" content="article">
    <meta property="og:image" content="${SITE}/og-image.jpg">
    <meta property="og:image:width" content="1424">
    <meta property="og:image:height" content="752">
    <meta property="og:image:alt" content="Xiamen Meisida Decoration Co., Ltd. - custom ribbon and bow manufacturer in Xiamen, China">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${OG_TITLE}">
    <meta name="twitter:description" content="${DESC}">
    <meta name="twitter:image" content="${SITE}/og-image.jpg">
    <meta property="article:published_time" content="${DATE}">
    <meta property="article:modified_time" content="${DATE}">
    <meta property="article:author" content="Xiamen Meisida Decoration Co., Ltd.">
    <meta property="article:section" content="Sourcing Guides">
    <meta property="article:tag" content="custom ribbon manufacturer">
    <meta property="article:tag" content="custom ribbon MOQ">
    <meta property="article:tag" content="ribbon volume pricing">
    <meta property="article:tag" content="ribbon order tiers">
    <meta property="article:tag" content="ribbon quantity break points">
    <meta property="article:tag" content="MOQ negotiation ribbon">
    <meta property="article:tag" content="cost per unit ribbon">
    <meta property="article:tag" content="comparing ribbon quotations">
    <meta property="article:tag" content="OEM ribbon sourcing">
</head>
    <meta name="google-site-verification" content="BYcK-w4SYVEjTT9PHjXBP_KeIBrGtAr9rSXwwJrlNJo" />
    <meta name="msvalidate.01" content="ECF29653135740CD77EEF5074F931DF4" />

    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>

    <article>
        <h1>Custom Ribbon MOQ and Volume Pricing: A Buyer Guide to Order Tiers and Cost per Unit</h1>
${BODY}
        </article>
</html>
`;

const OUT = path.join(__dirname, 'blog', `${SLUG}.html`);
fs.writeFileSync(OUT, html, 'utf8');

// 同时生成目录形态 blog/<slug>/index.html（GitHub Pages clean URL 解析）
const DIR = path.join(__dirname, 'blog', SLUG);
fs.mkdirSync(DIR, { recursive: true });
fs.writeFileSync(path.join(DIR, 'index.html'), html, 'utf8');

const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const words = text.split(' ').filter(w => /[A-Za-z0-9]/.test(w)).length;
console.log('written:', OUT);
console.log('written:', path.join(DIR, 'index.html'));
console.log('bytes:', fs.statSync(OUT).size);
console.log('approx words:', words);
console.log('FAQ count:', FAQ.length);
console.log('desc length:', DESC.length);
console.log('title length:', TITLE.length);
