# Daf Yomi Pipeline — Build Spec

## Overview
Automated build system for the Daf Yomi interactive study site.
Uses a structured content JSON pipeline: Sefaria API → Claude CLI content generation → HTML builder → GitHub Pages.

## Architecture

```
Sefaria API (amud a + b text)
        ↓
generate_daf_content.sh (Claude CLI → content JSON per daf)
        ↓
/tmp/daf_content/{masechet}_{daf}.json
        ↓
build-daf.js (reads JSON → builds index.html + quiz.html)
        ↓
daf-yomi/{masechet}/{daf}/index.html + quiz.html
        ↓
Git push → GitHub Pages
```

## Key Files

| File | Location | Purpose |
|------|----------|---------|
| `build-daf.js` | `daf-yomi/build-daf.js` | HTML builder — reads content JSON, outputs index.html + quiz.html |
| `generate_daf_content.sh` | `/tmp/generate_daf_content.sh` | Content generator — calls Sefaria API + Claude CLI |
| `build-overnight.sh` | `build-overnight.sh` (repo root) | Batch builder — loops through masechtos, 15 parallel |
| `TEMPLATE.md` | `daf-yomi/TEMPLATE.md` | Design spec — colors, CSS classes, visual component rules |
| Content JSONs | `/tmp/daf_content/` | Generated content data per daf |

## How to Build

### Single daf:
```bash
# Generate content JSON
bash /tmp/generate_daf_content.sh chullin 50

# Build HTML from JSON
cd ~/.openclaw/workspace/daf-yomi/daf-yomi
node build-daf.js /tmp/daf_content . chullin 142
```

### Batch (15 parallel):
```bash
for i in $(seq 50 64); do
  bash /tmp/generate_daf_content.sh chullin $i &
done
wait
node build-daf.js /tmp/daf_content . chullin 142
```

### Full masechet (overnight script):
```bash
bash ~/.openclaw/workspace/daf-yomi/build-overnight.sh
```

## Content JSON Schema

```json
{
  "masechet": "chullin",
  "daf": 50,
  "emoji": "🔪",
  "topics": ["🔪 Topic — brief description", ...],
  "overview": {
    "type": "debate|callout|flowchart|process",
    "title": "📖 Overview Title",
    "subtitle": "optional context",
    ...type-specific fields
  },
  "slides": [
    {
      "type": "flowchart|comparison|debate|table|callout|process",
      "title": "📊 Slide Title",
      "subtitle": "optional",
      ...type-specific fields
    }
  ],
  "summary": {
    "principle": "Key principle text",
    "flowSteps": [
      {"content": "html", "class": "", "style": ""},
      {"type": "arrow"},
      {"type": "branch", "columns": [{"content": "", "style": ""}]}
    ]
  },
  "quiz": [
    {"q": "Question?", "o": ["A","B","C","D"], "c": 0, "e": "Explanation"}
  ]
}
```

### Slide Type Schemas

**debate:**
```json
{
  "type": "debate",
  "title": "",
  "lines": [
    {"speaker": "RY", "side": "left|right", "speakerColor": "#c9a84c", "text": "html"}
  ],
  "callout": {"label": "", "text": ""}
}
```

**flowchart:**
```json
{
  "type": "flowchart",
  "title": "",
  "nodes": [
    {"content": "html", "class": "action|result-good|result-bad|question"},
    {"type": "arrow"},
    {"type": "branch", "columns": [{"label": "", "content": "html", "class": ""}]}
  ],
  "callout": {"label": "", "text": ""}
}
```

**comparison:**
```json
{
  "type": "comparison",
  "title": "",
  "boxes": [
    {"title": "", "color": "#4caf50", "titleColor": "#4caf50", "items": ["bullet items"]}
  ],
  "callout": {"label": "", "text": ""}
}
```

**table:**
```json
{
  "type": "table",
  "title": "",
  "headers": ["col1", "col2"],
  "rows": [["cell", "cell"]],
  "callout": {"label": "", "text": ""}
}
```

**callout:**
```json
{
  "type": "callout",
  "title": "",
  "label": "Bold label:",
  "text": "Body text",
  "hebrewSource": "optional Hebrew text"
}
```

