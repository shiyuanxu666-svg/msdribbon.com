#!/usr/bin/env node
/**
 * patch_msd_structured_1120.js — 2026-11-20 GEO 实体图谱修复（msdribbon.com）
 * =============================================================================
 * 修 assets/structured-*.js（minify bundle）里的 JSON-LD 生成逻辑。
 *
 * 背景：MSD 的 JSON-LD 由 React 运行时注入（structured bundle），
 *      prerender.js 只是用 Chromium 抓渲染后的 DOM 快照写入 _prerendered/。
 *      → 改 _prerendered/ 会在下次 prerender 时被覆盖，**必须改 bundle 源头**。
 *
 * 修复项：
 *   F1  Organization p 节点缺 @id            → 补 `${r}/#organization`
 *   F2  Organization p 节点缺 sameAs         → 补官方社交档案（与已上线的 310 处一致）
 *   F3  Organization 缺 legalName/alternateName → 补法人全称 + 品牌别名
 *   F4  Article 的 publisher 仍是共享 p 对象 → 补 p 的 @id 串链（随 F1 自动生效）
 *
 * 硬约束（来自 MEMORY.md）：
 *   - patch minify bundle 必须用**完整精确串匹配**，匹配失败即报错退出（否则静默不生效）
 *   - 不改实体事实：MSD = 厦门美丝达 = since 2007
 */
const fs = require('fs');
const path = require('path');

const ASSETS = '/workspace/new-site/assets';

const SAME_AS = [
  'https://www.facebook.com/profile.php?id=61563794319911',
  'https://www.instagram.com/msd_ribbon_bow/',
  'https://www.linkedin.com/company/29466602/',
  'https://www.youtube.com/@MSDRibbonbow',
];

function findStructured() {
  const files = fs.readdirSync(ASSETS).filter(f => /^structured-.*\.js$/.test(f));
  if (files.length !== 1) {
    console.error(`[FAIL] 期望恰好 1 个 structured-*.js，实际 ${files.length}: ${files.join(', ')}`);
    process.exit(1);
  }
  return path.join(ASSETS, files[0]);
}

function main() {
  const file = findStructured();
  let src = fs.readFileSync(file, 'utf8');
  const orig = src;

  // ---------- F1/F2/F3: Organization p 节点 ----------
  const OLD_ORG = 'const p={"@type":"Organization",name:h,url:`${r}/`}';
  const NEW_ORG =
    'const p={"@type":"Organization","@id":`${r}/#organization`,name:h,' +
    'legalName:"Xiamen Meisida Decoration Co., Ltd.",' +
    'alternateName:["MSD Ribbon","Xiamen Meisida Decoration Co., Ltd."],' +
    'sameAs:[' + SAME_AS.map(u => JSON.stringify(u)).join(',') + '],' +
    'url:`${r}/`}';

  if (!src.includes(OLD_ORG)) {
    console.error('[FAIL] 未匹配到 Organization p 节点定义串 —— bundle 可能已变更，终止（不静默跳过）');
    console.error('  期望片段: ' + OLD_ORG);
    process.exit(1);
  }
  src = src.replace(OLD_ORG, NEW_ORG);
  console.log('[OK] F1/F2/F3 Organization: 补 @id + legalName + alternateName + sameAs');

  // ---------- F4: Article 的 mainEntityOfPage / publisher 串链 ----------
  // Article 已有 @id (`${m(o)}#article`)，publisher=p 会在 F1 后自动带上 @id。
  // 但 mainEntityOfPage 用的是 `#webpage`，与 Article 的 `#article` 不一致 →
  // AI 引擎会把文章归因到两个不同实体。统一为 `#article`。
  const OLD_MEP = 'mainEntityOfPage:u(o),';
  const NEW_MEP = 'mainEntityOfPage:{"@id":`${m(o)}#article`},';
  if (!src.includes(OLD_MEP)) {
    console.error('[FAIL] 未匹配到 Article mainEntityOfPage 定义串 —— 终止');
    process.exit(1);
  }
  src = src.replace(OLD_MEP, NEW_MEP);
  console.log('[OK] F4 Article: mainEntityOfPage @id 统一为 #article（消除双实体歧义）');

  // ---------- F5: FAQPage 已有 @id（`${m(n)}#faq`），保持不变，仅确认 ----------
  if (!src.includes('"#faq"') && !src.includes('#faq')) {
    console.error('[FAIL] 未找到 FAQPage @id 定义 —— 终止');
    process.exit(1);
  }
  console.log('[OK] F5 FAQPage @id 已存在，保持');

  if (src === orig) {
    console.error('[FAIL] 源码无变化 —— 终止');
    process.exit(1);
  }

  // 语法校验：用 node --check 校验改写后的完整文件（写临时文件，不污染仓库）
  const tmp = path.join('/tmp', '__structured_check_' + Date.now() + '.mjs');
  fs.writeFileSync(tmp, src, 'utf8');
  const { execFileSync } = require('child_process');
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  } catch (e) {
    console.error('[FAIL] patch 后 JS 语法校验失败，已放弃写盘:');
    console.error((e.stderr ? e.stderr.toString() : e.message).split('\n').slice(0, 6).join('\n'));
    fs.unlinkSync(tmp);
    process.exit(1);
  }
  fs.unlinkSync(tmp);
  console.log('[OK] 语法校验通过');

  fs.writeFileSync(file, src, 'utf8');
  console.log(`[DONE] 已写盘: ${file}`);
  console.log(`  原始长度 ${orig.length} → 新长度 ${src.length}`);
}

main();
