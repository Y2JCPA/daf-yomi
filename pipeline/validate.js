#!/usr/bin/env node
/**
 * Validate content JSONs (and optionally built HTML) before publishing.
 * Usage: node validate.js <masechet-slug> [daf ...]     (no dafim = every JSON for that masechet)
 * Exit code 1 if any file fails.
 *
 * Rules (from the Sept 2026 site audit):
 *  - JSON.masechet must equal the requested masechet; daf must be inside the real Bavli range
 *  - no field may be missing/undefined/null/"[object Object]"; every slide needs a title
 *  - slides 3-7 use >= 4 distinct visual types, never the same type twice in a row
 *  - exactly 5 quiz questions, 4 options each, valid correct index, explanation present
 *  - the body must not present ANOTHER masechet's same-number daf as the subject
 */
const fs = require('fs');
const path = require('path');

// Real Bavli pagination: [first daf with Gemara, last daf]
const RANGE = {
  berakhot: [2, 64], shabbat: [2, 157], eruvin: [2, 105], pesachim: [2, 121], shekalim: [2, 22], yoma: [2, 88],
  sukkah: [2, 56], beitzah: [2, 40], 'rosh-hashanah': [2, 35], taanit: [2, 31], megillah: [2, 32], 'moed-katan': [2, 29],
  chagigah: [2, 27], yevamot: [2, 122], ketubot: [2, 112], nedarim: [2, 91], nazir: [2, 66], sotah: [2, 49], gittin: [2, 90],
  kiddushin: [2, 82], 'bava-kamma': [2, 119], 'bava-metzia': [2, 119], 'bava-batra': [2, 176], sanhedrin: [2, 113],
  makkot: [2, 24], shevuot: [2, 49], 'avodah-zarah': [2, 76], horayot: [2, 14], zevachim: [2, 120], menachot: [2, 110],
  chullin: [2, 142], bekhorot: [2, 61], arakhin: [2, 34], temurah: [2, 34], keritot: [2, 28], meilah: [2, 22],
  tamid: [25, 33], niddah: [2, 73],
};
const NAMES = {
  berakhot: 'Berakhot', shabbat: 'Shabbat', eruvin: 'Eruvin', pesachim: 'Pesachim', shekalim: 'Shekalim', yoma: 'Yoma',
  sukkah: 'Sukkah', beitzah: 'Beitzah', 'rosh-hashanah': 'Rosh Hashanah', taanit: 'Taanit', megillah: 'Megillah',
  'moed-katan': 'Moed Katan', chagigah: 'Chagigah', yevamot: 'Yevamot', ketubot: 'Ketubot', nedarim: 'Nedarim', nazir: 'Nazir',
  sotah: 'Sotah', gittin: 'Gittin', kiddushin: 'Kiddushin', 'bava-kamma': 'Bava Kamma', 'bava-metzia': 'Bava Metzia',
  'bava-batra': 'Bava Batra', sanhedrin: 'Sanhedrin', makkot: 'Makkot', shevuot: 'Shevuot', 'avodah-zarah': 'Avodah Zarah',
  horayot: 'Horayot', zevachim: 'Zevachim', menachot: 'Menachot', chullin: 'Chullin', bekhorot: 'Bekhorot', arakhin: 'Arakhin',
  temurah: 'Temurah', keritot: 'Keritot', meilah: "Me'ilah", tamid: 'Tamid', niddah: 'Niddah',
};
const TYPES = new Set(['debate', 'flowchart', 'comparison', 'table', 'callout', 'process']);

function walk(obj, p, errs) {
  if (obj === undefined || obj === null) { errs.push(`${p}: missing/null`); return; }
  if (typeof obj === 'string') {
    if (/\bundefined\b|\[object Object\]|\bnull\b/.test(obj) && /^(undefined|null|\[object Object\])$/.test(obj.trim())) errs.push(`${p}: literal "${obj}"`);
    return;
  }
  if (Array.isArray(obj)) { obj.forEach((v, i) => walk(v, `${p}[${i}]`, errs)); return; }
  if (typeof obj === 'object') for (const k of Object.keys(obj)) walk(obj[k], `${p}.${k}`, errs);
}

function textOf(x) { return JSON.stringify(x).replace(/<[^>]+>/g, ' '); }