**process:**
```json
{
  "type": "process",
  "title": "",
  "steps": [{"content": "emoji+text", "highlight": false}],
  "callout": {"label": "", "text": ""}
}
```

## Quality Rules

1. **4+ different visual types** across slides 3-7. Never repeat consecutively.
2. **Real Talmudic speakers** — Rav, Abaye, Rava, R' Yochanan, etc.
3. **Accurate content** — verify against Sefaria source.
4. **Hebrew text** where relevant (key phrases, debates).
5. **5 quiz questions** testing understanding, not memorization.
6. **Plausible distractors** in quiz.
7. **Summary flowchart** recapping the daf's logical structure.

## Design System

### Colors
| Token | Hex | Use |
|-------|-----|-----|
| Background | `#1a1a2e` | Page bg |
| Card | `#16213e` | Boxes, panels |
| Gold | `#c9a84c` | Headers, accents |
| Blue | `#4a90d9` | Debates (right side) |
| Green | `#4caf50` | Valid/kosher |
| Red | `#e74c3c` | Invalid/treif |
| Purple | `#9b59b6` | Questions |
| Orange | `#f39c12` | Uncertain |
| Hebrew text | `#e8d5a3` | Hebrew passages |

### Key CSS
- **Process steps**: Vertical stack, full-width cards with ↓ arrows
- **Speaker pills**: Rounded pill shape (min-width 48px, max-width 80px), word-wrap for longer names
- **Summary map**: Dark backgrounds enforced (sanitizeStyle strips light colors)
- **Typography**: Georgia serif body, David font for Hebrew

## Sefaria API

```bash
# Amud A
curl -s "https://www.sefaria.org/api/v3/texts/Chullin.50a?version=english"

# Amud B
curl -s "https://www.sefaria.org/api/v3/texts/Chullin.50b?version=english"
```

### Masechet Name Mapping
| Internal | Sefaria API |
|----------|-------------|
| chullin | Chullin |
| bekhorot | Bekhorot |
| arakhin | Arakhin |
| temurah | Temurah |
| keritot | Keritot |
| meilah | Meilah |
| tamid | Tamid |
| menachot | Menachot |

## Current Status (as of Mar 27, 2026)

### Completed Masechtos — 20 masechtos, ~1,370 dapim with actual content

**Seder Zeraim**
| Masechet | Hebrew | Dapim | Status |
|----------|--------|-------|--------|
| Berakhot | ברכות | 63 | ✅ Complete (pipeline) |

**Seder Mo'ed (COMPLETE ✅)**
| Masechet | Hebrew | Dapim | Status |
|----------|--------|-------|--------|
| Shabbat | שבת | 156 | ✅ Complete (pipeline) |
| Eruvin | עירובין | 104 | ✅ Complete (pipeline) |
| Pesachim | פסחים | 120 | ✅ Complete (pipeline) |
| Shekalim | שקלים | 21 | ✅ Complete (pipeline) |
| Yoma | יומא | 87 | ✅ Complete (pipeline) |
| Sukkah | סוכה | 55 | ✅ Complete (pipeline) |
| Beitzah | ביצה | 39 | ✅ Complete (pipeline, Mar 27) |
| Rosh Hashanah | ראש השנה | 34 | ✅ Complete (pipeline, Mar 27) |
| Taanit | תענית | 30 | ✅ Complete (pipeline, Mar 27) |
| Megillah | מגילה | 31 | ✅ Complete (pipeline, Mar 27) |
| Moed Katan | מועד קטן | 28 | ✅ Complete (pipeline, Mar 27) |
| Chagigah | חגיגה | 26 | ✅ Complete (pipeline, Mar 27) |

**Seder Nashim (IN PROGRESS)**
| Masechet | Hebrew | Dapim | Status |
|----------|--------|-------|--------|
| Yevamot | יבמות | 75/122 | ⚠️ Partial — dapim 2-76 built, 77-122 remaining |
| Ketubot | כתובות | 111 | ❌ Not built |
| Nedarim | נדרים | 90 | ❌ Not built |
| Nazir | נזיר | 65 | ❌ Not built |
| Sotah | סוטה | 48 | ❌ Not built |
| Gittin | גיטין | 89 | ❌ Not built |
| Kiddushin | קידושין | 81 | ❌ Not built |

