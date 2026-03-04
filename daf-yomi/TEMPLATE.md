# Daf Yomi Visual Guide — Build Spec

## How to Use This Spec

When Yaacov says "continue the daf yomi project":

1. **Read this file** for format/style rules
2. **Check the repo** — look at `chullin/` (or current masechet) to find the last daf folder created
3. **Check the index page** (`chullin/index.html`) to see which dapim are linked
4. **Continue from the next daf** — build `index.html` + `quiz.html` for each
5. **Update the index page** to add links for new dapim
6. **Git commit and push** when done

---

## Repository Layout

```
~/.openclaw/workspace/daf-yomi/daf-yomi/
├── TEMPLATE.md          ← this file
├── menachot/            ← COMPLETE (dapim 2–110)
│   ├── index.html       ← masechet index
│   ├── 2/ ... 110/      ← one folder per daf
│   └── 47/index.html    ← GOLD STANDARD — reference for quality
├── chullin/             ← IN PROGRESS (142 dapim total, 2–142)
│   ├── index.html       ← masechet index
│   └── 2/ ... N/        ← folders created so far
└── (future masechtos)
```

- **Repo**: `https://github.com/Y2JCPA/daf-yomi.git`, branch `main`
- **GitHub Pages URL**: `https://y2jcpa.github.io/daf-yomi/daf-yomi/{masechet}/{daf_num}/`
- **Git committer**: `Coren Silverman <corensilverman@mac.lan>`

---

## Per-Daf Files

Each daf gets a folder: `{masechet}/{daf_num}/` containing:

| File | Purpose | Approx Size |
|------|---------|-------------|
| `index.html` | 9-slide visual guide | ~400–450 lines |
| `quiz.html` | 5-question self-graded quiz | ~200 lines (minified JS) |

---

## Content Sourcing

1. **Sefaria API** — `https://www.sefaria.org/api/v3/texts/{masechet}.{daf}a` (William Davidson Edition)
2. **DafYomi.co.il** — supplemental context
3. Each daf covers ONE amud (side) or both amudim of the page
4. Content must be **accurate Talmud content** — don't invent halachot or misattribute opinions

---

## Slide Structure (index.html) — 9 Slides

| # | Slide | Content |
|---|-------|---------|
| 1 | **Title** | Daf number, Hebrew (חולין ו׳), large emoji, key topics list with emoji bullets. Gradient background. |
| 2 | **Overview** | Set the scene — what is the Gemara discussing? Callout box or debate format. |
| 3–7 | **Content** | 5 slides with **varied visual types** (see Visual Components below). NEVER use the same component type twice in a row. |
| 8 | **Summary Map** | Flowchart recap of the daf's structure. Ends with a 🎓 "Key Principle" box. Footer: `Chullin Xa-Xb · Daf Yomi` |
| 9 | **Quiz CTA** | Large 📝 emoji, "Ready to Test Yourself?" heading, gold button linking to `quiz.html` |

### Visual Components (mix 5 of these for slides 3–7)

- **Flowchart** — vertical decision tree with `flow-box` → `flow-arrow` → branches
- **Comparison boxes** — side-by-side `.compare-box` with colored top borders, bullet lists
- **Debate bubbles** — `.debate-line` with round `.speaker` avatars (2-letter initials), `.speech` boxes. Alternate `.right` class for back-and-forth
- **Table** — `<table>` with gold `<th>` headers, alternating row backgrounds
- **Callout box** — `.callout` with gold left border, key quote or principle
- **Process cards** — flex row of numbered cards (1️⃣ 2️⃣ 3️⃣) with titles and descriptions
- **Hebrew source text** — `.hebrew` class with RTL direction, David font

### Variety Rule
Each daf should use **at least 4 different visual types** across slides 3–7. If daf N-1 led with a flowchart, start daf N with a debate or table instead.

---

## Design System (Inline CSS)

All CSS is inlined in each HTML file. No external stylesheets.

### Colors
| Token | Hex | Use |
|-------|-----|-----|
| Background | `#1a1a2e` | Page background |
| Card/panel | `#16213e` | Boxes, cards, speech bubbles |
| Text | `#e0e0e0` | Body text |
| Gold | `#c9a84c` | Headers, accents, borders, buttons |
| Bright gold | `#daa520` | Compare box h3 headings |
| Blue | `#4a90d9` | One side of debates, actions |
| Green | `#4caf50` | Valid/kosher/positive results |
| Red | `#e74c3c` | Invalid/treif/negative results |
| Purple | `#9b59b6` | Questions, dilemmas |
| Orange/yellow | `#f39c12` | Uncertain, partial, disputed |
| Hebrew text | `#e8d5a3` | Hebrew passages |
| Muted | `#aaa` | Subtitles, secondary text |
| Footer text | `#666` | Slide footers |

### Typography
- **Body**: `'Georgia', serif`
- **Hebrew**: `font-family: 'David', 'Times New Roman', serif; direction: rtl;`
- **Headings**: h1 = 2.8em gold, h2 = 2em gold

