# Cook ledger: portfolio

Started: 2026-11-13 08:58 UTC
Size: light | Time: floor none | cap 3h (11:58 UTC)
Bar: layout 99 | type 99 | color 99 | components 99 | polish 99
Calibration offset: none yet
Gate: paused (no live human watch during resumed factory cook; PR open for review) | final build/lint/test/gitleaks verified
Best so far: round 15 (79.6 mean vs strict ref bar, +24.3 over r08-base 55.3)

## Decisions

- 09:10 No changes to the 3D scene, shaders or the prism/bubbles switch this run, because the 3D checklist needs a real Mac and iPhone and the cap is 3h. Diamonds and beam stay.
- 09:10 Prism, beam, bubbles and spectrograph kept as site identity (project override of the ban list on decorative shapes).
- 09:12 Shot list: #portfolio is the hero, so S03 is #lab and S04 is light mode.
- 09:20 shoot.mjs word count fixed to skip hidden text (cook repo).

## Feedback inbox

- 09:50 "I still need the typed name animations. But I do agree put my name in bold above on the first line with slightly bigger font" | round 6 | done, proof: cook/stills/r06/S01-1440.png
- 09:50 "Grey diamonds - we can replace them if there's something better? The idea was to highlight selected work" | round 6 | done (picked by Parth)
- 09:50 "Ok so what do you propose to fix the emptiness?" | round 6 | done (picked by Parth)
- 09:50 "Ok make the lab area better" | round 7 | done, proof: cook/stills/r07/S03-1440.png
- 09:50 "Light mode yes keep it whiteish but what are you proposing instead!" | round 6 | done (picked by Parth)

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

## Round 05

Time: 09:38 to 09:45
Focus: phone rail over content, because every critic since round 0 flagged it.

Changes:
- Phone (560px and under): sound button sits beside the contact button at the bottom instead of above it.
- Tried moving the phone hero lower; the prism is fixed in 3D space, so the text would collide with it. Not done.

Scores, eyeballed: mean of 2 fresh Claude critics, no calibration

| Shot | Layout | Type | Color | Components | Polish | vs r04 (mean) |
|---|---|---|---|---|---|---|
| S01 | 84 | 86 | 86 | 81 | 80 | +0 |
| S02 | 79 | 78 | 79 | 80 | 74 | +0 |
| S03 | 82 | 77 | 79 | 82 | 75 | +4 |
| S04 | 79 | 85 | 82 | 80 | 77 | +1 |

Measured: lint 0 errors (1 old warning); no overflow at 390 or 1440.

Plateau: CSS-only gains have flattened (r04 to r05 about +1). Every remaining top gap needs Parth's call or touches the 3D scene:
1. Typewriter "I am a ..." line (all critics: template trope).
2. Grey diamonds; beam showing through cards (3D).
3. Demo cards at rest look empty; three-line descriptions; "Example light and chime" caption.
4. Lab thumbnails with cropped UI text (new crops).
5. Light mode: pure white ground, rainbow strip on white.
6. Six round buttons; could fold into one menu on phone.

Gate: review page updated; waiting for Parth's approval and picks. Stop check: bar no | cap not reached (0h47m of 3h) | stills approved no.
Commit: 7faa9bad.

## Round 06 (Parth's feedback)

Time: after Parth's reply; the 3h cap had passed in wall time while waiting at the gate. Continued because the feedback asked for this work.
Focus: the feedback inbox.

Parth's picks (AskUserQuestion): name size "slightly bigger than now"; diamonds "keep, smaller and dimmer"; emptiness "demos lit at rest", "one line per card", "phone hero peek"; light mode "pearl white".

Changes:
- Name types itself in again (ReactTyped), bold, line 1, clamp 2.7rem to 6.4rem; an invisible copy holds the line so nothing moves.
- Mirror blocks (Box.jsx): scale 0.5 to 0.34, emissive #454545 to #2a2a2c, colour #333 to #262628. 3D file: needs the ?perf check on a real Mac and phone before deploy.
- Card lines cut to one sentence each (featured.js); Zoox light glows at rest; CALarm clock large and centred.
- Phone: spacer under the hero 96px (was 400px, min 35vh), so Selected work peeks in. Spacer moved from inline style to styles.css.
- Light mode: --page-light and the canvas clear colour #f4f5f7; strip lines mixed toward the page; role line darker.
- Lab (helper agent): one grade for all thumbnails, crop of the top UI strip, captions 1.08 and 0.84rem, project card titles wrap to 3 lines, near-opaque tiles and cards.

Scores, eyeballed: mean of 2 fresh critics

