#!/usr/bin/env node
// update-sitemap.js — 向 sitemap.xml 追加新文章 URL，并保证 0 重复 URL
const fs = require('fs');
const path = require('path');

const P = path.join(__dirname, 'sitemap.xml');
const SLUG = 'custom-ribbon-labelling-compliance-requirements-guide';
const LOC = `https://msdribbon.com/blog/${SLUG}`;
const LASTMOD = '2026-11-17';

let s = fs.readFileSync(P, 'utf8');

const locs = [...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const dupes = locs.filter((l, i) => locs.indexOf(l) !== i);
if (dupes.length) {
  console.error('existing duplicate locs detected:', dupes);
  process.exit(1);
}
console.log('before: total', locs.length);

if (s.includes(LOC)) {
  console.log('sitemap already contains', LOC);
} else {
  const entry = `    <url>
        <loc>${LOC}</loc>
        <lastmod>${LASTMOD}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
`;
  // 插入到 </urlset> 之前
  const idx = s.lastIndexOf('</urlset>');
  if (idx === -1) { console.error('</urlset> not found'); process.exit(1); }
  s = s.slice(0, idx) + entry + s.slice(idx);
  fs.writeFileSync(P, s, 'utf8');
  console.log('inserted', LOC);
}

// 校验
const s2 = fs.readFileSync(P, 'utf8');
const l2 = [...s2.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const d2 = l2.filter((l, i) => l2.indexOf(l) !== i);
console.log('after: total', l2.length, '| dupes', d2.length);
console.log('new url present:', l2.includes(LOC));
console.log('lastmod values:', [...new Set([...s2.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m => m[1]))].sort());
