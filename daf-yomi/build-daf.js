#!/usr/bin/env node
/**
 * Daf Yomi HTML Builder
 * Reads a content JSON file + builds index.html + quiz.html
 * Mirrors the gold standard (Menachot 47) quality and design.
 */

const fs = require('fs');
const path = require('path');

const HEB_DAF = {2:'ב',3:'ג',4:'ד',5:'ה',6:'ו',7:'ז',8:'ח',9:'ט',10:'י',
  11:'יא',12:'יב',13:'יג',14:'יד',15:'טו',16:'טז',17:'יז',18:'יח',19:'יט',20:'כ',
  21:'כא',22:'כב',23:'כג',24:'כד',25:'כה',26:'כו',27:'כז',28:'כח',29:'כט',30:'ל',
  31:'לא',32:'לב',33:'לג',34:'לד',35:'לה',36:'לו',37:'לז',38:'לח',39:'לט',40:'מ',
  41:'מא',42:'מב',43:'מג',44:'מד',45:'מה',46:'מו',47:'מז',48:'מח',49:'מט',50:'נ',
  51:'נא',52:'נב',53:'נג',54:'נד',55:'נה',56:'נו',57:'נז',58:'נח',59:'נט',60:'ס',
  61:'סא',62:'סב',63:'סג',64:'סד',65:'סה',66:'סו',67:'סז',68:'סח',69:'סט',70:'ע',
  71:'עא',72:'עב',73:'עג',74:'עד',75:'עה',76:'עו',77:'עז',78:'עח',79:'עט',80:'פ',
  81:'פא',82:'פב',83:'פג',84:'פד',85:'פה',86:'פו',87:'פז',88:'פח',89:'פט',90:'צ',
  91:'צא',92:'צב',93:'צג',94:'צד',95:'צה',96:'צו',97:'צז',98:'צח',99:'צט',100:'ק',
  101:'קא',102:'קב',103:'קג',104:'קד',105:'קה',106:'קו',107:'קז',108:'קח',109:'קט',110:'קי',
  111:'קיא',112:'קיב',113:'קיג',114:'קיד',115:'קטו',116:'קטז',117:'קיז',118:'קיח',119:'קיט',120:'קכ',
  121:'קכא',122:'קכב',123:'קכג',124:'קכד',125:'קכה',126:'קכו',127:'קכז',128:'קכח',129:'קכט',130:'קל',
  131:'קלא',132:'קלב',133:'קלג',134:'קלד',135:'קלה',136:'קלו',137:'קלז',138:'קלח',139:'קלט',140:'קמ',
  141:'קמא',142:'קמב',143:'קמג',144:'קמד',145:'קמה',146:'קמו',147:'קמז',148:'קמח',149:'קמט',150:'קנ',
  151:'קנא',152:'קנב',153:'קנג',154:'קנד',155:'קנה',156:'קנו',157:'קנז',158:'קנח',159:'קנט',160:'קס',
  161:'קסא',162:'קסב',163:'קסג',164:'קסד',165:'קסה',166:'קסו',167:'קסז',168:'קסח',169:'קסט',170:'קע',
  171:'קעא',172:'קעב',173:'קעג',174:'קעד',175:'קעה',176:'קעו'};

