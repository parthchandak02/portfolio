# Portfolio (agent notes)

Before changing the 3D scene, its shaders, post-processing or the prism and bubbles switch, read
[docs/3d-debugging.md](docs/3d-debugging.md). It lists the shader patterns that break on some GPUs, how to
measure in a real browser, and the checklist to run before deploying.

To add or edit a card (a job, paper, award, press piece), see [docs/content.md](docs/content.md): each card is a
Markdown file in `src/content/cards/<section>/`, checked at build time by `scripts/cards.mjs`.

Never run `npm run dev` or `npm start` here: they free port 3000, which another service on this machine uses. Test
with `npm run build` and `astro preview` on another port.

## Card loader workflow

`scripts/cards.mjs` is the Astro/Vite plugin that turns `src/content/cards/<section>/*.md` into the
`virtual:cards` module the site imports. Field tables and writing tips live in
[docs/content.md](docs/content.md); this section is how to run and check the loader itself.

### Purpose

When Parth adds or edits a card, the loader validates every Markdown file at build time (and on reload in
dev) so a misspelt field, missing logo, unknown parent, or duplicate title fails with the file's name
instead of shipping a broken page. `src/data/timelineData.js` and `src/data/spectrum.js` read
`cardsBySection` from `virtual:cards`.

### Entrypoints

| Path | Role |
| --- | --- |
| `scripts/cards.mjs` | Vite plugin: `loadCards(root)`, date helpers, default export wired in `astro.config.mjs` |
| `scripts/cards.test.mjs` | Fixture tests for valid cards, sort order, and every reject path |
| `src/content/cards/<section>/*.md` | One card per file; sections come from `src/data/sections.js` (Lab stays in `src/data/lab.js`) |
| `docs/content.md` | Front matter fields, tile vs timeline rules, and what the checks cover |

### How to run

The plugin is already registered in `astro.config.mjs`. Any build loads and checks every card:

```bash
npm run build
```

In a throwaway root (or from the real repo), call the loader directly:

```bash
node --input-type=module -e "import { loadCards } from './scripts/cards.mjs'; loadCards(process.cwd()); console.log('ok');"
```

A problem throws `The portfolio's cards have problems:` with one line per file. Editing a card while a
dev server is up invalidates `virtual:cards` and triggers a full reload (do not use `npm run dev` on
this machine; use `astro preview` on another port after a build, or run the loader check above).

### How to test

```bash
npm test
```

That includes `scripts/cards.test.mjs` (temp fixtures plus a load of the real cards) and
`test/cardLoaderDocs.test.js`, which checks that this section still names the plugin and
`virtual:cards`. After adding a card, also skim [docs/content.md](docs/content.md) so public counts
still match the EB-1A petition.

## Cook stills workflow

`cook/` is this site's visual cook loop: a brief, a fixed shot list, a round ledger, and two scripts that
capture screenshots and lay them beside local references so a round can be judged without guessing.

### Purpose

After UI work, shoot the four fixed views and compare each still to its reference. State files
(`BRIEF.md`, `SHOTS.md`, `ROUNDS.md`) stay in git. `cook/refs/` and `cook/stills/` stay local (often
gitignored when the references are third-party).

### Entrypoints

| Path | Role |
| --- | --- |
| `cook/shoot.sh <round>` | Capture S01 to S04 into `cook/stills/<round>/` |
| `cook/compare.sh <round>` | Write side-by-side JPGs into `cook/compare/<round>/` |
| `cook/SHOTS.md` | What each shot shows: route, viewport, wait, what to take from it |
| `cook/BRIEF.md` | Target, bar, rules, time, and permissions for the run |

`<round>` is a label such as `r16`. Both scripts call helpers under `~/.claude/skills/cook/scripts/`
(`shoot.mjs` and `side-by-side.mjs`).

### How to run

1. Build, then preview on the cook port (default 8839), not 3000:

```bash
npm run build
npx astro preview --host 127.0.0.1 --port 8839
```

2. From the repo root in another shell:

```bash
bash cook/shoot.sh r16
bash cook/compare.sh r16
```

Set `COOK_PORT=8840` (or another free port) if 8839 is taken. Shoot expects the preview at
`http://127.0.0.1:$COOK_PORT`. It clicks "Back to the portfolio" for the hero shots and the light-mode
toggle for S04.

Shots (full detail in `cook/SHOTS.md`):

- S01: hero, dark mode
- S02: Selected work (`/#selected`)
- S03: Lab (`/#lab`)
- S04: hero, light mode

Compare writes `wide.jpg` and `phone.jpg` with the reference on the left and the new still on the right.
You need `cook/refs/` populated with the R01 to R05 files named in `compare.sh`.

### How to test

There is no automated pixel assert. `npm test` includes `test/cookScripts.test.js`, which checks that the
scripts exist and keep the documented round argument and default port. To check a real round by eye, run
shoot then compare and open `cook/compare/<round>/`.

## Card logos workflow

`scripts/logos/` turns organisation artwork and hand-drawn topic marks into the one-colour white PNGs
cards show at 50 px. Full option tables live in [scripts/logos/README.md](scripts/logos/README.md).

### Purpose

When a new card needs a logo, make a white-on-transparent 512 x 512 PNG that matches the existing set,
preview it beside neighbours, and record how it was built so it can be rebuilt later. Topic marks cover
work with no organisation behind it (independent research).

### Entrypoints

| Path | Role |
| --- | --- |
| `scripts/logos/make-logo.mjs` | Convert an SVG, PNG or JPG into `public/logos/<name>-logo.png` |
| `scripts/logos/preview.mjs` | Write a review sheet (large + dark card + light card) for one or more logos |
| `scripts/logos/render-topics.mjs` | Render `scripts/logos/topics/*.svg` to `public/logos/topic-<name>.png` |
| `scripts/logos/sources.json` | Source URL and args for each generated organisation logo |
| `scripts/logos/README.md` | Option tables, ink modes, topic drawing spec |

### How to run

From an organisation's official file (prefer vector over a screenshot):

```bash
node scripts/logos/make-logo.mjs <source.svg|png|jpg> public/logos/<name>-logo.png [--ink any|alpha|dark] [--crop x,y,w,h] [--erase x,y,w,h] [--stack] [--box w,h]
node scripts/logos/preview.mjs /tmp/sheet.png public/logos/<name>-logo.png public/logos/zoox-logo.png public/logos/wsu-logo.png
```

Useful flags: `--ink alpha` when the source is already white on transparent; `--ink dark` for a dark mark
on a coloured tile; `--stack` for a long one-line wordmark; `--crop` / `--erase` to drop taglines.
Record the source and args in `scripts/logos/sources.json`.

Topic marks (drawn SVGs, not converted):

```bash
node scripts/logos/render-topics.mjs            # all topics
node scripts/logos/render-topics.mjs robotics   # one name
```

Point the card's `companyLogo` at `/logos/<file>.png`. See [docs/content.md](docs/content.md).

### How to test

There is no automated pixel assert for a new logo. Open the preview sheet and check the mark is neither
louder nor quieter than its neighbours at 50 px on dark and light cards. `npm test` includes
`test/logoScripts.test.js`, which checks that the three scripts exist, keep the documented CLI shapes,
and that AGENTS.md still names them.
