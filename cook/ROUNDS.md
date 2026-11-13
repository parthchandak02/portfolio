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