### Key CSS Classes
```css
.slide        — min-height:100vh, flex column center, border-bottom 3px solid gold
.slide-num    — absolute top-right, 14px gold, opacity .7
.flow-box     — 16213e bg, 2px gold border, 12px radius, 16px 24px padding
.result-good  — 1a4a2a bg, green border
.result-bad   — 4a1a1a bg, red border
.question     — 3a1a4a bg, purple border
.flow-arrow   — 28px gold ↓
.compare-box  — flex:1, 12px radius, 24px padding, 4px top border
.callout      — 16213e bg, 5px gold left border, 0 8px 8px 0 radius
.debate-line  — flex row, gap 12px. Add .right for reverse
.speaker      — 40px circle, gold bg, bold initials
.speech       — 16213e bg, 12px radius. Right speeches use #1a3a5c
.hebrew       — David font, RTL, #e8d5a3
```

---

## Navigation Elements

### Breadcrumb (fixed top-left)
```html
<div style="position:fixed;top:15px;left:20px;z-index:100">
  <a href="../" style="color:#c9a84c;text-decoration:none;font-size:.85em;opacity:.8">← Chullin Index</a>
</div>
```

### Prev/Next Nav (fixed bottom-right)
```html
<div class="nav">
  <a href="../{N-1}/">← Daf {N-1}</a>
  <a href="../{N+1}/">Daf {N+1} →</a>
</div>
```
- First daf of masechet: no prev link
- Last daf of masechet: no next link (siyum page)

---

## Quiz Structure (quiz.html)

### Format
- Breadcrumb: `← Back to Slides` linking to `./`
- 📝 emoji + `{Masechet} {N} Quiz` heading + "5 questions · Self-graded" subtitle
- 5 questions, each with:
  - Question number label (`QUESTION X OF 5`)
  - Question text
  - 4 options (A/B/C/D)
  - Hidden explanation (revealed after grading)
- Submit button (disabled until all 5 answered)
- Results panel: score X/5, encouraging message, "Back to Slides" + "Try Again" buttons

### JavaScript Behavior
- `select(q, el, idx)` — highlight selected option, enable submit when all answered
- `grade()` — compare answers, show right/wrong styling, reveal explanations, show results
- `retry()` — reset everything, scroll to top
- Answer key stored as `const answers = {1: correctIdx, 2: correctIdx, ...}`

### Score Messages (by score 0–5)
```js
["Review the slides! 📖", "Getting there! 💪", "Not bad! 👍", "Solid! 🎯", "Almost perfect! 🔥", "Perfect score! 🏆"]
```

### Quiz Quality Rules
- Questions should test **understanding**, not just memorization
- At least 1 question about a halachic principle (not just "who said X")
- At least 1 question connecting the daf to broader themes
- Distractors should be plausible (not obviously wrong)
- Explanations should teach — not just say "correct answer is B"

---

## Masechet Index Page (`{masechet}/index.html`)

### Structure
- Breadcrumb: `← All Masechtos` → `../../`
- Masechet name (English + Hebrew)
- Subtitle describing the masechet's scope
- Grid of daf links (`.daf-list` flex wrap)
- Each link: daf number (gold) + Hebrew letter(s) below
- Footer: `Built with ☕ by Yaacov & Akiva`

### When adding dapim
- Add `<a>` links for each new daf to the grid
- Hebrew letter numbering: ב=2, ג=3, ד=4, ה=5, ו=6, ז=7, ח=8, ט=9, י=10, יא=11... כ=20, ל=30, מ=40, נ=50, ס=60, ע=70, פ=80, צ=90, ק=100, קא=101...
- Siyum daf (last daf): special gold border + purple bg + 🏆 emoji

### Daf link HTML
```html
<a href="{N}/" class="daf-link">
  <div class="num">{N}</div>
  <div class="hebrew" style="font-size:.85em;margin-top:4px">{Hebrew}</div>
</a>
```

---

## Git Workflow

1. Build all files for the batch
2. `cd ~/.openclaw/workspace/daf-yomi`
3. `git add daf-yomi/chullin/` (or specific paths)
4. `git commit -m "Chullin: dafs X-Y + index update"`
5. `git push origin main`

---

## Current Status

### Completed Masechtos
- **Menachot** — 109 dapim (2–110), all live ✅

### In Progress
- **Chullin** — 142 dapim (2–142)
  - Check `chullin/` folder to see last daf created
  - Check `chullin/index.html` to see last daf linked

### Future Masechtos (Seder Kodashim order)
After Chullin: Bekhorot, Arakhin, Temurah, Keritot, Me'ilah, Tamid, Middot, Kinnim

---

## Quality Checklist (per daf)

- [ ] 9 slides with varied visual components
- [ ] Accurate Talmud content (verify against Sefaria)
- [ ] Hebrew text where relevant (RTL, David font)
- [ ] Navigation: breadcrumb + prev/next
- [ ] Quiz: 5 questions, plausible distractors, teaching explanations
- [ ] No broken links (prev/next daf numbers correct)
- [ ] Footer: `Built with ☕ by Yaacov & Akiva` (on index page)
