# Daf Yomi Visual Guide — Template

## Structure
Each daf gets a folder: `menachot/{daf_num}/` containing:
- `index.html` — 8-10 slide visual guide
- `quiz.html` — 5 multiple-choice questions

## Slide Structure (index.html)
1. **Title Slide** — Daf number, Hebrew, emoji, key topics list (gradient bg)
2. **Overview/Context** — Set the scene, what is the Gemara discussing
3-7. **Content Slides** — Mix of:
   - Flowcharts (decision trees, process diagrams)
   - Comparison tables (machlokes between Tanna'im/Amora'im)
   - Side-by-side boxes (contrasting opinions)
   - Debate bubbles (back-and-forth between Rabbis)
   - Process bars (step-by-step procedures)
   - Tables with checkmarks/crosses
   - Callout boxes for key principles
   - Hebrew source text where relevant
8. **Summary Map** — Visual recap of the daf's structure
9. **Quiz CTA** — Link to quiz.html

## Design System
- Dark theme: bg #1a1a2e, text #e0e0e0
- Gold accent: #c9a84c (headers, borders, highlights)
- Blue: #4a90d9 (actions, one side of debates)
- Green: #4caf50 (positive/valid results)
- Red: #e74c3c (negative/invalid results)
- Purple: #9b59b6 (questions/dilemmas)
- Orange: #f39c12 (partial/uncertain)
- Font: Georgia serif
- Hebrew: David / Times New Roman, RTL, color #e8d5a3

## Navigation
- Fixed breadcrumb top-left: `← Menachot Index`
- Fixed nav bottom-right: `← Daf {N-1}` and `Daf {N+1} →`
- Quiz link on last slide

## Quiz Structure (quiz.html)
- Breadcrumb back to slides
- 5 multiple-choice questions (4 options each)
- Self-grading JavaScript
- Explanations shown after submit
- Score with encouraging messages
- Retry button

## Index Page
- Grid of daf links with Hebrew letter
- Breadcrumb to All Masechtos
- Footer: "Built with ☕ by Yaacov & Akiva"
