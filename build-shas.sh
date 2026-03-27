#!/bin/bash
# Build Daf Yomi pages across all of Shas
# Picks up wherever it left off — skips existing dapim

REPO_DIR="$HOME/.openclaw/workspace/daf-yomi/daf-yomi"
CONTENT_DIR="/tmp/daf_content"
BUILDER="$REPO_DIR/build-daf.js"
GENERATOR="/tmp/generate_daf_content.sh"
LOG="/tmp/daf-yomi-shas.log"
MAIN_INDEX="$HOME/.openclaw/workspace/daf-yomi/index.html"

mkdir -p "$CONTENT_DIR"

echo "=== Shas build started $(date) ===" >> "$LOG"

# All masechtos in Shas order
# Format: name:total_dapim:display_name:hebrew:emoji:description
MASECHTOS=(
  "berakhot:64:Berakhot:ברכות:🙏:Blessings, prayers, Shema, and grace after meals."
  "shabbat:157:Shabbat:שבת:🕯️:Laws of Shabbat — melachot, carrying, Shabbat candles."
  "eruvin:105:Eruvin:עירובין:🔗:Domains, enclosures, and carrying on Shabbat."
  "pesachim:121:Pesachim:פסחים:🫓:Passover — chametz, matzah, the Seder, Korban Pesach."
  "shekalim:22:Shekalim:שקלים:🪙:The half-shekel tax and Temple maintenance."
  "yoma:88:Yoma:יומא:🕊️:Yom Kippur — the Temple service and atonement."
  "sukkah:56:Sukkah:סוכה:🏗️:Laws of the sukkah, lulav, and Simchat Beit HaShoevah."
  "beitzah:40:Beitzah:ביצה:🥚:Yom Tov — cooking, carrying, and holiday preparations."
  "rosh-hashanah:35:Rosh Hashanah:ראש השנה:📯:New Year — shofar, calendar, and judgment."
  "taanit:31:Taanit:תענית:🌧️:Fast days — rain prayers, communal fasts, Tu B'Av."
  "megillah:32:Megillah:מגילה:📜:Purim — reading the Megillah, synagogue practices."
  "moed-katan:29:Moed Katan:מועד קטן:🔨:Chol HaMoed — permitted work, mourning on holidays."
  "chagigah:27:Chagigah:חגיגה:🎉:Festival offerings, purity, and mystical teachings."
  "yevamot:122:Yevamot:יבמות:👞:Levirate marriage and release (chalitzah)."
  "ketubot:112:Ketubot:כתובות:💍:Marriage contracts, obligations, and settlements."
  "nedarim:91:Nedarim:נדרים:🗣️:Vows — making, annulling, and their consequences."
  "nazir:66:Nazir:נזיר:✂️:The Nazirite vow — wine, haircuts, and impurity."
  "sotah:49:Sotah:סוטה:⚖️:The suspected wife, the sotah ritual, and related topics."
  "gittin:90:Gittin:גיטין:📃:Divorce — writing, delivering, and the get."
  "kiddushin:82:Kiddushin:קידושין:💎:Betrothal — methods, agency, and lineage."
  "bava-kamma:119:Bava Kamma:בבא קמא:💥:Damages — the ox, the pit, fire, and injury."
  "bava-metzia:119:Bava Metzia:בבא מציעא:🤝:Found objects, bailees, workers, and lending."
  "bava-batra:176:Bava Batra:בבא בתרא:🏠:Property, neighbors, inheritance, and documents."
  "sanhedrin:113:Sanhedrin:סנהדרין:🏛️:Courts, capital punishment, and the World to Come."
  "makkot:24:Makkot:מכות:⚡:Lashes, false witnesses, and cities of refuge."
  "shevuot:49:Shevuot:שבועות:✋:Oaths — types, liability, and court testimony."
  "avodah-zarah:76:Avodah Zarah:עבודה זרה:🚫:Idolatry — prohibited practices and interactions."
  "horayot:14:Horayot:הוריות:📋:Erroneous rulings — when courts make mistakes."
  "zevachim:120:Zevachim:זבחים:🔥:Animal offerings — procedures, intentions, and disqualifications."
  "niddah:73:Niddah:נידה:💧:Family purity — menstrual laws and ritual immersion."
)

