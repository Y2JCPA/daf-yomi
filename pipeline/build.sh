#!/bin/bash
# Validate content JSONs, build HTML for the ones that pass, then validate the HTML.
# Usage: bash pipeline/build.sh <masechet-slug> <total-dapim> [daf ...]
set -u
cd "$(dirname "$0")"
SLUG="$1"; TOTAL="$2"; shift 2
node validate.js "$SLUG" "$@" || { echo "Validation failed — nothing built for failing dafim."; }
mkdir -p /tmp/daf_build_$$ 
for f in content/${SLUG}_*.json; do
  daf=$(basename "$f" .json | sed "s/${SLUG}_//")
  if [ $# -gt 0 ] && ! printf '%s\n' "$@" | grep -qx "$daf"; then continue; fi
  if node validate.js "$SLUG" "$daf" >/dev/null 2>&1; then cp "$f" /tmp/daf_build_$$/; fi
done
MIN=2; [ "$SLUG" = tamid ] && MIN=25
node ../daf-yomi/build-daf.js /tmp/daf_build_$$ ../daf-yomi "$SLUG" "$TOTAL" "$MIN"
rm -rf /tmp/daf_build_$$
node validate.js "$SLUG" "$@" --html | grep -v '^ok' || true