| Shot | Layout | Type | Color | Components | Polish | vs r05 (mean) |
|---|---|---|---|---|---|---|
| S01 | 83 | 84 | 87 | 79 | 78 | -1 |
| S02 | 74 | 78 | 76 | 71 | 68 | -5 |
| S03 | 80 | 74 | 78 | 79 | 72 | -3 |
| S04 | 74 | 81 | 78 | 74 | 70 | -5 |

Why lower: critics read pearl white plus the pastel strip as washed out, and the Lab's all-over veil turned the white shots milky. Fixed in round 7. The other picks are Parth's and stay.

## Round 07

Changes: Lab grade 0.84 to 0.95 brightness and the all-over veil removed; light strip mix 64% to 84%.
Commit: 1cd6dfeb.

Round 07 scores, eyeballed: mean of 2 fresh critics

| Shot | Layout | Type | Color | Components | Polish | Mean | vs r05 |
|---|---|---|---|---|---|---|---|
| S01 | 85 | 87 | 87 | 81 | 82 | 84 | +1 |
| S02 | 80 | 83 | 81 | 79 | 78 | 80 | +2 |
| S03 | 79 | 76 | 80 | 79 | 76 | 78 | -1 |
| S04 | 82 | 86 | 79 | 80 | 79 | 81 | +1 |

Best so far: round 07, commit 1cd6dfeb.
Remaining gaps (both critics): beam and bubbles crossing text (3D), rainbow showing through glass cards, buttons over the first card on phone, demo micro text inside Lab thumbnails (new crops), Find My Zoox card still mostly gradient at rest.
Gate: review page updated; waiting for Parth's approval. Stop check: bar no | cap passed (continued on feedback) | stills approved no.

## Ship

- Parth approved ("Approve"). gitleaks on the branch: no leaks. No reference sites named in cook/ (public repo).
- main fast-forwarded to 85db2d2f and pushed; Cloudflare Pages served the new build within about 15s.
- Live check: parthchandak.info hero (390, 1440) and #lab (1440) shot with shoot.mjs and matched the round 7 stills.
- Open for Parth: ?perf check on a real Mac and phone (mirror blocks are a 3D change); whether the Centi-seed robot shows at rest (never rendered headless).
Stop check: bar no (84/80/78/81 against a 99 stretch) | stills approved yes | final deployed and checked yes.

---

## Round 08 (resumed baseline, r08-base)

Time: 03:01 to 03:09 UTC (2026-11-15)
Stills: `cook/stills/r08-base/` | Side by side: `cook/compare/r08-base/`

Scores, eyeballed: mean of 2 fresh subagent critics (Critic A, Critic B), strict craft bar vs `cook/refs/R01` to `R05`:

| Shot | Layout | Type | Color | Components | Polish | Mean |
|---|---|---|---|---|---|---|
| S01 | 58 | 64 | 68 | 55 | 48 | 59 |
| S02 | 59 | 63 | 55 | 54 | 48 | 56 |
| S03 | 63 | 40 | 53 | 49 | 40 | 49 |
| S04 | 60 | 62 | 61 | 52 | 49 | 57 |

Measured (shoot.mjs & color_check.py):
- `S01-390`: overflow none, 38 first-screen words, 8 taps under 44px (`Blue/Pink/Teal/Amber` 26x26 swatches, `Navigation prompt` 132x40), 1 text node under 14px.
- `S01-1440`: overflow none, 25 words; saturation delta -0.216, brightness delta +0.056 vs R01.
- `S02-390`: overflow none, 82 words, 9 taps under 44px, 5 text nodes under 14px.
- `S02-1440`: overflow none, 130 words; saturation delta -0.209, brightness delta -0.310 vs R03.
- `S03-390`: overflow none, 12 words, 9 taps under 44px, 4 text nodes under 14px.
- `S03-1440`: overflow none, 48 words; saturation delta +0.209, brightness delta -0.839 vs R05.
- `S04-390`: overflow none, 37 words, 8 taps under 44px, 1 text node under 14px.
- `S04-1440`: overflow none, 26 words; saturation delta -0.222, brightness delta +0.045 vs R04.

Top gaps (both critics agree):
1. `S03-1440` sticky `BandBar` overlaps `Judging` on top of `Projects` during `#lab` scroll settle.
2. `S03` Lab tiles overlay white titles directly on top of baked-in grey HUD text inside screenshots, plus low contrast on bright `aeris`/`jobwright`/`inkwell` tiles and clipped right edges.
3. `S02` `Centi-seed` robot missing (off-screen/still walking from `-halfWidth - 6` at 3.5s), `Find My Zoox` mostly empty void with 11px note, row 2 (`Audio` and `CALarm`) clipped at bottom on `1440x900`, inconsistent card anatomy, and prism beam bleeding harshly through card gutters and `CALarm`.
4. `S01`/`S04` mobile (`390x844`): spectrograph slices 3D prism in half, compressed ticks read like a solid neon barcode, `Play with prism`/`Play with bubbles` floats mid-screen, and bottom-right FABs sit over card copy and pick up harsh background colors. Light mode strip lines look too faint.
5. Hero typewriter captured mid-word (`Prototype|`) on `S04-390`, overly tight tracking on `Parth Chandak`, and `4` small swatch/button taps (`26x26`, `132x40`) + `<14px` text nodes on mobile.