const MASECHET_NAMES = {
  chullin: { en: 'Chullin', he: 'חולין' },
  menachot: { en: 'Menachot', he: 'מנחות' },
  bekhorot: { en: 'Bekhorot', he: 'בכורות' },
  arakhin: { en: 'Arakhin', he: 'ערכין' },
  temurah: { en: 'Temurah', he: 'תמורה' },
  keritot: { en: 'Keritot', he: 'כריתות' },
  meilah: { en: "Me'ilah", he: 'מעילה' },
  tamid: { en: 'Tamid', he: 'תמיד' },
  berakhot: { en: 'Berakhot', he: 'ברכות' },
  shabbat: { en: 'Shabbat', he: 'שבת' },
  eruvin: { en: 'Eruvin', he: 'עירובין' },
  pesachim: { en: 'Pesachim', he: 'פסחים' },
  shekalim: { en: 'Shekalim', he: 'שקלים' },
  yoma: { en: 'Yoma', he: 'יומא' },
  sukkah: { en: 'Sukkah', he: 'סוכה' },
  beitzah: { en: 'Beitzah', he: 'ביצה' },
  'rosh-hashanah': { en: 'Rosh Hashanah', he: 'ראש השנה' },
  taanit: { en: 'Taanit', he: 'תענית' },
  megillah: { en: 'Megillah', he: 'מגילה' },
  'moed-katan': { en: 'Moed Katan', he: 'מועד קטן' },
  chagigah: { en: 'Chagigah', he: 'חגיגה' },
  yevamot: { en: 'Yevamot', he: 'יבמות' },
  ketubot: { en: 'Ketubot', he: 'כתובות' },
  nedarim: { en: 'Nedarim', he: 'נדרים' },
  nazir: { en: 'Nazir', he: 'נזיר' },
  sotah: { en: 'Sotah', he: 'סוטה' },
  gittin: { en: 'Gittin', he: 'גיטין' },
  kiddushin: { en: 'Kiddushin', he: 'קידושין' },
  'bava-kamma': { en: 'Bava Kamma', he: 'בבא קמא' },
  'bava-metzia': { en: 'Bava Metzia', he: 'בבא מציעא' },
  'bava-batra': { en: 'Bava Batra', he: 'בבא בתרא' },
  sanhedrin: { en: 'Sanhedrin', he: 'סנהדרין' },
  makkot: { en: 'Makkot', he: 'מכות' },
  shevuot: { en: 'Shevuot', he: 'שבועות' },
  'avodah-zarah': { en: 'Avodah Zarah', he: 'עבודה זרה' },
  horayot: { en: 'Horayot', he: 'הוריות' },
  zevachim: { en: 'Zevachim', he: 'זבחים' },
  niddah: { en: 'Niddah', he: 'נידה' },
};

