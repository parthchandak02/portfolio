#!/usr/bin/env bash
# Side-by-side for round $1: reference left, build right. wide.jpg and phone.jpg.
set -euo pipefail
R=${1:?round}; O=cook/compare/$R; T=cook/stills/$R; F=cook/refs; X=~/.claude/skills/cook/scripts/side-by-side.mjs
mkdir -p $O
node $X --out $O/wide.jpg --aspect 16:10 --height 600 $F/R01-1440.png $T/S01-1440.png $F/R03-1440.png $T/S02-1440.png $F/R05-1440.png $T/S03-1440.png $F/R04-1440.png $T/S04-1440.png
node $X --out $O/phone.jpg --aspect 390:844 --height 844 $F/R02-390.png $T/S01-390.png $F/R03-390.png $T/S02-390.png $F/R05-390.png $T/S03-390.png $F/R04-390.png $T/S04-390.png
