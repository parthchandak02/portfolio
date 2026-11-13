#!/usr/bin/env bash
# Shoot every cook shot for round $1 (e.g. r01). Preview must run on 127.0.0.1:4399.
set -euo pipefail
R=${1:?round like r01}; O=cook/stills/$R; S=~/.claude/skills/cook/scripts/shoot.mjs; U=http://127.0.0.1:4399
P='[aria-label="Back to the portfolio"]'
node $S --url $U/ --shot S01 --out $O --gl --wait 8000 --click "$P"
node $S --url $U/#selected --shot S02 --out $O --gl --wait 3500
node $S --url $U/#lab --shot S03 --out $O --gl --wait 3500
node $S --url $U/ --shot S04 --out $O --gl --wait 8000 --click "$P" --click '[aria-label="Switch to light mode"]'