**Seder Nezikin**
| Masechet | Hebrew | Dapim | Status |
|----------|--------|-------|--------|
| Bava Kamma | בבא קמא | 118 | ❌ Not built |
| Bava Metzia | בבא מציעא | 119 | ❌ Not built |
| Bava Batra | בבא בתרא | 176 | ❌ Not built |
| Sanhedrin | סנהדרין | 113 | ❌ Not built |
| Makkot | מכות | 24 | ❌ Not built |
| Shevuot | שבועות | 49 | ❌ Not built |
| Avodah Zarah | עבודה זרה | 76 | ❌ Not built |
| Horayot | הוריות | 14 | ❌ Not built |

**Seder Kodashim (COMPLETE ✅ — Gemara masechtos)**
| Masechet | Hebrew | Dapim | Status |
|----------|--------|-------|--------|
| Zevachim | זבחים | 120 | ❌ Not built |
| Menachot | מנחות | 109 | ✅ Complete (hand-built) |
| Chullin | חולין | 142 | ✅ Complete (2-49 hand-built, 50-142 pipeline) |
| Bekhorot | בכורות | 60 | ✅ Complete (pipeline, Mar 26 overnight) |
| Arakhin | ערכין | 33 | ✅ Complete (pipeline, Mar 26 overnight) |
| Temurah | תמורה | 33 | ✅ Complete (pipeline, Mar 26 overnight) |
| Keritot | כריתות | 27 | ✅ Complete (pipeline, Mar 26 overnight) |
| Me'ilah | מעילה | 21 | ✅ Complete (pipeline, Mar 26 overnight) |
| Tamid | תמיד | 32 | ✅ Complete (pipeline, Mar 26 overnight) |
| Middot | — | — | Mishnah-only, no Gemara |
| Kinnim | — | — | Mishnah-only, no Gemara |

**Seder Taharot**
| Masechet | Hebrew | Dapim | Status |
|----------|--------|-------|--------|
| Niddah | נידה | 73 | ❌ Not built |
| (Others) | — | — | Mishnah-only, no Gemara |

### Next steps (resume here)
1. Finish Yevamot (dapim 77-122 = 46 remaining)
2. Continue Seder Nashim: Ketubot → Nedarim → Nazir → Sotah → Gittin → Kiddushin
3. Seder Nezikin: BK → BM → BB → Sanhedrin → Makkot → Shevuot → AZ → Horayot
4. Remaining Kodashim: Zevachim
5. Seder Taharot: Niddah

### Total remaining: ~1,259 dapim
Yevamot remainder (46), Ketubot (111), Nedarim (90), Nazir (65), Sotah (48), Gittin (89), Kiddushin (81), Bava Kamma (118), Bava Metzia (119), Bava Batra (176), Sanhedrin (113), Makkot (24), Shevuot (49), Avodah Zarah (76), Horayot (14), Zevachim (120), Niddah (73)

### Known pipeline bug (Mar 27)
The overnight script (`build-overnight.sh`) committed index pages for masechtos without actually generating daf content. The `build-daf.js` step ran but produced no output because the content JSONs in `/tmp/daf_content/` were empty or missing. Need to verify JSON generation completed before running builder + committing. Add validation step.

## Lessons Learned

1. **Sub-agents timeout** at 5min for this task. Claude CLI parallel pipeline is 10x more reliable.
2. **15 parallel CLI calls** is the sweet spot — fast without overwhelming the system.
3. **JSON validation** catches ~2-5% failures per batch. Auto-retry handles them.
4. **Content JSON separation** from HTML is the key insight — the AI generates structured data, the builder handles all presentation.
5. **Process steps must be vertical** — horizontal circles break on mobile.
6. **Speaker bubbles** need pill shape with word-wrap for names like "Rav Chisda".
7. **Summary map backgrounds** must be sanitized — AI sometimes generates light pastel colors that wash out text.
8. **Index pages** use JS-generated daf links with Hebrew numerals — just update `maxDaf`.

## Git Workflow
- Repo: `https://github.com/Y2JCPA/daf-yomi`
- Pages: `https://y2jcpa.github.io/daf-yomi/`
- Branch: `main`
- Commit after each masechet, not each daf
- Git email: `y2jadvisors@gmail.com`
