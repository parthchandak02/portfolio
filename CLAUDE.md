# Portfolio

Before changing the 3D scene, its shaders, post-processing or the prism ⇄ bubbles switch, read
[docs/3d-debugging.md](docs/3d-debugging.md). It lists the shader patterns that break on some GPUs, how to
measure in a real browser, and the checklist to run before deploying.

To add or edit a card (a job, paper, award, press piece), see [docs/content.md](docs/content.md): each card is a
Markdown file in `src/content/cards/<section>/`, checked at build time.

Never run `npm run dev` or `npm start` here: they free port 3000, which another service on this machine uses. Test
with `npm run build` and `astro preview` on another port.