const CSS = `* { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; background: #1a1a2e; color: #e0e0e0; }
  .slide { min-height: 100vh; padding: 40px 5%; display: flex; flex-direction: column; justify-content: center; align-items: center; border-bottom: 3px solid #c9a84c; position: relative; }
  .slide-num { position: absolute; top: 20px; right: 30px; font-size: 14px; color: #c9a84c; opacity: 0.7; }
  h1 { font-size: 2.8em; color: #c9a84c; text-align: center; margin-bottom: 10px; }
  h2 { font-size: 2em; color: #c9a84c; text-align: center; margin-bottom: 30px; }
  h3 { font-size: 1.4em; color: #daa520; margin-bottom: 15px; }
  .subtitle { font-size: 1.2em; color: #aaa; text-align: center; margin-bottom: 40px; }
  .hebrew { font-family: 'David', 'Times New Roman', serif; direction: rtl; font-size: 1.1em; color: #e8d5a3; }
  .flowchart { display: flex; flex-direction: column; align-items: center; gap: 0; max-width: 700px; width: 100%; }
  .flow-box { background: #16213e; border: 2px solid #c9a84c; border-radius: 12px; padding: 16px 24px; text-align: center; min-width: 280px; max-width: 520px; font-size: 1em; line-height: 1.5; }
  .flow-box.action { background: #1a3a5c; border-color: #4a90d9; }
  .flow-box.result-good { background: #1a4a2a; border-color: #4caf50; }
  .flow-box.result-bad { background: #4a1a1a; border-color: #e74c3c; }
  .flow-box.result-partial { background: #4a3a1a; border-color: #f39c12; }
  .flow-box.question { background: #3a1a4a; border-color: #9b59b6; }
  .flow-arrow { font-size: 28px; color: #c9a84c; line-height: 1; padding: 4px 0; }
  .flow-branch { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; width: 100%; }
  .flow-branch .flow-col { display: flex; flex-direction: column; align-items: center; gap: 0; flex: 1; min-width: 200px; }
  .flow-label { font-size: 0.85em; color: #aaa; font-style: italic; padding: 2px 0; }
  table { border-collapse: collapse; margin: 20px auto; max-width: 800px; width: 100%; }
  th { background: #c9a84c; color: #1a1a2e; padding: 12px 16px; font-size: 0.95em; }
  td { padding: 10px 16px; border-bottom: 1px solid #333; font-size: 0.95em; text-align: center; }
  tr:nth-child(even) { background: #16213e; }
  tr:nth-child(odd) { background: #1a1a2e; }
  .check { color: #4caf50; font-size: 1.3em; }
  .cross { color: #e74c3c; font-size: 1.3em; }
  .partial { color: #f39c12; font-size: 1.3em; }
  .compare-row { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; max-width: 900px; width: 100%; }
  .compare-box { flex: 1; min-width: 260px; max-width: 400px; background: #16213e; border-radius: 12px; padding: 24px; border-top: 4px solid #c9a84c; }
  .compare-box h3 { text-align: center; }
  .compare-box ul { list-style: none; padding: 0; }
  .compare-box li { padding: 6px 0; border-bottom: 1px solid #333; font-size: 0.95em; }
  .compare-box li:last-child { border-bottom: none; }
  .process-bar { display: flex; flex-direction: column; align-items: center; gap: 0; max-width: 700px; width: 100%; margin: 20px 0; }
  .process-step { background: #16213e; border: 2px solid #c9a84c; border-radius: 12px; width: 100%; padding: 14px 18px; text-align: center; font-size: 0.95em; line-height: 1.5; }
  .process-arrow { font-size: 24px; color: #c9a84c; padding: 4px 0; }
  .process-step.highlight { border-color: #4caf50; background: #1a4a2a; }
  .callout { background: #16213e; border-left: 5px solid #c9a84c; padding: 20px 24px; max-width: 700px; width: 100%; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 1.05em; line-height: 1.6; }
  .callout strong { color: #c9a84c; }
  .debate { max-width: 650px; width: 100%; }
  .debate-line { display: flex; gap: 12px; margin-bottom: 12px; align-items: flex-start; }
  .debate-line.right { flex-direction: row-reverse; text-align: right; }
  .speaker { background: #c9a84c; color: #1a1a2e; border-radius: 20px; min-width: 48px; max-width: 80px; height: auto; min-height: 40px; padding: 8px 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.65em; flex-shrink: 0; text-align: center; line-height: 1.15; word-break: break-word; }
  .speech { background: #16213e; border-radius: 12px; padding: 12px 16px; max-width: 500px; line-height: 1.5; font-size: 0.95em; }
  .debate-line.right .speech { background: #1a3a5c; }
  .emoji { font-size: 1.3em; }
  .nav { position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px; z-index: 100; }
  .nav a { background: #c9a84c; color: #1a1a2e; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 0.9em; }
  .nav a:hover { background: #daa520; }`;

const QUIZ_CSS = `* { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; background: #1a1a2e; color: #e0e0e0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; }
  .breadcrumb { margin-bottom: 30px; }
  .breadcrumb a { color: #c9a84c; text-decoration: none; }
  h1 { font-size: 2.2em; color: #c9a84c; margin-bottom: 6px; text-align: center; }
  .subtitle { color: #aaa; font-size: 1em; margin-bottom: 40px; text-align: center; }
  .quiz { max-width: 650px; width: 100%; }
  .question { background: #16213e; border: 2px solid #333; border-radius: 12px; padding: 24px; margin-bottom: 24px; transition: border-color 0.3s; }
  .question.correct { border-color: #4caf50; }
  .question.incorrect { border-color: #e74c3c; }
  .q-num { color: #c9a84c; font-size: 0.85em; font-weight: bold; margin-bottom: 8px; }
  .q-text { font-size: 1.05em; line-height: 1.6; margin-bottom: 16px; }
  .options { display: flex; flex-direction: column; gap: 8px; }
  .option { background: #1a1a2e; border: 2px solid #444; border-radius: 8px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; font-size: 0.95em; line-height: 1.4; }
  .option:hover { border-color: #c9a84c; background: #1a2a4e; }
  .option.selected { border-color: #c9a84c; background: #1a2a4e; }
  .option.right { border-color: #4caf50; background: #1a3a2a; }
  .option.wrong { border-color: #e74c3c; background: #3a1a1a; }
  .option.disabled { pointer-events: none; opacity: 0.7; }
  .option.disabled.right { opacity: 1; }
  .explanation { display: none; margin-top: 14px; padding: 14px; background: #0d1b2a; border-radius: 8px; font-size: 0.9em; line-height: 1.6; border-left: 3px solid #c9a84c; }
  .explanation.show { display: block; }
  .submit-btn { display: block; margin: 30px auto; padding: 16px 48px; background: #c9a84c; color: #1a1a2e; border: none; border-radius: 10px; font-size: 1.15em; font-weight: bold; cursor: pointer; font-family: 'Georgia', serif; }
  .submit-btn:disabled { background: #555; color: #999; cursor: not-allowed; }
  .results { display: none; text-align: center; background: #16213e; border: 2px solid #c9a84c; border-radius: 12px; padding: 30px; margin-top: 10px; }
  .results.show { display: block; }
  .score { font-size: 2.5em; color: #c9a84c; font-weight: bold; }
  .score-label { color: #aaa; margin-top: 6px; }
  .score-msg { margin-top: 14px; font-size: 1.1em; }
  .retry-btn { display: inline-block; margin-top: 20px; padding: 12px 36px; background: transparent; color: #c9a84c; border: 2px solid #c9a84c; border-radius: 8px; font-size: 1em; cursor: pointer; font-family: 'Georgia', serif; text-decoration: none; }
  .retry-btn:hover { background: #c9a84c; color: #1a1a2e; }
  .hebrew { font-family: 'David', 'Times New Roman', serif; direction: rtl; color: #e8d5a3; }`;

