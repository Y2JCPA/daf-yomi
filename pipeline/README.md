# Daf Yomi content pipeline

Rebuilt Sept 2026 after the site audit found 331 pages carrying the wrong masechet's content
(Berakhot and Shabbat 2-61/73/75 had Niddah; Arakhin, Bekhorot, Keritot, Meilah, Tamid and Temurah had
Menachot) and 145 slides rendered with an `undefined` title. The original generator and its content
JSONs lived in `/tmp` and were lost, so this directory keeps every artifact in the repo.

```
pipeline/
  fetch-sefaria.js   Sefaria API → sources/<masechet>_<daf>.md   (English + vocalized Aramaic, both amudim)
  GENERATION_GUIDE.md rules + schema for writing content/<masechet>_<daf>.json from a source file
  content/           committed content JSONs (one per daf)  ← the source of truth for a page
  validate.js        rejects wrong-masechet, out-of-range daf, missing titles/fields, bad quiz shape
  build.sh           validate → ../daf-yomi/build-daf.js → validate built HTML
  fix-undefined-titles.js  one-off repair for the legacy <h2>undefined</h2> slides
```

## Rebuild one masechet

```bash
node pipeline/fetch-sefaria.js berakhot 2-64          # sources (gitignored)
# write pipeline/content/berakhot_<daf>.json per GENERATION_GUIDE.md
node pipeline/validate.js berakhot                    # must be all ok
bash pipeline/build.sh berakhot 64                    # builds daf-yomi/berakhot/<daf>/{index,quiz}.html
```

`validate.js` knows the real Bavli pagination (e.g. Tamid is 25-33 only) and refuses a daf outside it.
Never commit built HTML whose JSON does not pass validation.
