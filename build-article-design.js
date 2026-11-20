#!/usr/bin/env node
// build-article-design.js — 生成「Custom Ribbon Design & Decoration Options」B2B 文章
// 正文与 FAQ 从独立数据文件读取，避免模板字符串转义问题。
const fs = require('fs');
const path = require('path');

const SLUG = 'custom-ribbon-design-decoration-options-guide';
const SITE = 'https://msdribbon.com';
const URL = `${SITE}/blog/${SLUG}`;
const DATE = '2026-11-20T08:20:00+00:00';

const TITLE = 'Custom Ribbon Design and Decoration Options Guide for OEM Buyers';
const OG_TITLE = 'Custom Ribbon Design and Decoration Options: A Guide for OEM Buyers';
const DESC = 'Custom ribbon design and decoration options guide for OEM buyers: materials, print and foil methods, bow construction, edge finishing and prototyping stages.';

const BODY = fs.readFileSync('/tmp/design_body.html', 'utf8');
const FAQ = JSON.parse(fs.readFileSync('/tmp/design_faq.json', 'utf8'));

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
        'Custom ribbon design brief for manufacturers',
        'Ribbon decoration and finishing options',
        'Custom bow construction methods',
        'Screen print vs heat transfer vs digital',
        'Edge finishing and die cutting',
        'Prototype development stages',
        'Ribbon specification writing',
        'OEM ribbon sourcing guide'
      ],
      wordCount: 4200
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
    <meta property="article:tag" content="ribbon design and decoration">
    <meta property="article:tag" content="custom bow construction">
    <meta property="article:tag" content="screen printing vs heat transfer">
    <meta property="article:tag" content="ribbon edge finishing">
    <meta property="article:tag" content="die cut ribbon shapes">
    <meta property="article:tag" content="ribbon prototyping stages">
    <meta property="article:tag" content="ribbon specification writing">
    <meta property="article:tag" content="OEM sourcing guide">
</head>
    <meta name="google-site-verification" content="BYcK-w4SYVEjTT9PHjXBP_KeIBrGtAr9rSXwwJrlNJo" />
    <meta name="msvalidate.01" content="ECF29653135740CD77EEF5074F931DF4" />

    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
    </script>

    <article>
        <h1>Custom Ribbon Design and Decoration Options: A Guide for OEM Buyers</h1>
${BODY}

        <h2>FAQ — Custom ribbon design and decoration options for OEM buyers</h2>
${faqHtml}
        </article>
</body></html>
`;

const OUT = path.join(__dirname, 'blog', `${SLUG}.html`);
fs.writeFileSync(OUT, html, 'utf8');

const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const words = text.split(' ').filter(w => /[A-Za-z0-9]/.test(w)).length;
console.log('written:', OUT);
console.log('bytes:', fs.statSync(OUT).size);
console.log('approx words:', words);
console.log('FAQ count:', FAQ.length);
console.log('desc length:', DESC.length);