function renderSlideContent(slide) {
  switch (slide.type) {
    case 'debate':
      return renderDebate(slide);
    case 'flowchart':
      return renderFlowchart(slide);
    case 'comparison':
      return renderComparison(slide);
    case 'table':
      return renderTable(slide);
    case 'callout':
      return renderCallout(slide);
    case 'process':
      return renderProcess(slide);
    default:
      return `<div class="callout">${slide.content || ''}</div>`;
  }
}

function renderDebate(slide) {
  let html = '<div class="debate">';
  for (const line of slide.lines || []) {
    const side = line.side === 'right' ? ' right' : '';
    const color = line.speakerColor || (line.side === 'right' ? '#4a90d9' : '#c9a84c');
    html += `<div class="debate-line${side}"><div class="speaker" style="background:${color}">${line.speaker}</div><div class="speech">${line.text}</div></div>`;
  }
  html += '</div>';
  if (slide.callout) html += `<div class="callout" style="margin-top:20px"><strong>${slide.callout.label}</strong> ${slide.callout.text}</div>`;
  return html;
}

function renderFlowchart(slide) {
  let html = '<div class="flowchart">';
  for (const node of slide.nodes || []) {
    if (node.type === 'arrow') {
      html += '<div class="flow-arrow">↓</div>';
    } else if (node.type === 'branch') {
      html += '<div class="flow-branch">';
      for (const col of node.columns || []) {
        html += '<div class="flow-col">';
        if (col.label) html += `<div class="flow-label">${col.label}</div>`;
        html += `<div class="flow-box ${col.class || ''}">${col.content}</div>`;
        html += '</div>';
      }
      html += '</div>';
    } else {
      html += `<div class="flow-box ${node.class || ''}">${node.content}</div>`;
    }
  }
  html += '</div>';
  if (slide.callout) html += `<div class="callout" style="margin-top:20px"><strong>${slide.callout.label}</strong> ${slide.callout.text}</div>`;
  return html;
}

function renderComparison(slide) {
  let html = '<div class="compare-row">';
  for (const box of slide.boxes || []) {
    const borderColor = box.color || '#c9a84c';
    const titleColor = box.titleColor || '#daa520';
    html += `<div class="compare-box" style="border-top-color:${borderColor}"><h3 style="color:${titleColor}">${box.title}</h3><ul>`;
    for (const item of box.items || []) {
      html += `<li>${item}</li>`;
    }
    html += '</ul></div>';
  }
  html += '</div>';
  if (slide.callout) html += `<div class="callout" style="margin-top:20px"><strong>${slide.callout.label}</strong> ${slide.callout.text}</div>`;
  return html;
}

