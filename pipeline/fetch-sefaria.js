#!/usr/bin/env node
/**
 * Fetch a daf (amud a + b) from Sefaria and save a plain-text study source.
 * Usage: node fetch-sefaria.js <masechet-slug> <daf> [<daf> ...]   (or  <slug> <from>-<to>)
 * Output: pipeline/sources/<slug>_<daf>.md
 */
const fs = require('fs');
const path = require('path');

const SEFARIA = {
  berakhot: 'Berakhot', shabbat: 'Shabbat', eruvin: 'Eruvin', pesachim: 'Pesachim', shekalim: 'Shekalim',
  yoma: 'Yoma', sukkah: 'Sukkah', beitzah: 'Beitzah', 'rosh-hashanah': 'Rosh_Hashanah', taanit: 'Taanit',
  megillah: 'Megillah', 'moed-katan': 'Moed_Katan', chagigah: 'Chagigah', yevamot: 'Yevamot', ketubot: 'Ketubot',
  nedarim: 'Nedarim', nazir: 'Nazir', sotah: 'Sotah', gittin: 'Gittin', kiddushin: 'Kiddushin',
  'bava-kamma': 'Bava_Kamma', 'bava-metzia': 'Bava_Metzia', 'bava-batra': 'Bava_Batra', sanhedrin: 'Sanhedrin',
  makkot: 'Makkot', shevuot: 'Shevuot', 'avodah-zarah': 'Avodah_Zarah', horayot: 'Horayot', zevachim: 'Zevachim',
  menachot: 'Menachot', chullin: 'Chullin', bekhorot: 'Bekhorot', arakhin: 'Arakhin', temurah: 'Temurah',
  keritot: 'Keritot', meilah: 'Meilah', tamid: 'Tamid', niddah: 'Niddah',
};

function strip(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ').trim();
}

async function getJSON(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'daf-yomi-pipeline' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise(res => setTimeout(res, 1500 * (i + 1)));
    }
  }
}

async function fetchAmud(name, ref) {
  const en = await getJSON(`https://www.sefaria.org/api/v3/texts/${name}.${ref}?version=english`);
  const he = await getJSON(`https://www.sefaria.org/api/v3/texts/${name}.${ref}?version=hebrew`);
  if (en.error) throw new Error(en.error);
  const enText = (en.versions?.[0]?.text || []).map(strip);
  const heText = (he.versions?.[0]?.text || []).map(strip);
  return { enText, heText, enVersion: en.versions?.[0]?.versionTitle, heVersion: he.versions?.[0]?.versionTitle };
}

async function main() {
  const [slug, ...rest] = process.argv.slice(2);
  const name = SEFARIA[slug];
  if (!name) { console.error('Unknown masechet slug', slug); process.exit(1); }
  let dafim = [];
  for (const r of rest) {
    const m = r.match(/^(\d+)-(\d+)$/);
    if (m) for (let d = +m[1]; d <= +m[2]; d++) dafim.push(d); else dafim.push(+r);
  }
  const outDir = path.join(__dirname, 'sources');
  fs.mkdirSync(outDir, { recursive: true });
  for (const daf of dafim) {
    const out = path.join(outDir, `${slug}_${daf}.md`);
    if (fs.existsSync(out) && fs.statSync(out).size > 2000) { console.log(`skip ${slug} ${daf} (exists)`); continue; }
    try {
      const a = await fetchAmud(name, `${daf}a`);
      let b;
      try { b = await fetchAmud(name, `${daf}b`); }
      catch (e) { if (/no text|HTTP 404/i.test(e.message)) { b = { enText: [], heText: [] }; console.log(`  (${name} ${daf}b has no text — last daf)`); } else throw e; }
      let md = `# ${name.replace('_', ' ')} ${daf} — Sefaria source (${a.enVersion}; Hebrew: ${a.heVersion})\n\n`;
      for (const [amud, t] of [['a', a], ['b', b]]) {
        md += `## ${name.replace('_', ' ')} ${daf}${amud}\n\n`;
        for (let i = 0; i < Math.max(t.enText.length, t.heText.length); i++) {
          md += `[${daf}${amud}:${i + 1}] ${t.heText[i] || ''}\n${t.enText[i] || ''}\n\n`;
        }
      }
      fs.writeFileSync(out, md);
      console.log(`fetched ${slug} ${daf}: ${a.enText.length}+${b.enText.length} segments, ${md.length} chars`);
    } catch (e) {
      console.error(`FAILED ${slug} ${daf}: ${e.message}`);
    }
  }
}
main();