function validate(file, slug) {
  const errs = [];
  let d;
  try { d = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return [`invalid JSON: ${e.message}`]; }
  const daf = Number(d.daf);
  if (d.masechet !== slug) errs.push(`masechet field "${d.masechet}" != "${slug}"`);
  const [lo, hi] = RANGE[slug] || [2, 999];
  if (!(daf >= lo && daf <= hi)) errs.push(`daf ${daf} outside real range ${lo}-${hi} for ${slug}`);
  const m = file.match(/_(\d+)\.json$/); if (m && Number(m[1]) !== daf) errs.push(`filename daf ${m[1]} != json daf ${daf}`);
  walk(d, '$', errs);
  if (!d.emoji) errs.push('missing emoji');
  if (!Array.isArray(d.topics) || d.topics.length < 4) errs.push('need >= 4 topics');
  if (!d.overview || !(d.overview.title)) errs.push('overview.title missing');
  if (!Array.isArray(d.slides) || d.slides.length !== 5) errs.push(`need exactly 5 slides, got ${d.slides?.length}`);
  const types = [];
  (d.slides || []).forEach((s, i) => {
    if (!s.title || !String(s.title).trim()) errs.push(`slides[${i}].title missing`);
    if (!TYPES.has(s.type)) errs.push(`slides[${i}].type "${s.type}" invalid`);
    types.push(s.type);
    if (s.type === 'debate' && !(s.lines?.length >= 2)) errs.push(`slides[${i}] debate needs lines`);
    if (s.type === 'flowchart' && !(s.nodes?.length >= 3)) errs.push(`slides[${i}] flowchart needs nodes`);
    if (s.type === 'comparison' && !(s.boxes?.length >= 2)) errs.push(`slides[${i}] comparison needs boxes`);
    if (s.type === 'table' && !(s.headers?.length >= 2 && s.rows?.length >= 2)) errs.push(`slides[${i}] table needs headers+rows`);
    if (s.type === 'callout' && !(s.text)) errs.push(`slides[${i}] callout needs text`);
    if (s.type === 'process' && !(s.steps?.length >= 3)) errs.push(`slides[${i}] process needs steps`);
  });
  if (new Set(types).size < 4) errs.push(`only ${new Set(types).size} distinct slide types (need >= 4)`);
  for (let i = 1; i < types.length; i++) if (types[i] === types[i - 1]) errs.push(`slides[${i - 1}] and [${i}] repeat type ${types[i]}`);
  if (!(d.summary?.flowSteps?.length >= 3)) errs.push('summary.flowSteps needs >= 3 nodes');
  if (!Array.isArray(d.quiz) || d.quiz.length !== 5) errs.push(`need exactly 5 quiz questions, got ${d.quiz?.length}`);
  (d.quiz || []).forEach((q, i) => {
    const o = q.o || q.options;
    if (!q.q) errs.push(`quiz[${i}].q missing`);
    if (!(o?.length === 4)) errs.push(`quiz[${i}] needs 4 options`);
    if (!(Number.isInteger(q.c) && q.c >= 0 && q.c < 4)) errs.push(`quiz[${i}].c invalid`);
    if (!q.e) errs.push(`quiz[${i}].e (explanation) missing`);
  });
  // Wrong-masechet detection: another masechet's name + this daf number in titles/topics, or "Masechet X" framing
  const head = textOf([d.topics, d.overview?.title, (d.slides || []).map(s => s.title), d.summary?.principle]);
  for (const [s2, n2] of Object.entries(NAMES)) {
    if (s2 === slug) continue;
    const re = new RegExp(`\\b${n2.replace(/'/g, "'?")}\\s+${daf}\\b`, 'i');
    if (re.test(head)) errs.push(`heading text presents "${n2} ${daf}" — wrong masechet content?`);
    if (new RegExp(`siyum of (masechet |tractate )?${n2}`, 'i').test(textOf(d))) errs.push(`mentions siyum of ${n2}`);
  }
  return errs;
}

function validateHtml(html, slug, daf) {
  const errs = [];
  const vis = html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '');
  if (/>\s*undefined\s*<|<h2>\s*<\/h2>/.test(vis)) errs.push('visible undefined/empty heading in HTML');
  if (/\[object Object\]/.test(vis)) errs.push('[object Object] in HTML');
  if (!new RegExp(`<h1>${NAMES[slug]} ${daf}</h1>`).test(html)) errs.push('h1 does not match masechet/daf');
  return errs;
}

if (require.main === module) {
  const [slug, ...dafArgs] = process.argv.slice(2);
  if (!slug) { console.error('usage: node validate.js <masechet> [daf ...]'); process.exit(2); }
  const dir = path.join(__dirname, 'content');
  let files = fs.readdirSync(dir).filter(f => f.startsWith(`${slug}_`) && f.endsWith('.json'));
  if (dafArgs.length) files = files.filter(f => dafArgs.includes(f.match(/_(\d+)\.json/)[1]));
  let bad = 0;
  for (const f of files.sort((a, b) => +a.match(/_(\d+)/)[1] - +b.match(/_(\d+)/)[1])) {
    const errs = validate(path.join(dir, f), slug);
    const daf = f.match(/_(\d+)/)[1];
    const htmlPath = path.join(__dirname, '..', 'daf-yomi', slug, daf, 'index.html');
    if (process.argv.includes('--html') && fs.existsSync(htmlPath)) errs.push(...validateHtml(fs.readFileSync(htmlPath, 'utf8'), slug, +daf));
    if (errs.length) { bad++; console.log(`FAIL ${f}\n  - ${errs.join('\n  - ')}`); } else console.log(`ok   ${f}`);
  }
  console.log(`${files.length - bad}/${files.length} passed`);
  process.exit(bad ? 1 : 0);
}
module.exports = { validate, validateHtml, RANGE, NAMES };