function renderTable(slide) {
  let html = '<table><tr>';
  for (const h of slide.headers || []) html += `<th>${h}</th>`;
  html += '</tr>';
  for (const row of slide.rows || []) {
    html += '<tr>';
    for (const cell of row) html += `<td>${cell}</td>`;
    html += '</tr>';
  }
  html += '</table>';
  if (slide.callout) html += `<div class="callout" style="margin-top:20px"><strong>${slide.callout.label}</strong> ${slide.callout.text}</div>`;
  return html;
}

function renderCallout(slide) {
  let html = '';
  if (slide.hebrewSource) html += `<div class="hebrew" style="text-align:center;font-size:1.2em;margin-bottom:20px">${slide.hebrewSource}</div>`;
  html += `<div class="callout"><strong>${slide.label || ''}</strong> ${slide.text || ''}</div>`;
  if (slide.extraHtml) html += slide.extraHtml;
  return html;
}

function renderProcess(slide) {
  let html = '<div class="process-bar">';
  for (let i = 0; i < (slide.steps || []).length; i++) {
    const step = slide.steps[i];
    const cls = step.highlight ? ' highlight' : '';
    html += `<div class="process-step${cls}">${step.content}</div>`;
    if (i < slide.steps.length - 1) html += `<div class="process-arrow">↓</div>`;
  }
  html += '</div>';
  if (slide.callout) html += `<div class="callout" style="margin-top:20px"><strong>${slide.callout.label}</strong> ${slide.callout.text}</div>`;
  return html;
}

