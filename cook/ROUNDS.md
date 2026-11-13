# Cook ledger: portfolio

Started: 2026-11-13 08:58 UTC
Size: light | Time: floor none | cap 3h (11:58 UTC)
Bar: layout 99 | type 99 | color 99 | components 99 | polish 99
Calibration offset: none yet
Gate: stills approved no | final not started
Best so far: round 0 (baseline)

## Decisions

- 09:10 No changes to the 3D scene, shaders or the prism/bubbles switch this run, because the 3D checklist needs a real Mac and iPhone and the cap is 3h. Diamonds and beam stay.
- 09:10 Prism, beam, bubbles and spectrograph kept as site identity (project override of the ban list on decorative shapes).
- 09:12 Shot list: #portfolio is the hero, so S03 is #lab and S04 is light mode.
- 09:20 shoot.mjs word count fixed to skip hidden text (cook repo).

## Feedback inbox

(none yet)

---

## Round 00 (baseline)

Time: 08:58 to 09:25
Stills: `cook/stills/r00/` | Side by side: `cook/compare/r00/`

Scores, eyeballed: mean of 2 fresh Claude critics, no calibration yet

| Shot | Layout | Type | Color | Components | Polish |
|---|---|---|---|---|---|
| S01 | 72 | 70 | 80 | 68 | 68 |
| S02 | 57 | 65 | 66 | 59 | 54 |
| S03 | 54 | 61 | 59 | 55 | 50 |
| S04 | 61 | 66 | 70 | 62 | 56 |

Measured (shoot.mjs): S01-390 42 words, 9 taps under 44px (palette dots 26px, Full portfolio link 19px tall); S02-390 133 words, 7 text nodes under 14px; no overflow anywhere.

Top gaps (both critics agree):
1. S02/S03 wide: content in a ~450 to 800px column with black gutters; stray hairline from the left edge.
2. Uppercase kickers on every card, duplicated faint SELECTED WORK header, near-invisible Full portfolio link.
3. Phone: 3D scene bleeds through cards; sound and chat buttons cover card text.
4. S03: lone Tau Beta Pi card; near-black lab tiles with tiny labels.
5. Hero: generic centred stack with uppercase kicker, small type, crowded right rail with labels.

Next focus: round 1, S02 and S03 layout and polish.

## Round 01

Time: 09:15 to 09:22
Focus: S02 and S03 layout and polish, because both critics ranked the work sections weakest.

Changes:
- Timeline and cards widen to 72rem at 1200px and up (was 50rem): Selected work and Lab use the wide screen.
- Card kickers and tile venues in sentence case, no tracking; Selected work and Full portfolio headings set as real headings.
- Full portfolio link visible, underlined, 44px tall.
- Lab tiles: ghost image 0.16 to 0.46, blur 6px to 2px, deeper scrim under the name, tag 0.78rem; five columns at 1200px+.
- Phone: deeper text shade on feature cards.

Stills: `cook/stills/r01/` | Side by side: `cook/compare/r01/`

Scores, eyeballed: mean of 2 fresh Claude critics, no calibration

| Shot | Layout | Type | Color | Components | Polish | vs r00 (mean) |
|---|---|---|---|---|---|---|
| S01 | 71 | 64 | 79 | 65 | 66 | -3 (hero unchanged; critic noise) |
| S02 | 69 | 66 | 67 | 66 | 61 | +5 |
| S03 | 70 | 60 | 60 | 63 | 57 | +5 |
| S04 | 60 | 62 | 66 | 61 | 57 | -2 (unchanged) |

Measured: S02-390 text nodes under 14px 7 to 5; S03-1440 visible words 43 to 48; no overflow.

Top gaps:
1. Hero: no display-scale type; kicker plus greeting plus typewriter template; mid-word captures.
2. Cards and tiles lack real imagery; bottom project row titles truncated.
3. Phone: scene and diamonds show through content; floating buttons over cards.

Commit: b9731706. Next focus: hero type (round 2, already built).
