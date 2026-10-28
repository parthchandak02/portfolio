// Loads the portfolio's cards from src/content/cards/<section>/*.md as the module `virtual:cards`, checking
// each one as it goes. A card is a Markdown file: its fields in the front matter, its description as the body.
// Anything wrong (a misspelt field, a logo or image that isn't in public/, a parent that doesn't exist, two
// cards with one title) stops the build with the file's name. In dev, editing a card reloads the page.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { SECTIONS } from '../src/data/sections.js';

const ID = 'virtual:cards';
const RESOLVED = `\0${ID}`;

const asset = z.string().regex(/^\/[\w./-]+$/, 'a path under public/, starting with /');
const Card = z.strictObject({
  title: z.string().min(1).max(100),
  parent: z.string().optional(), // the title of the card this one is shown inside
  tile: z.enum(['info', 'photo']).optional(), // the tile style, when it shouldn't follow from the picture
  company: z.string().optional(),
  companyLogo: asset.optional(),
  projectImage: asset.optional(),
  video: z.strictObject({ id: z.string().min(1), title: z.string().min(1) }).optional(),
  url: z.url().optional(),
  date: z.string().regex(/\d{4}/, 'needs a year'),
  location: z.string().optional(),
  volume: z.string().optional(), // for papers: "Journal, Volume n, Issue m"
  skills: z.array(z.string()).optional(),
  typewriterTitle: z.string().optional(),
  typewriterPrefix: z.string().optional()
});

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// "February 2022 - Present" -> 2022.08, "2016 - 2018" -> 2016.5 (as in data/spectrum.js)
const startOf = (date) => {
  const first = date.split(' - ')[0];
  const year = Number((first.match(/\d{4}/) || [])[0]);
  const month = MONTHS.indexOf(first.slice(0, 3).toLowerCase());
  return month === -1 ? year + 0.5 : year + month / 12;
};

const FRONT = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

export const loadCards = (root) => {
  const dir = path.join(root, 'src/content/cards');
  const errors = [];
  const files = [];
  const bySection = {};
  SECTIONS.filter((s) => s.id !== 'lab').forEach(({ id }) => {
    bySection[id] = [];
    const folder = path.join(dir, id);
    if (!fs.existsSync(folder)) return;
    fs.readdirSync(folder).filter((f) => f.endsWith('.md')).sort().forEach((f) => {
      const file = path.join(folder, f);
      const rel = path.relative(root, file);
      files.push(file);
      const m = fs.readFileSync(file, 'utf8').match(FRONT);
      if (!m) { errors.push(`${rel}: needs front matter between --- lines`); return; }
      let data;
      try { data = yaml.load(m[1]); } catch (e) { errors.push(`${rel}: ${e.message.split('\n')[0]}`); return; }
      const parsed = Card.safeParse(data);
      if (!parsed.success) {
        parsed.error.issues.forEach((i) => errors.push(`${rel}: ${i.path.join('.') || 'card'}: ${i.message}`));
        return;
      }
      const description = m[2].trim();
      if (!description) errors.push(`${rel}: needs a description below the front matter`);
      ['companyLogo', 'projectImage'].forEach((k) => {
        const p = parsed.data[k];
        if (p && !fs.existsSync(path.join(root, 'public', p))) errors.push(`${rel}: ${k} ${p} isn't in public/`);
      });
      bySection[id].push({ ...parsed.data, category: id, description, _file: rel });
    });
  });
  // Every directory under cards/ has to be a known section
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && !bySection[d.name])
      .forEach((d) => errors.push(`src/content/cards/${d.name}: not a section in src/data/sections.js`));
  }
  const all = Object.values(bySection).flat();
  const titles = new Map();
  all.forEach((c) => {
    if (titles.has(c.title)) errors.push(`${c._file}: same title as ${titles.get(c.title)}`);
    else titles.set(c.title, c._file);
  });
  all.forEach((c) => { if (c.parent && !titles.has(c.parent)) errors.push(`${c._file}: parent "${c.parent}" isn't a card title`); });
  if (errors.length) throw new Error(`The portfolio's cards have problems:\n  ${errors.join('\n  ')}`);
  all.forEach((c) => { delete c._file; });
  // Newest first within a section, as the page shows them; ties keep the files' alphabetical order
  Object.values(bySection).forEach((list) => list.sort((a, b) => startOf(b.date) - startOf(a.date)));
  return { bySection, files };
};

export default function cards() {
  let root = process.cwd();
  return {
    name: 'portfolio-cards',
    configResolved(config) { root = config.root; },
    resolveId(id) { return id === ID ? RESOLVED : null; },
    load(id) {
      if (id !== RESOLVED) return null;
      const { bySection, files } = loadCards(root);
      files.forEach((f) => this.addWatchFile(f));
      return `export const cardsBySection = ${JSON.stringify(bySection)};`;
    },
    configureServer(server) {
      const dir = path.join(root, 'src/content/cards');
      server.watcher.add(dir);
      const reload = (file) => {
        if (!file.startsWith(dir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      ['add', 'change', 'unlink'].forEach((e) => server.watcher.on(e, reload));
    }
  };
}