function buildIndex(data, masechet, daf, totalDapim) {
  const names = MASECHET_NAMES[masechet] || { en: masechet, he: masechet };
  const heDaf = HEB_DAF[daf] || String(daf);
  const totalSlides = 9;

  // Slide 1: Title
  const topicsHtml = data.topics.map(t => `${t}<br>`).join('\n    ');
  const slide1 = `<div class="slide" style="background:linear-gradient(135deg,#1a1a2e,#16213e)">
  <div class="slide-num">1 / ${totalSlides}</div>
  <div style="font-size:3em;margin-bottom:20px">${data.emoji}</div>
  <h1>${names.en} ${daf}</h1>
  <div class="subtitle">Daf Yomi Visual Guide</div>
  <div class="hebrew" style="font-size:1.3em;margin:20px 0">${names.he} ${heDaf}׳</div>
  <div style="margin-top:30px;text-align:center;max-width:600px;line-height:1.8;color:#aaa">
    <strong style="color:#c9a84c">Key Topics:</strong><br>
    ${topicsHtml}
  </div>
</div>`;

  // Slide 2: Overview
  const overviewContent = data.overview.type ? renderSlideContent(data.overview) :
    `<div class="callout"><strong>${data.overview.label || 'Overview:'}</strong> ${data.overview.text || ''}</div>`;
  const slide2 = `<div class="slide">
  <div class="slide-num">2 / ${totalSlides}</div>
  <h2>${data.overview.title || '📖 Overview'}</h2>
  ${data.overview.subtitle ? `<div style="text-align:center;color:#aaa;margin-bottom:20px">${data.overview.subtitle}</div>` : ''}
  ${overviewContent}
</div>`;

  // Slides 3-7: Content
  const contentSlides = [];
  for (let i = 0; i < 5; i++) {
    const slide = data.slides[i];
    if (!slide) continue;
    const subtitle = slide.subtitle ? `<div style="text-align:center;color:#aaa;margin-bottom:20px">${slide.subtitle}</div>` : '';
    contentSlides.push(`<div class="slide">
  <div class="slide-num">${i + 3} / ${totalSlides}</div>
  <h2>${slide.title}</h2>
  ${subtitle}
  ${renderSlideContent(slide)}
</div>`);
  }

  // Slide 8: Summary
  const summaryNodes = data.summary.flowSteps || [];
  let summaryFlow = '<div class="flowchart" style="max-width:800px">';
  // Sanitize styles: strip any background colors that are too light, enforce dark theme
  function sanitizeStyle(style) {
    if (!style) return '';
    // Replace light backgrounds with dark equivalents
    return style.replace(/background:\s*#[0-9a-fA-F]{6}/gi, (match) => {
      const hex = match.replace(/background:\s*#/i, '');
      // If any RGB channel > 0x60, it's too light — force dark
      const r = parseInt(hex.substr(0,2),16);
      const g = parseInt(hex.substr(2,2),16);
      const b = parseInt(hex.substr(4,2),16);
      if (r > 0x60 || g > 0x60 || b > 0x60) return 'background:#16213e';
      return match;
    });
  }
  for (const node of summaryNodes) {
    if (node.type === 'arrow') {
      summaryFlow += '<div class="flow-arrow">↓</div>';
    } else if (node.type === 'branch') {
      summaryFlow += '<div class="flow-branch">';
      for (const col of node.columns || []) {
        summaryFlow += `<div class="flow-col"><div class="flow-box" style="${sanitizeStyle(col.style)}">${col.content}</div></div>`;
      }
      summaryFlow += '</div>';
    } else {
      summaryFlow += `<div class="flow-box ${node.class || ''}" style="${sanitizeStyle(node.style)}">${node.content}</div>`;
    }
  }
  summaryFlow += '</div>';

  const slide8 = `<div class="slide">
  <div class="slide-num">8 / ${totalSlides}</div>
  <h2>📋 ${names.en} ${daf} — Summary Map</h2>
  ${summaryFlow}
  <div style="margin-top:30px;text-align:center;color:#666;font-size:0.85em">
    ${names.en} ${daf}a-${daf}b · Daf Yomi · Sources: Sefaria (William Davidson Edition), DafYomi.co.il
  </div>
</div>`;

  // Slide 9: Quiz CTA
  const slide9 = `<div class="slide" style="background:linear-gradient(135deg,#16213e,#1a1a2e)">
  <div class="slide-num">9 / ${totalSlides}</div>
  <div style="font-size:3.5em;margin-bottom:20px">📝</div>
  <h2>Ready to Test Yourself?</h2>
  <div style="color:#aaa;font-size:1.1em;margin:20px 0 30px;text-align:center;max-width:500px;line-height:1.6">
    5 multiple-choice questions on today's daf.<br>Self-graded with explanations for each answer.
  </div>
  <a href="quiz.html" style="display:inline-block;padding:18px 48px;background:#c9a84c;color:#1a1a2e;text-decoration:none;border-radius:12px;font-size:1.3em;font-weight:bold;font-family:'Georgia',serif">Take the Quiz →</a>
  <div style="margin-top:40px;color:#555;font-size:0.85em">
    ${names.en} ${daf}a-${daf}b · Daf Yomi
  </div>
</div>`;

  // Nav
  const prevLink = daf > 2 ? `<a href="../${daf - 1}/">← Daf ${daf - 1}</a>` : '';
  const nextLink = daf < totalDapim ? `<a href="../${daf + 1}/">Daf ${daf + 1} →</a>` : '';
  const nav = `<div class="nav">${prevLink}${nextLink}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${names.en} ${daf} — Daf Yomi Visual Guide</title>
<style>${CSS}</style>
</head>
<body>
<div style="position:fixed;top:15px;left:20px;z-index:100"><a href="../" style="color:#c9a84c;text-decoration:none;font-size:.85em;opacity:.8">← ${names.en} Index</a></div>
${slide1}
${slide2}
${contentSlides.join('\n')}
${slide8}
${slide9}
${nav}
</body>
</html>`;
}

