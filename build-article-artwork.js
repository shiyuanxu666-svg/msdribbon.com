#!/usr/bin/env node
// build-article-artwork.js — 生成「Custom Ribbon Artwork & Prepress Proofing Guide」B2B 文章
// 正文与 FAQ 从独立数据文件读取，避免模板字符串转义问题。
const fs = require('fs');
const path = require('path');

const SLUG = 'custom-ribbon-artwork-prepress-proofing-guide';
const SITE = 'https://msdribbon.com';
const URL = `${SITE}/blog/${SLUG}`;
const DATE = '2026-11-24T08:20:00+00:00';

const TITLE = 'Custom Ribbon Artwork & Prepress Proofing Guide | Custom Ribbon Manufacturer | MSD Ribbon';
const OG_TITLE = 'Custom Ribbon Artwork and Prepress Proofing: A Buyer Guide to Print-Ready Files, Dielines and Strike-Offs';
const DESC = 'Custom ribbon artwork and prepress proofing guide for OEM buyers: print-ready files, dielines, repeat length, Pantone colour approval, strike-offs and reorders.';

const BODY = fs.readFileSync('/tmp/artwork_body.html', 'utf8');
const FAQ = JSON.parse(fs.readFileSync('/tmp/artwork_faq.json', 'utf8'));

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
        'Custom ribbon artwork preparation',
        'Print-ready ribbon files',
        'Ribbon dieline specification',
        'Ribbon repeat length',
        'Pantone colour approval for ribbon',
        'Ribbon strike-off proofing',
        'Hot foil artwork preparation',
        'Custom ribbon manufacturer'
      ],
      wordCount: 3800
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
    <meta property="article:tag" content="custom ribbon artwork">
    <meta property="article:tag" content="ribbon prepress">
    <meta property="article:tag" content="print-ready ribbon files">
    <meta property="article:tag" content="ribbon dieline">
    <meta property="article:tag" content="ribbon repeat length">
    <meta property="article:tag" content="Pantone colour approval ribbon">
    <meta property="article:tag" content="ribbon strike-off">
    <meta property="article:tag" content="hot foil artwork ribbon">
    <meta property="article:tag" content="OEM ribbon sourcing">
</head>
    <meta name="google-site-verification" content="BYcK-w4SYVEjTT9PHjXBP_KeIBrGtAr9rSXwwJrlNJo" />
    <meta name="msvalidate.01" content="ECF29653135740CD77EEF5074F931DF4" />

    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>

    <article>
        <h1>Custom Ribbon Artwork and Prepress Proofing: A Buyer Guide to Print-Ready Files, Dielines and Strike-Offs</h1>
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