for ENTRY in "${MASECHTOS[@]}"; do
  IFS=':' read -r MASECHET TOTAL DISPLAY_NAME HEBREW EMOJI DESC <<< "$ENTRY"
  
  echo "=== Checking $MASECHET ($TOTAL dapim) ===" >> "$LOG"
  
  # Find missing dapim
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
  for ((start=0; start<${#MISSING[@]}; start+=15)); do
    BATCH=("${MISSING[@]:$start:15}")
    echo "  Building dapim: ${BATCH[*]}" >> "$LOG"
    
    for DAF in "${BATCH[@]}"; do
      if [ ! -f "$CONTENT_DIR/${MASECHET}_${DAF}.json" ]; then
        bash "$GENERATOR" "$MASECHET" "$DAF" &
      fi
    done
    wait
  done
  
  # Validate + retry bad JSONs
  BAD_LIST=()
  for DAF in "${MISSING[@]}"; do
    f="$CONTENT_DIR/${MASECHET}_${DAF}.json"
    if [ ! -f "$f" ]; then
      BAD_LIST+=($DAF)
      continue
    fi
    result=$(python3 -c "import json; d=json.load(open('$f')); assert len(d.get('slides',[])) >= 4; assert len(d.get('quiz',[])) >= 4; print('OK')" 2>&1)
    if [ "$result" != "OK" ]; then
      rm -f "$f"
      BAD_LIST+=($DAF)
    fi
  done
  
  for DAF in "${BAD_LIST[@]}"; do
    echo "  Retrying $MASECHET $DAF" >> "$LOG"
    bash "$GENERATOR" "$MASECHET" "$DAF"
  done
  
  # Build HTML
  node "$BUILDER" "$CONTENT_DIR" "$REPO_DIR" "$MASECHET" "$TOTAL" >> "$LOG" 2>&1
  
  # Create masechet index page if needed
  if [ ! -f "$REPO_DIR/$MASECHET/index.html" ]; then
    python3 - "$MASECHET" "$TOTAL" "$DISPLAY_NAME" "$HEBREW" "$EMOJI" "$DESC" "$REPO_DIR" <<'PYEOF'
import sys, os
masechet, total, display, hebrew, emoji, desc, repo = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7]
he = ['','','ב','ג','ד','ה','ו','ז','ח','ט','י','י״א','י״ב','י״ג','י״ד','ט״ו','ט״ז','י״ז','י״ח','י״ט','כ','כ״א','כ״ב','כ״ג','כ״ד','כ״ה','כ״ו','כ״ז','כ״ח','כ״ט','ל','ל״א','ל״ב','ל״ג','ל״ד','ל״ה','ל״ו','ל״ז','ל״ח','ל״ט','מ','מ״א','מ״ב','מ״ג','מ״ד','מ״ה','מ״ו','מ״ז','מ״ח','מ״ט','נ','נ״א','נ״ב','נ״ג','נ״ד','נ״ה','נ״ו','נ״ז','נ״ח','נ״ט','ס','ס״א','ס״ב','ס״ג','ס״ד','ס״ה','ס״ו','ס״ז','ס״ח','ס״ט','ע','ע״א','ע״ב','ע״ג','ע״ד','ע״ה','ע״ו','ע״ז','ע״ח','ע״ט','פ','פ״א','פ״ב','פ״ג','פ״ד','פ״ה','פ״ו','פ״ז','פ״ח','פ״ט','צ','צ״א','צ״ב','צ״ג','צ״ד','צ״ה','צ״ו','צ״ז','צ״ח','צ״ט','ק','ק״א','ק״ב','ק״ג','ק״ד','ק״ה','ק״ו','ק״ז','ק״ח','ק״ט','ק״י','קי״א','קי״ב','קי״ג','קי״ד','קט״ו','קט״ז','קי״ז','קי״ח','קי״ט','ק״כ','קכ״א','קכ״ב','קכ״ג','קכ״ד','קכ״ה','קכ״ו','קכ״ז','קכ״ח','קכ״ט','ק״ל','קל״א','קל״ב','קל״ג','קל״ד','קל״ה','קל״ו','קל״ז','קל״ח','קל״ט','ק״מ','קמ״א','קמ״ב','קמ״ג','קמ״ד','קמ״ה','קמ״ו','קמ״ז','קמ״ח','קמ״ט','ק״נ','קנ״א','קנ״ב','קנ״ג','קנ״ד','קנ״ה','קנ״ו','קנ״ז','קנ״ח','קנ״ט','ק״ס','קס״א','קס״ב','קס״ג','קס״ד','קס״ה','קס״ו','קס״ז','קס״ח','קס״ט','ק״ע','קע״א','קע״ב','קע״ג','קע״ד','קע״ה','קע״ו']
he_json = str(he[:total+1]).replace("'", '"')
os.makedirs(f"{repo}/{masechet}", exist_ok=True)
html = f'''<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>{display} — Daf Yomi</title><style>*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:'Georgia',serif;background:#1a1a2e;color:#e0e0e0;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:40px 20px}}h1{{font-size:2.8em;color:#c9a84c;margin-bottom:5px}}.hebrew-title{{font-family:'David','Times New Roman',serif;direction:rtl;font-size:1.8em;color:#e8d5a3;margin-bottom:10px}}.subtitle{{color:#aaa;font-size:1em;max-width:600px;text-align:center;margin-bottom:40px;line-height:1.6}}.breadcrumb{{margin-bottom:20px}}.breadcrumb a{{color:#c9a84c;text-decoration:none}}.daf-list{{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:700px}}.daf-link{{background:#16213e;border:2px solid #c9a84c;border-radius:10px;padding:16px 24px;text-align:center;text-decoration:none;color:#e0e0e0;min-width:80px;transition:transform 0.2s,border-color 0.2s;font-size:1.1em}}.daf-link:hover{{transform:translateY(-3px);border-color:#f0d060}}.daf-link .num{{color:#c9a84c;font-size:1.3em;font-weight:bold}}footer{{margin-top:60px;color:#555;font-size:0.85em}}</style></head><body><div class="breadcrumb"><a href="../../">← All Masechtos</a></div><h1>{display}</h1><div class="hebrew-title">{hebrew}</div><div class="subtitle">{emoji} {desc} {total} dapim</div><div class="daf-list" id="dafList"></div><script>const heNums={he_json};const maxDaf={total};const list=document.getElementById('dafList');for(let d=2;d<=maxDaf;d++){{const a=document.createElement('a');a.href=d+'/';a.className='daf-link';a.innerHTML='<div class="num">'+d+'</div><div style="font-size:0.8em;color:#aaa">'+(heNums[d]||'')+'</div>';list.appendChild(a);}}</script><footer>Built with ☕ by Yaacov & Akiva</footer></body></html>'''
with open(f"{repo}/{masechet}/index.html", 'w') as f: f.write(html)
print(f"Created index for {masechet}")
PYEOF
  fi
  
  # Add to main index if not already there
  if ! grep -q "daf-yomi/$MASECHET/" "$MAIN_INDEX"; then
    sed -i '' "s|</div>.*<footer>|<a href=\"daf-yomi/$MASECHET/\" class=\"masechta-card\"><h2>$DISPLAY_NAME</h2><div class=\"hebrew\">$HEBREW</div><div class=\"count\">$TOTAL dapim</div></a></div><footer>|" "$MAIN_INDEX"
    echo "  Added $MASECHET to main index" >> "$LOG"
  fi
  
  # Git push
  cd "$HOME/.openclaw/workspace/daf-yomi"
  git add -A
  git -c user.email="y2jadvisors@gmail.com" -c user.name="Yaacov Jacob" \
    commit -m "Complete $DISPLAY_NAME: ${#MISSING[@]} dapim built via pipeline" >> "$LOG" 2>&1
  git push >> "$LOG" 2>&1
  
  echo "=== $MASECHET complete! $(date) ===" >> "$LOG"
done

echo "=== Shas build finished $(date) ===" >> "$LOG"