Next focus: Round 09 addressing S03 Lab + BandBar collision, S02 Centi-seed/cards/beam bleed/fit-in-viewport, and S01/S04 mobile composition, light-strip contrast, tap targets & font sizes.

---

## Round 09

Time: 03:10 to 03:21 UTC (2026-11-15)
Stills: `cook/stills/r09/` | Side by side: `cook/compare/r09/`

Changes:
- Removed `BandBar` transition overlap (`is-leaving` 0.14s out before `is-entering` 0.16s delay) and bumped `BandBar` tap height (`44px`) and labels (`>=14px`).
- Added instant hash navigation (`scrollCardToLine(..., 'auto')`) and `.scroll-veil` scrim behind `.layout__ui` once reading starts to tame raw prism/beam bleed behind grids.
- Unified Selected Work cards (`FeatureCards.css`) with top-left headers, smoked obsidian/pearl glass surfaces, a sculptural Zoox light beacon + 44x44 swatch hitboxes, compact 2x2 desktop heights (`clamp(286px, 34vh, 324px)`), and centered `CALarm` flip clock.
- Tuned `centiSeedRobot.js` walk-in start position, acrylic edge/studio brightness, and instant `rest()` render on WebGL init so Centi-seed is visible at settle.
- Refined `LabShowcase.css` portrait vs landscape crops, deeper bottom fog scrims, calm grades for bright UI tiles (`aeris`, `jobwright`, `atmos`), and `14px` tile tags.
- Tightened `Spectrograph.css` mobile strip widths (`1.25px`), stronger light-mode tick anchor (`#141418` mix), `14px` readout labels, and hidden mobile `.ui-hint` labels; frosted FAB backing (`ContactButton.css`, `SoundToggle.css`); removed the en dash in `CompanyCard.jsx`.

Scores, eyeballed: mean of 2 fresh subagent critics (Critic A, Critic B), strict craft bar vs `cook/refs/R01` to `R05`:

| Shot | Layout | Type | Color | Components | Polish | Mean | vs r08-base |
|---|---|---|---|---|---|---|---|
| S01 | 72 | 64 | 80 | 74 | 67 | 71 | +12 |
| S02 | 76 | 83 | 85 | 76 | 74 | 79 | +23 |
| S03 | 81 | 69 | 79 | 73 | 68 | 74 | +25 |
| S04 | 68 | 74 | 78 | 74 | 68 | 72 | +15 |

Measured (`shoot.mjs` & `color_check.py`):
- `S01-390`: overflow none, 61 words, taps under 44px **0** (was 8), text nodes under 14px **0** (was 1).
- `S02-390`: overflow none, 80 words, taps under 44px **0** (was 9), text nodes under 14px **0** (was 5).
- `S03-390`: overflow none, 12 words, taps under 44px **0** (was 9), text nodes under 14px **2** (was 4).
- `S04-390`: overflow none, 61 words, taps under 44px **0** (was 8), text nodes under 14px **0** (was 1).
- `color_check` mean saturation / brightness deltas: S01 `+0.229 / -0.073`, S02 `+0.172 / +0.456`, S03 `-0.326 / +0.847`, S04 `+0.223 / -0.048`.

Top remaining gaps (both critics):
1. `S01-390` mid-typing freeze (`"Parth Cha"` / `"I am a|"`) and `S04-390` headline `"k"` touching the top-right rail.
2. `S01-390` `"Selected work"` colliding with bright prism apex; `S04-390`/`S04-1440` bubble halos behind hero/strip text.
3. `S03` thumbnail edge text (`jobwright` `"wright"`, `echo` `"mplitude 0"`, `aeris` sliced temps) and uneven title baselines between 1-line and 2-line card subtitles.
4. `S02-1440` `"Audio prioritization"` row taller than `"CALarm"` and bottom pills clipped 6px at viewport edge; `Centi-seed` robot sitting left of spotlight pool.
5. Mobile bottom-right speaker/chat buttons overlapping card borders and `inkwell` caption (`S03-390`).
6. Sparse 2026/2025 preview cards below Lab, and stray faint lines/diamonds.

---