function buildQuiz(data, masechet, daf) {
  const names = MASECHET_NAMES[masechet] || { en: masechet, he: masechet };

  let questionsHtml = '';
  const answerMap = {};
  for (let i = 0; i < data.quiz.length; i++) {
    const q = data.quiz[i];
    const opts = q.o || q.options || [];
    const correct = q.c !== undefined ? q.c : 0;
    answerMap[i + 1] = correct;

    let optionsHtml = '';
    for (let j = 0; j < opts.length; j++) {
      const letter = String.fromCharCode(65 + j);
      optionsHtml += `      <div class="option" onclick="select(${i + 1},this,${j})">${letter}. ${opts[j]}</div>\n`;
    }

    questionsHtml += `  <div class="question" id="q${i + 1}">
    <div class="q-num">QUESTION ${i + 1} OF 5</div>
    <div class="q-text">${q.q}</div>
    <div class="options">
${optionsHtml}    </div>
    <div class="explanation" id="e${i + 1}"><strong>Correct: ${String.fromCharCode(65 + correct)} — </strong>${q.e}</div>
  </div>\n\n`;
  }

  const answersJs = JSON.stringify(answerMap);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${names.en} ${daf} — Quiz</title>
<style>${QUIZ_CSS}</style>
</head>
<body>
<div class="breadcrumb"><a href="./">← Back to Slides</a></div>
<div style="font-size:2em;margin-bottom:10px">📝</div>
<h1>${names.en} ${daf} Quiz</h1>
<div class="subtitle">5 questions · Self-graded · Test your learning!</div>
<div class="quiz" id="quiz">
${questionsHtml}</div>
<button class="submit-btn" id="submitBtn" onclick="grade()" disabled>Answer all 5 to submit</button>
<div class="results" id="results">
  <div class="score" id="scoreNum"></div>
  <div class="score-label">out of 5 correct</div>
  <div class="score-msg" id="scoreMsg"></div>
  <a href="./" class="retry-btn">← Back to Slides</a>
  <button class="retry-btn" onclick="retry()" style="margin-left:10px">Try Again ↻</button>
</div>
<script>
const answers=${answersJs};const selected={};
function select(q,el,idx){if(document.getElementById('q'+q).classList.contains('correct')||document.getElementById('q'+q).classList.contains('incorrect'))return;const opts=el.parentElement.children;for(let o of opts)o.classList.remove('selected');el.classList.add('selected');selected[q]=idx;document.getElementById('submitBtn').disabled=Object.keys(selected).length<5;if(Object.keys(selected).length>=5)document.getElementById('submitBtn').textContent='Submit Answers ✓';}
function grade(){let score=0;for(let q=1;q<=5;q++){const qEl=document.getElementById('q'+q);const opts=qEl.querySelectorAll('.option');const correct=answers[q];const picked=selected[q];opts.forEach((o,i)=>{o.classList.add('disabled');if(i===correct)o.classList.add('right');if(i===picked&&i!==correct)o.classList.add('wrong');});if(picked===correct){qEl.classList.add('correct');score++;}else{qEl.classList.add('incorrect');}document.getElementById('e'+q).classList.add('show');}document.getElementById('submitBtn').style.display='none';const results=document.getElementById('results');results.classList.add('show');document.getElementById('scoreNum').textContent=score+' / 5';const msgs=["Review the slides and try again! 📖","Getting there! 💪","Not bad! One more pass will help. 👍","Solid learning! 🎯","Almost perfect! 🔥","Perfect score! Talmid Chacham! 🏆"];document.getElementById('scoreMsg').textContent=msgs[score];}
function retry(){for(let q=1;q<=5;q++){const qEl=document.getElementById('q'+q);qEl.classList.remove('correct','incorrect');qEl.querySelectorAll('.option').forEach(o=>{o.classList.remove('selected','right','wrong','disabled');});document.getElementById('e'+q).classList.remove('show');}Object.keys(selected).forEach(k=>delete selected[k]);document.getElementById('submitBtn').style.display='block';document.getElementById('submitBtn').disabled=true;document.getElementById('submitBtn').textContent='Answer all 5 to submit';document.getElementById('results').classList.remove('show');window.scrollTo({top:0,behavior:'smooth'});}
</script>
</body>
</html>`;
}

// === MAIN ===
const jsonDir = process.argv[2] || '/tmp/daf_content';
const repoDir = process.argv[3] || path.join(__dirname);
const masechet = process.argv[4] || 'chullin';
const totalDapim = parseInt(process.argv[5]) || 142;

const files = fs.readdirSync(jsonDir).filter(f => f.startsWith(`${masechet}_`) && f.endsWith('.json'));
console.log(`Building ${files.length} dapim for ${masechet}...`);

let built = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(jsonDir, file)));
  const daf = data.daf || parseInt(file.match(/_(\d+)\.json/)?.[1]);
  if (!daf) { console.warn(`Can't determine daf number from ${file}`); continue; }

  const outDir = path.join(repoDir, masechet, String(daf));
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, 'index.html'), buildIndex(data, masechet, daf, totalDapim));
  fs.writeFileSync(path.join(outDir, 'quiz.html'), buildQuiz(data, masechet, daf));
  built++;
}
console.log(`Built ${built} dapim (index.html + quiz.html each)`);
