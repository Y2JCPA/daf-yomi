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

### Completed Masechtos
| Masechet | Hebrew | Dapim | Status |
|----------|--------|-------|--------|
| Menachot | מנחות | 109 | ✅ Complete (hand-built) |
| Chullin | חולין | 142 | ✅ Complete (2-49 hand-built, 50-142 pipeline) |
| Bekhorot | בכורות | 60 | ✅ Complete (pipeline, Mar 26 overnight) |
| Arakhin | ערכין | 33 | ✅ Complete (pipeline, Mar 26 overnight) |
| Temurah | תמורה | 33 | ✅ Complete (pipeline, Mar 26 overnight) |
| Keritot | כריתות | 27 | ✅ Complete (pipeline, Mar 26 overnight) |
| Me'ilah | מעילה | 21 | ✅ Complete (pipeline, Mar 26 overnight) |
| Tamid | תמיד | 32 | ✅ Complete (pipeline, Mar 26 overnight) |

**Total: ~457 dapim across 8 masechtos**

### Remaining (Seder Kodashim)
| Masechet | Dapim | Notes |
|----------|-------|-------|
| Middot | 5 chapters (no dapim) | Mishnah-only, no Gemara |
| Kinnim | 3 chapters (no dapim) | Mishnah-only, no Gemara |

### Future Sedarim
Can extend to any seder: Nashim, Nezikin, Mo'ed, Zeraim, Taharot.
Same pipeline works — just add masechet to `MASECHET_NAMES` in build-daf.js,
`SEFARIA_MAP` in generate script, and `MASECHTOS` array in overnight script.

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
