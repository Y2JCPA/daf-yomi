#!/usr/bin/env node
/**
 * Repair slides rendered with <h2>undefined</h2>: the generator put the slide title in the
 * callout's label field. Promote that label to the <h2> and strip it from the callout.
 * Usage: node fix-undefined-titles.js [masechet ...]   (default: all)
 */
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..', 'daf-yomi');
const only = process.argv.slice(2);
let fixed = 0, unfixable = [];
for (const m of fs.readdirSync(root)) {
  if (only.length && !only.includes(m)) continue;
  const dir = path.join(root, m); if (!fs.statSync(dir).isDirectory()) continue;
  for (const d of fs.readdirSync(dir)) {
    const f = path.join(dir, d, 'index.html'); if (!/^\d+$/.test(d) || !fs.existsSync(f)) continue;
    let html = fs.readFileSync(f, 'utf8'); if (!html.includes('<h2>undefined</h2>')) continue;
    const before = html;
    html = html.replace(/<h2>undefined<\/h2>([\s\S]*?)<div class="callout"><strong>([^<]*?)<\/strong> /g, (all, between, label) => {
      const title = label.trim().replace(/:$/, '');
      if (!title) return all;
      return `<h2>${title}</h2>${between}<div class="callout">`;
    });
    if (html.includes('<h2>undefined</h2>')) unfixable.push(`${m}/${d}`);
    if (html !== before) { fs.writeFileSync(f, html); fixed++; }
  }
}
console.log(`fixed ${fixed} pages`); if (unfixable.length) console.log('still undefined:', unfixable.join(' '));