## Round 10

Time: 03:21 to 03:31 UTC (2026-11-15)
Stills: `cook/stills/r10/` | Side by side: `cook/compare/r10/`

Changes:
- Sped up hero `ReactTyped` typing (`UITypewriter.jsx`, `UITypewriter.css`) so full name and rotating roles finish typing early and hold steady before 8s; refined mobile container width, light pearl halo, and responsive margins.
- Docked mobile `ContactButton` and `SoundToggle` top-left on hero and top-right while reading (`App.jsx`, `ContactButton.css`, `SoundToggle.css`, `BandBar.css`), clearing card content cleanly on `390x844`.
- Tightened mobile `.spectro` padding/ticks (`Spectrograph.css`) and anchored dark/light strip line shadows and pearl halos.
- Equalized desktop Selected Work card height (`304px`) in `FeatureCards.css` so all four cards + `"The full portfolio"` fit cleanly in `1440x900`; brighter `CALarm` coral numerals and darker `.scroll-veil--dark` scrim (`styles.css`).
- Adjusted `centiSeedRobot.js` `walkIn()` start (`x = -2.0`, `grow = 0.45`) and `dt` clamp (`0.15`) so the robot walks to center spotlight and sprouts its plant cleanly.
- Calibrated `LabShowcase.css` crops (`echo`, `aeris`, `jobwright`, `inkwell`), equalized subtitle line height (`min-height: 2.6em`) across 1-line and 2-line tags, and bumped `CardTile.css` metadata to `0.875rem`.

Scores, eyeballed: mean of 2 fresh subagent critics (Critic A, Critic B), strict craft bar vs `cook/refs/R01` to `R05`:

| Shot | Layout | Type | Color | Components | Polish | Mean | vs r09 |
|---|---|---|---|---|---|---|---|
| S01 | 73 | 80 | 80 | 77 | 74 | 77 | +6 |
| S02 | 80 | 80 | 82 | 79 | 77 | 79 | +0 |
| S03 | 80 | 77 | 78 | 76 | 75 | 77 | +3 |
| S04 | 74 | 81 | 81 | 77 | 73 | 77 | +5 |

Measured (`shoot.mjs` & `color_check.py`):
- `S01-390`, `S02-390`, `S04-390`: overflow none, taps under 44px **0**, text nodes under 14px **0**.
- `S03-390`: overflow none, taps under 44px **0**, text nodes under 14px **2** (`CardTile` `.ctile__name` on 560px).
- `color_check` mean saturation / brightness deltas: S01 `+0.234 / -0.098`, S02 `+0.108 / +0.471`, S03 `-0.327 / +0.857`, S04 `+0.222 / -0.044`.

Top remaining gaps (both critics):
1. Mobile sticky `BandBar` still receives inline `left`/`width` in `BandBar.jsx`, overriding mobile `right: 120px` and colliding with top-right `Sound`/`Contact` buttons (`S02-390`, `S03-390`).
2. `S02-1440` & `S02-390` `"Selected work"` heading sits inside `BandBar`'s top-fade ramp and renders dimmed (~50% alpha) vs `"The full portfolio"` below.
3. Mobile hero compression (`390x844`): `"I am a Creative Technologist|"` nears right chevron, `.spectro` ticks crowd without desktop's varied cadence, and `"Selected work"` pulls up into the prism glow / bubbles (`S01-390`, `S04-390`).
4. `Centi-seed` says `"Tap below to lead it."` without an explicit floor tap cue/beacon; `CALarm` desktop card has dead space above small flip clock.
5. `S03` Lab card title baselines still bounce (name floats above 2-line vs 1-line subtitle, though aligned at card bottom, visual baseline shifts), plus edge text leaks in `aeris`, `wc26`, `jobwright`, and blur on `inkwell` / `2025`.
6. Right-rail permanent labels (`Light mode`, `Play with prism` only) asymmetric vs Lock/Chevron buttons (`S01-1440`, `S04-1440`).

---

## Round 11

Time: 03:31 to 03:44 UTC (2026-11-15)
Stills: `cook/stills/r11/` | Side by side: `cook/compare/r11/`

