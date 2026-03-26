#!/bin/bash
# Overnight Daf Yomi builder — works through Seder Kodashim
# Generates content JSON → builds HTML → pushes to GitHub
# Picks up wherever it left off

REPO_DIR="$HOME/.openclaw/workspace/daf-yomi/daf-yomi"
CONTENT_DIR="/tmp/daf_content"
BUILDER="$REPO_DIR/build-daf.js"
GENERATOR="/tmp/generate_daf_content.sh"
LOG="/tmp/daf-yomi-overnight.log"

mkdir -p "$CONTENT_DIR"

echo "=== Overnight build started $(date) ===" >> "$LOG"

# Masechtos in Seder Kodashim order after Chullin
# Format: name:total_dapim:sefaria_name
MASECHTOS=(
  "chullin:142:Chullin"
  "bekhorot:61:Bekhorot"
  "arakhin:34:Arakhin"
  "temurah:34:Temurah"
  "keritot:28:Keritot"
  "meilah:22:Meilah"
  "tamid:33:Tamid"
)

for ENTRY in "${MASECHTOS[@]}"; do
  IFS=':' read -r MASECHET TOTAL SEFARIA_NAME <<< "$ENTRY"
  
  echo "=== Checking $MASECHET ($TOTAL dapim) ===" >> "$LOG"
  
  # Find missing dapim (check if HTML exists in repo)
  MISSING=()
  for i in $(seq 2 $TOTAL); do
    if [ ! -f "$REPO_DIR/$MASECHET/$i/index.html" ]; then
      MISSING+=($i)
    fi
  done
  
  if [ ${#MISSING[@]} -eq 0 ]; then
    echo "$MASECHET: complete, skipping" >> "$LOG"
    continue
  fi
  
  echo "$MASECHET: ${#MISSING[@]} dapim to build" >> "$LOG"
  
  # Generate content JSON in batches of 15
  BATCH_NUM=0
  for ((start=0; start<${#MISSING[@]}; start+=15)); do
    BATCH_NUM=$((BATCH_NUM+1))
    BATCH=("${MISSING[@]:$start:15}")
    echo "  Batch $BATCH_NUM: dapim ${BATCH[*]}" >> "$LOG"
    
    # Launch parallel generation
    for DAF in "${BATCH[@]}"; do
      if [ ! -f "$CONTENT_DIR/${MASECHET}_${DAF}.json" ]; then
        bash "$GENERATOR" "$MASECHET" "$DAF" &
      fi
    done
    wait
    
    echo "  Batch $BATCH_NUM done" >> "$LOG"
  done
  
  # Validate all content JSONs
  BAD_LIST=()
  for DAF in "${MISSING[@]}"; do
    f="$CONTENT_DIR/${MASECHET}_${DAF}.json"
    if [ ! -f "$f" ]; then
      BAD_LIST+=($DAF)
      continue
    fi
    result=$(python3 -c "
import json
d=json.load(open('$f'))
assert len(d.get('slides',[])) >= 4
assert len(d.get('quiz',[])) >= 4
print('OK')
" 2>&1)
    if [ "$result" != "OK" ]; then
      rm -f "$f"
      BAD_LIST+=($DAF)
    fi
  done
  
  # Retry bad ones (one at a time)
  for DAF in "${BAD_LIST[@]}"; do
    echo "  Retrying $MASECHET $DAF" >> "$LOG"
    bash "$GENERATOR" "$MASECHET" "$DAF"
  done
  
  # Build HTML
  echo "  Building HTML for $MASECHET..." >> "$LOG"
  node "$BUILDER" "$CONTENT_DIR" "$REPO_DIR" "$MASECHET" "$TOTAL" >> "$LOG" 2>&1
  
  # Create masechet index if it doesn't exist
  if [ ! -f "$REPO_DIR/$MASECHET/index.html" ]; then
    echo "  Creating index for $MASECHET" >> "$LOG"
    python3 -c "
masechet = '$MASECHET'
total = $TOTAL
sefaria = '$SEFARIA_NAME'

# Hebrew numerals
he = ['','','ב','ג','ד','ה','ו','ז','ח','ט','י','י״א','י״ב','י״ג','י״ד','ט״ו','ט״ז','י״ז','י״ח','י״ט','כ','כ״א','כ״ב','כ״ג','כ״ד','כ״ה','כ״ו','כ״ז','כ״ח','כ״ט','ל','ל״א','ל״ב','ל״ג','ל״ד','ל״ה','ל״ו','ל״ז','ל״ח','ל״ט','מ','מ״א','מ״ב','מ״ג','מ״ד','מ״ה','מ״ו','מ״ז','מ״ח','מ״ט','נ','נ״א','נ״ב','נ״ג','נ״ד','נ״ה','נ״ו','נ״ז','נ״ח','נ״ט','ס','ס״א','ס״ב']

he_names = {
  'bekhorot': ('Bekhorot', 'בכורות', '🐄 Firstborn animals — their sanctity, redemption, blemishes, and tithes.'),
  'arakhin': ('Arakhin', 'ערכין', '💰 Valuations — vows of monetary worth, consecrated property, and the Jubilee.'),
  'temurah': ('Temurah', 'תמורה', '🔄 Substitution — exchanging consecrated animals, the laws of what results.'),
  'keritot': ('Keritot', 'כריתות', '⚠️ Excision — sins punishable by kareit, their atonement through offerings.'),
  'meilah': (\"Me'ilah\", 'מעילה', '⛔ Trespass — misuse of consecrated property, liability and restitution.'),
  'tamid': ('Tamid', 'תמיד', '🌅 The daily offering — the Temple morning and evening service procedures.'),
}

info = he_names.get(masechet, (sefaria, masechet, f'{total} dapim'))
en_name, he_name, desc = info

he_json = str(he[:total+1]).replace(\"'\", '\"')

html = f'''<!DOCTYPE html>
<html lang=\"en\">
<head>
<meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
<title>{en_name} — Daf Yomi</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:'Georgia',serif;background:#1a1a2e;color:#e0e0e0;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:40px 20px}}
h1{{font-size:2.8em;color:#c9a84c;margin-bottom:5px}}
.hebrew-title{{font-family:'David','Times New Roman',serif;direction:rtl;font-size:1.8em;color:#e8d5a3;margin-bottom:10px}}
.subtitle{{color:#aaa;font-size:1em;max-width:600px;text-align:center;margin-bottom:40px;line-height:1.6}}
.breadcrumb{{margin-bottom:20px}}.breadcrumb a{{color:#c9a84c;text-decoration:none}}
.daf-list{{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:700px}}
.daf-link{{background:#16213e;border:2px solid #c9a84c;border-radius:10px;padding:16px 24px;text-align:center;text-decoration:none;color:#e0e0e0;min-width:80px;transition:transform 0.2s,border-color 0.2s;font-size:1.1em}}
.daf-link:hover{{transform:translateY(-3px);border-color:#f0d060}}
.daf-link .num{{color:#c9a84c;font-size:1.3em;font-weight:bold}}
footer{{margin-top:60px;color:#555;font-size:0.85em}}
</style>
</head>
<body>
<div class=\"breadcrumb\"><a href=\"../../\">← All Masechtos</a></div>
<h1>{en_name}</h1>
<div class=\"hebrew-title\">{he_name}</div>
<div class=\"subtitle\">{desc} {total} dapim · Seder Kodashim</div>
<div class=\"daf-list\" id=\"dafList\"></div>
<script>
const heNums = {he_json};
const maxDaf = {total};
const list = document.getElementById('dafList');
for (let d = 2; d <= maxDaf; d++) {{
  const a = document.createElement('a');
  a.href = d + '/';
  a.className = 'daf-link';
  a.innerHTML = '<div class=\"num\">' + d + '</div><div style=\"font-size:0.8em;color:#aaa\">' + (heNums[d]||'') + '</div>';
  list.appendChild(a);
}}
</script>
<footer>Built with ☕ by Yaacov & Akiva</footer>
</body>
</html>'''

with open('$REPO_DIR/$MASECHET/index.html', 'w') as f:
    f.write(html)
print('Created index')
" >> "$LOG" 2>&1
  fi
  
  # Git push after each masechet
  cd "$HOME/.openclaw/workspace/daf-yomi"
  git add -A
  git -c user.email="y2jadvisors@gmail.com" -c user.name="Yaacov Jacob" \
    commit -m "Complete $SEFARIA_NAME: ${#MISSING[@]} dapim built via pipeline" >> "$LOG" 2>&1
  git push >> "$LOG" 2>&1
  
  echo "=== $MASECHET complete! $(date) ===" >> "$LOG"
done

echo "=== Overnight build finished $(date) ===" >> "$LOG"
