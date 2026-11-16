# Portfolio (agent notes)

Before changing the 3D scene, its shaders, post-processing or the prism and bubbles switch, read
[docs/3d-debugging.md](docs/3d-debugging.md). It lists the shader patterns that break on some GPUs, how to
measure in a real browser, and the checklist to run before deploying.

To add or edit a card (a job, paper, award, press piece), see [docs/content.md](docs/content.md): each card is a
Markdown file in `src/content/cards/<section>/`, checked at build time by `scripts/cards.mjs`.

Never run `npm run dev` or `npm start` here: they free port 3000, which another service on this machine uses. Test
with `npm run build` and `astro preview` on another port.

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