Changes:
- Fixed mobile sticky `BandBar` column sizing (`BandBar.jsx`, `BandBar.css`) so inline desktop coordinates do not override `right: 126px`, keeping top-right `SoundToggle` and `ContactButton` cleanly separated; skipped strip-to-bar morph when `#hash` jumps past the hero strip; raised `BAR_CLEARANCE` to `136px` (`useScrollHighlight.js`) and ran instant hash alignment on load (`App.jsx`) so `Selected work` clears `BandBar`'s fade ramp at full white contrast.
- Darkened `.scroll-veil--dark` (`styles.css`), adjusted mobile `.navigation-placeholder` (`515px`) and responsive `.ui-typewriter-container` padding/font clamp (`UITypewriter.css`) for mobile hero breathing room.
- Restored mobile `.spectro` year cadence (`spectroPlace.js`), shortened intro/fold timings (`Spectrograph.jsx`, `Spectrograph.css`), and hid resting `.play-mode-toggle > .ui-hint` on mobile hero (`Layout.css`).
- Recentered `Centi-seed` camera/walk-in (`centiSeedRobot.js`) and added floor cue + amber reticle, added `"Calendar alarm · Overrides Silent"` pill + higher-contrast flip digits (`FeatureCards.jsx`, `FeatureCards.css`), and toned `Audio prioritization` active card wash (`Timeline.css`).
- Equalized `.lab-tile__tag` height (`2.6em`), deepened bottom fog scrims, tuned `wc26`/`aeris`/`jobwright`/`inkwell` crops (`LabShowcase.css`), and bumped mobile `.ctile__name` to `0.875rem` while muting `.ctile--veiled` resting thumbnails (`CardTile.css`).

Scores, eyeballed: mean of 2 fresh subagent critics (Critic A, Critic B), strict craft bar vs `cook/refs/R01` to `R05`:

| Shot | Layout | Type | Color | Components | Polish | Mean | vs r10 |
|---|---|---|---|---|---|---|---|
| S01 | 74 | 79 | 77 | 77 | 71 | 75.6 | -1.4 |
| S02 | 80 | 85 | 84 | 78 | 76 | 80.5 | +1.5 |
| S03 | 76 | 83 | 80 | 77 | 72 | 77.1 | +0.1 |
| S04 | 73 | 78 | 80 | 77 | 71 | 75.5 | -1.5 |

Measured (`shoot.mjs` & `color_check.py`):
- All 8 stills (`S01`-`S04` at `390x844` and `1440x900`): overflow **none**, taps under 44px **0** (on all 4 mobile shots), text nodes under 14px **0** (on all 4 mobile shots).
- `color_check` mean saturation / brightness deltas: S01 `+0.259 / -0.097`, S02 `+0.297 / +0.501`, S03 `-0.201 / +0.891`, S04 `+0.222 / -0.036`.

Top remaining gaps (both critics):
1. `S03-390` top-right hero buttons (`lock`, `prism`, `chevron`) still mid-fade (~0.35 opacity) overlapping `aeris` tile.
2. `S02-1440` `Centi-seed` robot clipped on left edge while spotlight pool sits center-right; mobile leaf touches cue text.
3. `S01-390` & `S04-390` `"Selected work"` + `"Full portfolio"` sit across prism apex / bubble rim; typing still caught mid-word (`Creative Techno|` / `Protot|`) with soft orange glow.
4. Left-edge stray horizontal hairline behind card rows (`S02-1440`, `S03-1440`, `S03-390`); faint white oval halo behind light-mode role (`S04-1440`).
5. `CALarm` `0 : 0 0` reads like placeholder zero state; `BandBar` mobile track stops abruptly mid-header; `aeris`/`jobwright`/`inkwell` cropped edge text/blur and missing logos on 2026 peek cards; right-rail hover label appears on single button after click.

---

## Round 12

Time: 03:44 to 03:52 UTC (2026-11-15)
Stills: `cook/stills/r12/` | Side by side: `cook/compare/r12/`

Changes:
- Terminated orphaned preview server (`pid 418299`) holding stale assets on port 8839 and switched `shoot` verification to fresh build output.
- Raised `.scroll-veil` (`z-index: 6`, `0.985..0.996` dark opacity) in `styles.css` above `#boot` (`z-index: 5`), completely removing the left-edge horizontal `.boot__beam` hairline behind `#selected` and `#lab`.
- Ran `measure()` immediately with `ResizeObserver` in `useScrollHighlight.js`, hid `.spectro-toggle` alongside `.light-toggle`/`.lock-toggle`/`.play-mode-toggle` when `.layout__ui--reading` is active (`Layout.css`), and restricted `.ui-hint` labels to keyboard `:focus-visible` and playground exit mode.
- Sped up cycling `ReactTyped` (`UITypewriter.jsx`), tightened mobile cycling text width/size (`UITypewriter.css`), removed orange bloom halo and light-mode role oval halo, and deepened light-mode diamond/tick contrast (`SelectedMark.css`, `Spectrograph.css`).
- Set `Centi-seed` `floor: 0.85` + initial pointer settle guard (`FeatureCards.jsx`), added `aria-pressed` active pill highlight (`FeatureCards.css`), feathered mobile `BandBar` right hairline (`BandBar.css`), and tightened `aeris`/`jobwright`/`inkwell`/`echo`/`orbiter` Lab crops (`LabShowcase.css`) and ghost opacity (`CardTile.css`).

