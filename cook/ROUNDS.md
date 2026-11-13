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

## Round 02

Time: 09:22 to 09:30
Focus: S01 and S04 hero type, because round 1 critics ranked the hero weakest and both flagged kicker plus greeting plus small type.

Changes:
- "Hi, my name is Parth Chandak" (typed) replaced by the name set still at display size (800, clamp 2.5rem to 5.6rem, -0.035em), fading in.
- Role line in sentence case at 0.95 to 1.15rem, no tracking; appears at 0.6s instead of 2.2s.
- Typed "I am a ..." line steps down to clamp 1.35rem to 2.5rem and starts at 1.4s.

Stills: `cook/stills/r02/` | Side by side: `cook/compare/r02/`

Scores, eyeballed: mean of 2 fresh Claude critics, no calibration

| Shot | Layout | Type | Color | Components | Polish | vs r01 (mean) |
|---|---|---|---|---|---|---|
| S01 | 79 | 81 | 84 | 76 | 76 | +11 |
| S02 | 74 | 72 | 76 | 72 | 70 | +7 |
| S03 | 71 | 71 | 70 | 68 | 64 | +7 |
| S04 | 75 | 81 | 74 | 75 | 75 | +14 |

Measured: S01-390 visible words 42 to 32, text nodes under 14px 1 to 0; no overflow.

Top gaps:
1. S03: fogged thumbnails read as placeholders; Show all pill washed out by the beam; bottom row titles long.
2. S02: duplicate Selected work heading looks greyed; card copy small; demo caption.
3. All: diamonds, beam bleed, floating buttons over content on phone (3D parts out of scope this run).

Commit: 931db59a. Next focus: S03 polish.

## Round 03

Time: 09:30 to 09:40
Focus: S03 polish, because both round 2 critics ranked the Lab grid weakest (fogged thumbnails read as placeholders).

Changes:
- Lab tile pictures show at rest (opacity 0.9, no blur), with a scrim only behind the label. Hover and tap still reveal the description.
- Show all is a solid pill (dark 0.86, light 0.92) so the beam cannot wash it out.
- Tried a scroll offset for the Selected work landing; no effect (the jump is done in script), reverted.

Stills: `cook/stills/r03/` | Side by side: `cook/compare/r03/`

Scores, eyeballed: mean of 2 fresh Claude critics, no calibration

| Shot | Layout | Type | Color | Components | Polish | vs r02 (mean) |
|---|---|---|---|---|---|---|
| S01 | 82 | 85 | 83 | 81 | 78 | +3 (unchanged; noise) |
| S02 | 74 | 78 | 77 | 70 | 69 | +2 |
| S03 | 76 | 76 | 77 | 76 | 70 | +6 |
| S04 | 76 | 82 | 80 | 76 | 73 | +1 |

Top gaps:
1. S02: heading greyed at the jump landing; meta line above titles reads as a kicker; phone card a screen of empty gradient; rail buttons over cards on phone.
2. S03: mixed thumbnail brightness; long bottom row titles.
3. Hero: empty lower half on phone; diamonds (3D, out of scope).

Review page for Parth: https://claude.ai/artifact/MdqJxMPAt2N2JvKD6uGjHZ (only Parth's site, no references).
Commit: 5343180f. Next focus: S02 components and polish.

## Round 04

Time: 09:40 to 09:45
Focus: S02 components and polish, because both round 3 critics ranked Selected work weakest.

Changes:
- Card meta (company, year) moves under the title as a quiet line (CSS order), 0.82rem at 0.62.
- Phone feature cards min-height 74vh to 58vh (max 460px).
- Decision: the Selected work heading greys only where it meets the bar's designed fade; left as intended.

Scores, eyeballed: mean of 2 fresh Claude critics, no calibration

| Shot | Layout | Type | Color | Components | Polish | vs r03 (mean) |
|---|---|---|---|---|---|---|
| S01 | 83 | 85 | 87 | 80 | 81 | +2 (unchanged) |
| S02 | 78 | 78 | 82 | 77 | 76 | +5 |
| S03 | 77 | 74 | 78 | 76 | 72 | -1 (unchanged) |
| S04 | 79 | 83 | 80 | 79 | 74 | +2 (unchanged) |

Top gaps (most now outside CSS scope):
1. S03: thumbnails with cropped UI text (content: new crops needed); beam through the grid (3D).
2. S02: demo cards at rest look empty (Centi-seed, CALarm); three-line descriptions; demo caption (content, Parth's call).
3. Phone: rail buttons over content; hero lower half empty.
4. Typewriter line called a template trope by all critics (content, Parth's call).

Commit: 1ce4521b. Next: round 5, phone rail and phone hero position.
