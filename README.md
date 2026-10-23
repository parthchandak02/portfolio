<div align="center">

<h1>parthchandak.info</h1>

<p><b>A portfolio you shine a light through.</b></p>

<p><i>Parth Chandak's personal site: a 3D glass prism that splits a beam into a rainbow, and a career record that splits the same way into eight coloured bands.</i></p>

<h6>

![React](https://img.shields.io/badge/React-19-111111?style=flat-square&logo=react&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-React%20Three%20Fiber-ff9a3d?style=flat-square&logo=threedotjs&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/hosted-Cloudflare%20Pages-111111?style=flat-square&logo=cloudflare&logoColor=white)
![Live](https://img.shields.io/badge/live-parthchandak.info-ff5a52?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-555555?style=flat-square)

</h6>

<a href="https://parthchandak.info"><b>Live demo</b></a> ·
<a href="#how-it-works"><b>How it works</b></a> ·
<a href="#the-record"><b>The record</b></a> ·
<a href="#run-it"><b>Run it</b></a>

<br><br>

<a href="https://parthchandak.info"><img src="docs/assets/readme/hero.jpg" width="100%" alt="A glass prism on a black background splitting a white beam into an orange, blue and violet rainbow, under the typed lines 'Hi, my name is Parth Chandak' and 'I am a Creative Technologist', with a strip of coloured timeline ticks across the middle and four round buttons in the top-right corner"></a>

<sub>Play mode on the live site, October 2026.</sub>

</div>

<br>

A first visit opens in **play mode**: a beam of light follows the mouse, hits a 3D glass prism and
leaves as a rainbow, while a typewriter cycles through roles. A thin strip of coloured ticks sits
across the screen, one tick per dated item in the record. Press the reading-glasses button (or
arrive on a `#section` link, or come back a second time) and the page becomes **the record**: the
full career, research, patent, judging and project history as glass cards, with the beam held
still behind them.

## How it works

<table>
<tr>
<td width="33%" valign="top">

**1 · The prism**

A GLTF prism in a React Three Fiber scene. The beam's angle follows the pointer; where it
meets the prism, refracted rays fan out into a rainbow, with a lens flare, plus bloom and a colour LUT from
`@react-three/postprocessing`.

</td>
<td width="33%" valign="top">

**2 · The spectrograph**

Every dated item is one tick on a timeline from 2015 to 2027. The years are warped so the busy
recent ones get room. The chevron unfolds the strip into eight lanes, one per band.

</td>
<td width="33%" valign="top">

**3 · The record**

Scrolling hands the strip over to a sticky band bar that tracks which band and card you are on.
Cards with a picture or video show as glass tiles, the rest as wide cards, newest first.

</td>
</tr>
</table>

## The record

<div align="center">

<img src="docs/assets/readme/record.jpg" width="720" alt="The Research band: a sticky orange band bar at the top with ticks for each paper, above a three-column grid of glass tiles, each showing a journal name, a small line-drawn topic icon, a paper title and a year, with the rainbow beam glowing through the tiles">

<sub>The Research band, reached with <code>parthchandak.info/#research</code>.</sub>

</div>

The eight bands, each with its own colour on the strip and the bar:

| Band | Holds |
|---|---|
| Career | Jobs and education |
| Patent | The audio prioritization filing and its publications |
| Research | Papers as text tiles with a journal name and topic mark |
| Judging | Hackathon judging and journal peer review |
| Impact | Volunteering and fundraising |
| Recognition | Awards, talks and press |
| Memberships | Professional societies |
| Projects | Built work, plus the Lab: 27 public side projects shown as one card of tiles |

<div align="center">

<img src="docs/assets/readme/mobile.jpg" width="32%" alt="The same play-mode screen on a phone: the typed greeting and role, the coloured strip drawn as dense full-width ticks, the prism and rainbow below, and the four round buttons stacked on the right">

<sub>Play mode on a phone-sized screen.</sub>

</div>

## Features

- **Two modes, one page.** Play mode is the 3D scene; the record is the readable résumé. First-time visitors get play mode, returning visitors and deep links get the record.
- **Deep links per band.** `#experience`, `#research`, `#projects` and the rest open the record scrolled to that section.
- **Light and dark.** A toggle swaps the theme for the scene and the glass UI together.
- **Beam lock.** Hold the beam still so it stops chasing the pointer while you read.
- **Proof links.** Ticks with a public source (a DOI, a patent page, a live project) link straight to it.
- **One data file per thing.** Cards live in `src/data/timelineData.js`, the Lab in `src/data/lab.js`, bands in `src/data/spectrum.js`.
- **Static and locked down.** No backend. Cloudflare Pages serves it with HSTS, a strict Content Security Policy and a sitemap.

## Run it

Requires Node 16 or newer.

```bash
git clone https://github.com/parthchandak02/portfolio.git
cd portfolio
npm ci
npm run dev      # http://localhost:3000 (frees port 3000 first)
npm run build    # static site in build/
```

Every push to `main` deploys to Cloudflare Pages (build command `npm run build`, output `build`).
Add `[skip ci]` to a commit message to skip the build for docs-only changes.

<details>
<summary><b>Project layout</b></summary>

```
src/
  App.js                    Play mode / record switch, deep links, theme
  components/
    Canvas3D.js, Scene.js   R3F canvas, post-processing, scene setup
    Beam.js, Prism.js,
    Rainbow.js, Flare.js    The light beam, the GLTF prism, refraction and flare
    Spectrograph.js         The tick strip and its eight lanes
    BandBar.js              Sticky band bar in the record
    Timeline.js, TimelineCard.js, CardTile.js, LabShowcase.js
                            Cards, glass tiles and the Lab card
    UITypewriter.js         The greeting and cycling roles
    RightSidebar.js         Social and contact links
  data/
    timelineData.js         Every card, by category
    spectrum.js             Band names, colours and dated items
    lab.js                  Public side projects
  hooks/                    Mouse, light mode, scroll tracking
public/
  gltf/                     prism.glb
  logos/, images/           Card logos and pictures
  _headers, robots.txt, sitemap.xml, CNAME
scripts/logos/              Tools that render card logos and topic marks to one style
```

</details>

<details>
<summary><b>Editing content</b></summary>

**Add a card.** Append to the right category in `src/data/timelineData.js`:

```javascript
{
  title: "Job title",
  company: "Company",
  companyLogo: "/logos/company-logo.png",
  date: "January 2020 - Present",
  location: "City, State",
  description: "What you did.",
  skills: ["React", "Design"]
}
```

Dates drive placement on the strip: `"February 2022 - Present"` starts at Feb 2022 and is open-ended;
a bare `"2019"` sits mid-year.

**Add a Lab project.** One object in `src/data/lab.js` adds a tile to the Lab and a tick to the
Projects band.

**Add a logo.** Logos are one-colour white marks on a transparent 512 x 512 PNG. Make one from an
organisation's file with `node scripts/logos/make-logo.mjs <source> public/logos/<name>-logo.png`;
see [scripts/logos/README.md](scripts/logos/README.md) for the options and the topic marks.

**Other things to change for your own copy:** `homepage` in `package.json`, `public/CNAME`, the links
in `src/components/RightSidebar.js`, colours in `src/styles.css` and the component CSS files, and
the model at `public/gltf/prism.glb`.

</details>

<details>
<summary><b>Scripts</b></summary>

| Command | Does |
|---|---|
| `npm run dev` | Dev server on port 3000, after freeing the port |
| `npm run build` | Production build without source maps |
| `npm run build:analyze` | Build, then inspect bundle size with source-map-explorer |
| `npm run lint` / `lint:fix` | ESLint over `src/` |
| `npm run format` / `format:check` | Prettier over `src/` |
| `npm run health` | `npm outdated` and `npm audit` |
| `npm run clean` | Remove `build/` |

Check a production build locally with `npx serve -s build -l 8080`.

</details>

<details>
<summary><b>Deployment and troubleshooting</b></summary>

**Cloudflare Pages setup:** Workers & Pages → Create → Pages → Connect to Git, production branch
`main`, build command `npm run build`, output directory `build`. Add the custom domain under the
project's Custom domains; DNS and TLS are set up automatically. Roll back from Deployments → ⋮ →
Rollback. `public/_headers` sets the security headers, including the CSP; anything that loads from a
new origin (a font, an embed, an image host) has to be added there.

The build is a plain static folder, so Vercel or Netlify work too (build `npm run build`, publish `build`).

| Symptom | Fix |
|---|---|
| Build runs out of memory | `NODE_OPTIONS=--max-old-space-size=4096 npm run build` |
| 3D scene is blank | Check the console for WebGL errors and that `public/gltf/prism.glb` exists |
| Assets 404 after deploy | `homepage` in `package.json` must match the deployed URL |
| Cloudflare build fails | Keep only `package-lock.json` as a lockfile; build command `npm run build` |

</details>

<br>

<div align="center">
<sub>Built with React, Three.js, React Three Fiber and Lucide icons. Hosted on Cloudflare Pages.</sub>
</div>