Scores, eyeballed: mean of 2 fresh subagent critics (Critic A, Critic B), strict craft bar vs `cook/refs/R01` to `R05`:

| Shot | Layout | Type | Color | Components | Polish | Mean | vs r11 |
|---|---|---|---|---|---|---|---|
| S01 | 72 | 78 | 78 | 74 | 68 | 73.8 | -1.8 |
| S02 | 71 | 81 | 84 | 79 | 70 | 76.8 | -3.7 |
| S03 | 83 | 78 | 79 | 73 | 71 | 76.5 | -0.6 |
| S04 | 74 | 79 | 81 | 75 | 73 | 76.3 | +0.8 |

Measured (`shoot.mjs` & `color_check.py`):
- All 8 stills (`S01`-`S04` at `390x844` and `1440x900`): overflow **none**, taps under 44px **0** on all 4 mobile shots, text nodes under 14px **0** on all 4 mobile shots.
- `color_check` mean saturation / brightness deltas: S01 `+0.192 / -0.088`, S02 `+0.096 / +0.486`, S03 `-0.387 / +0.882`, S04 `+0.223 / -0.036`.

Top remaining gaps (both critics):
1. `S02-390` right-rail controls (`Lock`, `Prism`, `Chevron`) still mid-fade overlapping `"Full portfolio"` (`"lio"`) and upper-right corner of `"Find My Zoox"` when cold fonts settle around 3.3s.
2. `S03` Lab crops: `orbiter` slices `"14:29:19"` at top-left corner; `jobwright` and `aeris` retain cropped UI text labels along edges; `inkwell` reads soft/blown-out yellow-white; `echo` `"Tap to start listening"` is dim.
3. `S02-1440` `BandBar` names `"Audio prioritization"` instead of first row `"Find My Zoox"` on initial `#selected` landing; `CALarm` still caught in `0:03` countdown frame (`useFirstSight` delay).
4. `S04-1440` vertical typing cursor `|` is pale grey on pearl white (`Selected work` / hero light contrast).

---

## Round 13

Time: 03:52 to 03:58 UTC (2026-11-15)
Stills: `cook/stills/r13/` | Side by side: `cook/compare/r13/`

Changes:
- Made `.layout__ui--reading` right-rail controls hide instantaneously (`!important`, `transition: none !important` in `Layout.css`) so cold font-settlement scrolling never leaves ghosted buttons over `#selected` or `#lab`.
- Refined `.light-mode` `--glass-*` tokens (`styles.css`), airy light shadow on `ContactButton.css`, dark `#202228` typed cursor on light mode (`UITypewriter.css`), and crisp initial contrast/crop passes on `orbiter`, `jobwright`, `aeris`, `inkwell`, and `echo` (`LabShowcase.css`).
- Adjusted `BAR_CLEARANCE - 24` (`useScrollHighlight.js`) so `#selected` anchors cleanly on `Find My Zoox`, and shortened `CALarm` flip countdown (`FeatureCards.jsx/.css`) to `1150ms` so live clock numerals settle sooner.

Scores, eyeballed: mean of 2 fresh subagent critics (Critic A, Critic B), strict craft bar vs `cook/refs/R01` to `R05`:

| Shot | Layout | Type | Color | Components | Polish | Mean | vs r12 |
|---|---|---|---|---|---|---|---|
| S01 | 70.0 | 77.5 | 82.5 | 70.0 | 65.0 | 73.0 | -0.8 |
| S02 | 80.0 | 80.0 | 77.5 | 72.5 | 72.5 | 76.5 | -0.3 |
| S03 | 80.0 | 75.0 | 67.5 | 67.5 | 67.5 | 71.5 | -5.0 |
| S04 | 70.0 | 72.5 | 75.0 | 67.5 | 57.5 | 67.5 | -8.8 |

Measured (`shoot.mjs` & `color_check.py`, `render minus reference` convention matching `r08-base`):
- All 8 stills (`S01`-`S04` at `390x844` and `1440x900`): overflow **none**, taps under 44px **0** on all 4 mobile shots, text nodes under 14px **0** on all 4 mobile shots.
- Visible first-screen words (`390` / `1440`): S01 `62 / 37`, S02 `78 / 153`, S03 `12 / 26`, S04 `62 / 37`.
- `color_check` mean saturation / brightness deltas: S01 `-0.247 / +0.106`, S02 `-0.085 / -0.484`, S03 `+0.381 / -0.890`, S04 `-0.223 / +0.036`.

