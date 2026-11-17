// The spectrograph's record (src/data/spectrum.js): where each line sits, which card a
// line opens, and which line wears the selected-work diamond. The page sorts cards
// with these date functions, while the build sorts with the copy in scripts/cards.mjs.
// Run with `npm test`.
import fs from 'node:fs';
import path from 'node:path';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  endOf as cardsEndOf,
  loadCards,
  newestFirst as cardsNewestFirst,
  startOf as cardsStartOf,
} from '../scripts/cards.mjs';
import { FEATURED } from '../src/data/featured.js';
import { labProjects } from '../src/data/lab.js';
import { SECTIONS } from '../src/data/sections.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const { bySection } = loadCards(root);

// spectrum.js imports `virtual:cards` and extensionless neighbours. This hook
// resolves both, so Node loads the same module the page loads.
const cardsSource = `export const cardsBySection = ${JSON.stringify(bySection)};`;
const extensionFor = (specifier, parentURL) => {
  if (!specifier.startsWith('.') || !parentURL) return null;
  const base = path.resolve(path.dirname(fileURLToPath(parentURL)), specifier);
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return null;
  for (const ext of ['.js', '.jsx', '.mjs']) {
    if (fs.existsSync(base + ext)) return pathToFileURL(base + ext).href;
  }
  return null;
};
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'virtual:cards') {
      return { url: 'virtual:cards', shortCircuit: true };
    }
    const url = extensionFor(specifier, context.parentURL);
    if (url) return { url, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'virtual:cards') {
      return { format: 'module', source: cardsSource, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
after(() => hooks.deregister());

const {
  SPECTRUM_END,
  SPECTRUM_START,
  bandForSection,
  endOf,
  newestFirst,
  selectedBand,
  spectrumBands,
  spectrumTotal,
  startOf,
} = await import('../src/data/spectrum.js');

const band = (key) => spectrumBands.find((entry) => entry.key === key);

test('a dated line is placed by its month, and an open span has no end', () => {
  assert.equal(startOf('February 2022'), 2022 + 1 / 12);
  assert.equal(startOf('February 2022 - Present'), 2022 + 1 / 12);
  assert.equal(endOf('February 2022 - Present'), Infinity);
  assert.equal(startOf('2022'), 2022.5);
  assert.equal(startOf('December 2022'), 2022 + 11 / 12);
  assert.equal(startOf('2016 - 2018'), 2016.5);
  assert.equal(endOf('2016 - 2018'), 2018.5);
  // A single month ends where it starts. The old endOf added half a year.
  assert.equal(endOf('October 2023'), startOf('October 2023'));
  assert.equal(startOf('May 2018'), endOf('May 2018'));
  // The end of a range keeps its own month. The old endOf kept only the year.
  assert.equal(endOf('May 2018 - August 2018'), startOf('August 2018'));
  assert.equal(endOf('May 2025 - Present'), Infinity);
  // "Feb 22, 2026" is February: the month is the first three letters.
  assert.equal(startOf('Feb 22, 2026'), 2026 + 1 / 12);
  // The patent card names two years without a range separator, so both ends
  // follow the first year, at mid-year.
  assert.equal(startOf('Filed June 2024, published January 2026'), 2024.5);
  assert.equal(endOf('Filed June 2024, published January 2026'), 2024.5);
  assert.equal(startOf(''), 0);
  assert.equal(endOf(''), 0);
  assert.equal(startOf('no year here'), 0);
});

test('the page and the build read every shipped date the same way', () => {
  const dates = [
    ...Object.values(bySection)
      .flat()
      .map((card) => card.date),
    ...labProjects.map((project) => project.date),
    'February 2022 - Present',
    '2016 - 2018',
    'May 2018 - August 2018',
    'October 2023',
    'Feb 22, 2026',
    'Filed June 2024, published January 2026',
    '',
  ];
  for (const date of dates) {
    assert.equal(startOf(date), cardsStartOf(date), `startOf(${date})`);
    assert.equal(endOf(date), cardsEndOf(date), `endOf(${date})`);
    assert.equal(
      newestFirst(date, 'May 2018 - Present'),
      cardsNewestFirst(date, 'May 2018 - Present'),
      `newestFirst(${date}, May 2018 - Present)`
    );
  }
});

test('newest first, and a longer or ongoing span wins a shared start', () => {
  assert.ok(newestFirst('February 2022', 'December 2022') > 0);
  assert.ok(newestFirst('February 2022', '2022') > 0);
  assert.ok(newestFirst('May 2018', 'May 2018 - August 2018') > 0);
  assert.ok(newestFirst('May 2018 - August 2018', 'May 2018 - Present') > 0);
  assert.equal(newestFirst('March 2020', 'March 2020'), 0);
  // Two open spans with the same start both end at Infinity. Subtracting those
  // used to yield NaN, which made Array.sort skip the documented tie.
  assert.equal(newestFirst('May 2018 - Present', 'May 2018 - Present'), 0);
  assert.equal(Number.isNaN(newestFirst('May 2018 - Present', 'May 2018 - Present')), false);
});

test('cards loaded onto a band keep their date, order, and parent', () => {
  const career = ['experience', 'education'].flatMap((id) => bySection[id]);
  assert.deepEqual(
    band('career').items.map((item) => item.title),
    career.map((card) => card.title)
  );
  const impact = bySection.impact;
  assert.deepEqual(
    band('impact').items.map((item) => item.title),
    impact.map((card) => card.title)
  );
  const projects = [...labProjects, ...bySection.projects];
  assert.deepEqual(
    band('projects').items.map((item) => item.title),
    projects.map((card) => card.title)
  );
  const media = bySection.media;
  const recognition = band('recognition').items;
  assert.deepEqual(
    recognition.slice(-media.length).map((item) => item.title),
    media.map((card) => card.title)
  );

  for (const card of [...career, ...impact, ...projects, ...media]) {
    const line = spectrumBands
      .flatMap((entry) => entry.items)
      .find((item) => item.title === card.title);
    assert.equal(line.when, card.date, card.title);
    assert.equal(line.t, startOf(card.date), card.title);
    assert.equal(line.card, card.parent || card.title, card.title);
    assert.equal(
      line.meta,
      [card.company, card.location].filter(Boolean).join(', '),
      card.title
    );
    assert.equal(line.url, card.url, card.title);
  }

  // A project shown inside a role jumps to the role's card.
  assert.equal(
    band('career').items.find((item) => item.title === 'Find My Zoox').card,
    'Creative Technologist'
  );
  assert.equal(
    band('career').items.find((item) => item.title === 'ZooxCast').card,
    'Creative Technologist'
  );
});

test('every line opens a real card and sits inside the strip', () => {
  const titles = new Set([
    ...Object.values(bySection)
      .flat()
      .map((card) => card.title),
    ...labProjects.map((project) => project.title),
  ]);
  for (const entry of spectrumBands) {
    assert.equal(entry.section, entry.sections[0], entry.key);
    assert.equal(typeof entry.name, 'string');
    assert.equal(typeof entry.hue, 'string');
    for (const item of entry.items) {
      assert.ok(item.title, entry.key);
      assert.equal(typeof item.when, 'string', item.title);
      assert.equal(typeof item.meta, 'string', item.title);
      assert.ok(Number.isFinite(item.t), item.title);
      assert.ok(
        item.t >= SPECTRUM_START && item.t <= SPECTRUM_END,
        `${item.title} at ${item.t}`
      );
      assert.ok(
        titles.has(item.card),
        `${entry.key}: ${item.title} -> ${item.card}`
      );
    }
  }
  assert.equal(
    spectrumTotal,
    spectrumBands.reduce((count, entry) => count + entry.items.length, 0)
  );
});

test('lines that share one card all open that card', () => {
  const reviews = band('judging').items.filter((item) =>
    item.meta.startsWith('Peer reviewer')
  );
  assert.ok(reviews.length > 1);
  for (const item of reviews) {
    assert.equal(item.card, 'Peer Reviewer, Springer Nature');
  }
  for (const item of band('patent').items) {
    assert.equal(item.card, 'Audio Prioritization (US20260003563A1)');
  }
  // The override links this keynote to its talk. Their titles share too few
  // words for the matcher.
  const keynote = band('recognition').items.find((item) =>
    item.title.startsWith('ICETAIA')
  );
  assert.equal(
    keynote.card,
    'A Practical Framework for Rapid Prototyping and Fidelity in Product Development'
  );
});

test('the diamond sits on the line the card itself links to, one per pick', () => {
  const diamonds = spectrumBands.flatMap((entry) =>
    entry.items.filter((item) => item.featured)
  );
  assert.equal(diamonds.length, FEATURED.length);

  const patent = band('patent').items;
  const marked = patent.filter((item) => item.featured);
  assert.deepEqual(
    marked.map((item) => item.title),
    ['US20260003563A1, published application']
  );
  assert.equal(
    marked[0].url,
    'https://patents.google.com/patent/US20260003563A1/en'
  );
  assert.ok(
    patent.find(
      (item) => item.title === 'Audio prioritization, application filed'
    ).featured !== true
  );
  assert.ok(
    patent.find(
      (item) => item.title === 'WO2026005985A1, international publication'
    ).featured !== true
  );

  assert.deepEqual(
    selectedBand.items.map((item) => item.card),
    FEATURED.map((feature) => feature.title)
  );
  for (const item of selectedBand.items) {
    const home = spectrumBands.find((entry) =>
      entry.items.some(
        (line) =>
          line.featured && (line.card === item.card || line.title === item.card)
      )
    );
    assert.equal(item.hue, home.hue, item.card);
  }
});

test('each section of the page belongs to one band', () => {
  for (const section of SECTIONS) {
    const home = bandForSection(section.id);
    assert.ok(home, section.id);
    assert.ok(home.sections.includes(section.id), section.id);
  }
  assert.equal(bandForSection('experience').key, 'career');
  assert.equal(bandForSection('education').key, 'career');
  assert.equal(bandForSection('awards').key, 'recognition');
  assert.equal(bandForSection('speaking').key, 'recognition');
  assert.equal(bandForSection('media').key, 'recognition');
  assert.equal(bandForSection('lab').key, 'projects');
  assert.equal(bandForSection('projects').key, 'projects');
  assert.equal(bandForSection('selected'), selectedBand);
  assert.equal(bandForSection('nowhere'), null);
});

test('coloured bands run from the red end of the beam toward violet', () => {
  assert.equal(band('career').wave, undefined);
  const waves = spectrumBands.slice(1).map((entry) => entry.wave);
  assert.ok(waves.every((wave) => typeof wave === 'number'));
  assert.deepEqual(
    waves,
    [...waves].sort((a, b) => b - a)
  );
});
