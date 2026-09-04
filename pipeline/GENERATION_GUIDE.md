# Content generation guide (pipeline/content/*.json)

Each daf gets one JSON file: `pipeline/content/<masechet>_<daf>.json`.
Source text: `pipeline/sources/<masechet>_<daf>.md` (Sefaria, William Davidson / Steinsaltz English + vocalized Aramaic).
Exemplar of the exact format and quality bar: `pipeline/content/berakhot_2.json`.
Validate with `node pipeline/validate.js <masechet> <daf>` — it must print `ok`.

## Non-negotiable rules
1. **Only this daf, only this masechet.** Every topic, slide and quiz question must come from the source file for this daf (amud a and b). Never fill in from memory of another tractate. Never mention a siyum unless the source really ends the tractate.
2. **Accuracy.** Attribute opinions to the sages the source names. Quote verses with their citation as the source gives it. Do not invent halakhot.
3. **Field names exactly as in the schema below.** Every slide needs `type` and `title`. Missing titles rendered as `undefined` on the live site; the validator rejects them.
4. **Exactly 5 content slides**, at least 4 distinct types, never the same type twice in a row.
5. **Exactly 5 quiz questions**, 4 options each, `c` = 0-based index of the correct option, `e` = explanation. Distractors must be plausible; test understanding, not trivia.
6. Titles start with an emoji. Topics start with an emoji, then `Topic — short description`.
7. Inline HTML allowed inside text fields: `<em>`, `<strong>`, `<span class='hebrew'>…</span>` for Hebrew. Use single quotes inside HTML attributes. No `<h1>`/`<h2>`/`<div>`.
8. Include Hebrew key phrases where they matter (the vocalized text is in the source).
9. Keep each slide readable on one screen: 4-8 nodes/rows/lines/steps, sentences not paragraphs.

## Schema
```json
{
  "masechet": "<slug>", "daf": <int>, "emoji": "🌙",
  "topics": ["🌙 Topic — description", ... 5-6 items],
  "overview": { "type": "callout", "title": "📖 Overview: …", "subtitle": "<Masechet> <daf>a–<daf>b", "hebrewSource": "optional", "label": "The scene:", "text": "3-5 sentences on what the daf discusses and how it flows" },
  "slides": [ five of the types below ],
  "summary": { "principle": "one sentence", "flowSteps": [ {"content": "…", "class": "question|action|result-good|result-bad|", "style": ""}, {"type":"arrow"}, {"type":"branch","columns":[{"content":"…","style":""},{"content":"…","style":""}]}, {"type":"arrow"}, {"content":"🎓 Key Principle: …","class":"result-good","style":""} ] },
  "quiz": [ {"q":"…","o":["A","B","C","D"],"c":0,"e":"…"} × 5 ]
}
```
Slide types (each also accepts optional `"subtitle"` and `"callout": {"label": "…", "text": "…"}`):
- `debate`: `"lines": [{"speaker":"Rava","side":"left|right","text":"…"}]` — speaker labels short (≤ 12 chars); alternate sides for back-and-forth.
- `flowchart`: `"nodes": [{"content":"…","class":"question|action|result-good|result-bad|result-partial|"}, {"type":"arrow"}, {"type":"branch","columns":[{"label":"…","content":"…","class":"…"}]}]`
- `comparison`: `"boxes": [{"title":"…","color":"#4caf50","titleColor":"#4caf50","items":["…"]}]` (2-3 boxes; colors: green #4caf50 valid, red #e74c3c invalid, blue #4a90d9, orange #f39c12 disputed, purple #9b59b6)
- `table`: `"headers": ["…"], "rows": [["…","…"]]`
- `callout`: `"label": "…", "text": "…", "hebrewSource": "optional Hebrew"`
- `process`: `"steps": [{"content":"1️⃣ …","highlight": false}]` (mark the conclusion `highlight: true`)