Top remaining gaps (both critics):
1. `S01-390` & `S04-390` `"Selected work"` + `"Find My Zoox"` top card peek directly across the bright prism flare and mobile soap bubbles (`62` first-screen words in hero still).
2. `S03` `BandBar` shows `Projects` rather than `Lab`, bright `aeris`/`jobwright` light UI strips clash with dark grid (`"LONDO"` cutoff on `aeris`), and blurred peeking `2025` / near-blank `2026` cards below.
3. `S02` `Find My Zoox` blue halo stronger than neighbors, `CALarm` colon spacing uneven, and `Centi-seed` legs noisy.
4. `PlayModeToggle` still flips glyphs mid-capture across desktop/mobile (`S04-1440` vs `S04-390`) and hero typing still captures `Creative Tech|` / `Prototyper|` depending on timing.

---

## Round 14

Time: 03:58 to 04:08 UTC (2026-11-15)
Stills: `cook/stills/r14/` | Side by side: `cook/compare/r14/`

Changes:
- Restored mobile `.navigation-placeholder` (`flex: none; height: 410px` in `styles.css`) so the prism safe zone pushes `"Selected work"` below the hero frame (`390` hero words dropped `62 -> 38`, zero prism/bubble bleed behind `"Selected work"`).
- Sped up hero `ReactTyped` (`typeSpeed={8}`, `backDelay={24000}` in `UITypewriter.jsx`) so both `390` and `1440` settle on `"Creative Technologist|"` cleanly; stretched `PlayModeToggle.css` cycle (`20s`, primary glyph held `0-78%`) so `S04-1440` and `S04-390` match.
- Made `AlarmMoment` initialize directly to `'open'` (`FeatureCards.jsx`), eliminating shrunk `0:03` frames; balanced `Find My Zoox` glow and `CALarm` colon spacing + flip gradient tiles (`FeatureCards.css`); softened `centiSeedRobot.js` acrylic edge opacity (`0.36`).
- Added active band label + `/` divider (`Lab / 27 experiments`) in `BandBar.jsx`/`.css`; inverted `aeris` (`LONDON 21° Clear`) and `jobwright` (`TODAY'S LIST`) into clean dark-native cards, framed `inkwell` filaments (`LabShowcase.css`), and removed Gaussian blur from veiled/info cards (`CardTile.css`).

Scores, eyeballed: mean of 2 fresh subagent critics (Critic A, Critic B), strict craft bar vs `cook/refs/R01` to `R05`:

| Shot | Layout | Type | Color | Components | Polish | Mean | vs r13 |
|---|---|---|---|---|---|---|---|
| S01 | 75.0 | 80.0 | 80.0 | 70.0 | 70.0 | 75.0 | +2.0 |
| S02 | 82.5 | 85.0 | 85.0 | 77.5 | 77.5 | 81.5 | +5.0 |
| S03 | 82.5 | 80.0 | 82.5 | 75.0 | 75.0 | 79.0 | +7.5 |
| S04 | 70.0 | 77.5 | 80.0 | 70.0 | 67.5 | 73.0 | +5.5 |

Measured (`shoot.mjs` & `color_check.py`):
- All 8 stills (`S01`-`S04` at `390x844` and `1440x900`): overflow **none**, taps under 44px **0** on all 4 mobile shots, text nodes under 14px **0** on all 4 mobile shots.
- Visible first-screen words (`390` / `1440`): S01 `38 / 38`, S02 `109 / 153`, S03 `13 / 14`, S04 `38 / 38`.
- `color_check` mean saturation / brightness deltas: S01 `-0.266 / +0.095`, S02 `-0.096 / -0.492`, S03 `+0.400 / -0.910`, S04 `-0.222 / +0.035`.

Top remaining gaps (both critics):
1. `S01-390` & `S04-390` hero controls: `[chat]` `[speaker]` order top-left reversed vs `S02`/`S03` (`[speaker]` `[chat]`), and `"I am a Creative Technologist|"` nears right-rail chevron (`S04-390` `LightToggle` moon button casts heavier shadow than siblings).
2. `S02-390` `Centi-seed` legs touch `"Click or tap the floor to move sun"`; `"Full portfolio"` underline looks default.
3. `S03-1440` peeking `Google` (`2025`) logo collides with `2025` badge in `CardTile`, plus `jobwright` subtle grey contrast.
4. 3D scene items (out of scope this run): lower prism bottom cutoff/noise (`S01`), floating grey diamonds, and soap bubbles drifting behind tagline/strip on `S04-1440`.

---

## Round 15

Time: 04:08 to 04:15 UTC (2026-11-15)
Stills: `cook/stills/r15/` | Side by side: `cook/compare/r15/`

Changes:
- Matched `.light-mode .glass-interactive:hover` shadow (`styles.css`) so `LightToggle` moon button has identical soft pearl shadow as right-rail siblings.
- Aligned mobile `[speaker] [chat]` left-to-right button order across hero (`top-left`) and reading (`top-right`) views (`SoundToggle.css`, `ContactButton.css`).
- Scaled mobile `.ui-typewriter-cycling` (`clamp(1.18rem, 4.7vw, 1.75rem)` in `UITypewriter.css`) so `"Creative Technologist|"` keeps clean horizontal clearance from the right-rail chevron on `390x844`.
- Raised `Centi-seed` `floor` prop from `0.85` to `0.78` (`FeatureCards.jsx`) so the walking robot and translucent shadow pool clear `"Click or tap the floor to move sun"` on `390x844`.
- Styled `.timeline__skip` (`Full portfolio` in `Timeline.css`) with a subtle offset editorial underline instead of a raw default rule.
- Top-aligned `.ctile__text` (`margin-top: 14px; margin-bottom: auto`), muted `.ctile--veiled .ctile__img` (`opacity: 0.14; grayscale(0.35) brightness(0.68)`), and lifted `.ctile__year` legibility (`CardTile.css`) so peeking `2026`/`2025` archive cards show clean titles without `"Google"` watermark collision; lifted `jobwright` brightness (`1.06`) in `LabShowcase.css`.

Scores, eyeballed: mean of 2 fresh subagent critics (Critic A, Critic B), strict craft bar vs `cook/refs/R01` to `R05`:

| Shot | Layout | Type | Color | Components | Polish | Mean | vs r14 | vs r08-base |
|---|---|---|---|---|---|---|---|---|
| S01 | 77.5 | 83.0 | 83.5 | 75.0 | 76.5 | 79.1 | +4.1 | +20.1 |
| S02 | 81.5 | 84.0 | 85.5 | 80.0 | 79.0 | 82.0 | +0.5 | +26.0 |
| S03 | 82.5 | 81.5 | 82.0 | 81.0 | 78.0 | 81.0 | +2.0 | +32.0 |
| S04 | 74.0 | 79.0 | 80.5 | 75.5 | 71.5 | 76.1 | +3.1 | +19.1 |

Overall Mean across S01-S04: **79.6 / 100** (`+2.5` vs r14 `77.1`, `+24.3` vs `r08-base` `55.3`).

Measured (`shoot.mjs` & `color_check.py`):
- All 8 stills (`S01`-`S04` at `390x844` and `1440x900`): overflow **none**, taps under 44px **0** on all 4 mobile shots, text nodes under 14px **0** on all 4 mobile shots.
- Visible first-screen words (`390` / `1440`): S01 `38 / 38`, S02 `109 / 153`, S03 `13 / 29`, S04 `38 / 38`.
- `color_check` mean saturation / brightness deltas (`render minus reference`): S01 `-0.237 / +0.077`, S02 `-0.096 / -0.492`, S03 `+0.396 / -0.909`, S04 `-0.221 / +0.037`.
- Note on `color_check.py` sign convention: `r08-base` and `r13`-`r15` pass `<ref> <render>` (`render minus reference`), whereas `r09`-`r12` passed `<render> <ref>` (inverted sign).

Remaining items keeping views below 90 (outside this CSS/React polish scope or intentional brand choices):
1. Hero 3D depth/collisions (`S01`, `S04`): soap bubble spawn ceiling drifting behind hero text/spectrograph on desktop/mobile (`Bubbles.jsx`, `Scene.jsx`), lower prism cutoff line, stipple noise on prism facets, and floating grey diamonds (3D shader/scene files untouched per run constraints without Mac/iPhone `docs/3d-debugging.md` verification).
2. Six floating circular corner controls + typed `"I am a ...|"` tagline (site identity and explicit owner feedback from rounds 6-7; consolidating corner controls into a compact menu bar requires layout/product decision).
3. Lab thumbnail raster crops and archive card art (`orbiter`, `aeris`, `echo`, `jobwright`, `Google` peeking icon) plus 2-line vs 1-line card subtitle heights in `#lab`.
4. Selected Work card footer variations (`CALarm` flip clock vs `Find My Zoox` swatch strip) and Centi-seed procedural edge smoothing.

Stop check: hard 2h cap approaching (`04:15` / `05:01 UTC`), in-scope UI/layout/accessibility/contrast gains converged at Round 15 (`79.6 / 100`, `+24.3` over `r08-base`, `0` overflow, `0` small taps, `0` sub-14px text), remaining gaps sit in deferred 3D/shader scope or owner product decisions. Ready to run final verification gates and open PR to `main`.

