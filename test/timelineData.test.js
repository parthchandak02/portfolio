// The page's card list and greeting (src/data/timelineData.js, featured.js, sections.js):
// every skill needs an icon, featured picks must name real cards, Lab preview must name real
// Lab projects, and the typewriter roles come from the cards themselves. Run with `npm test`.
import fs from 'node:fs';
import path from 'node:path';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadCards } from '../scripts/cards.mjs';
import { FEATURED, featuredName } from '../src/data/featured.js';
import { labProjects } from '../src/data/lab.js';
import { SECTIONS, categoryOrder, layoutOf, sectionOf } from '../src/data/sections.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const { bySection } = loadCards(root);
const cards = Object.values(bySection).flat();

const LUCIDE_EXPORTS = [
  'Code',
  'Database',
  'GitBranch',
  'Cpu',
  'Terminal',
  'Settings',
  'Zap',
  'CircuitBoard',
  'Microchip',
  'Figma',
  'Palette',
  'Layers',
  'Box',
  'Printer',
  'PenTool',
  'Gamepad2',
  'Trello',
  'Mail',
  'Monitor',
  'FileText',
  'Factory',
  'Wrench',
  'Users',
  'Cog',
  'ChartBar',
  'TruckElectric',
  'PencilRuler',
  'FileJson',
  'Presentation',
  'DollarSign',
  'Plane',
  'School',
  'Lightbulb',
  'Crown',
  'HeartHandshake',
  'Handshake',
  'Microscope',
  'User',
  'Vibrate',
  'Sun',
  'Dna',
  'BrainCircuit',
  'HandCoins',
  'Computer',
  'Beaker',
  'Glasses',
  'Award',
  'Star',
  'IterationCw',
  'BriefcaseMedical',
  'Brain',
  'Video',
  'RadioTower',
  'Leaf',
  'GraduationCap',
  'Battery',
  'Accessibility',
  'Newspaper',
  'Pen',
  'Speech',
  'Mic',
];

const cardsSource = `export const cardsBySection = ${JSON.stringify(bySection)};`;
const lucideSource = LUCIDE_EXPORTS.map((name) => `export const ${name} = '${name}';`).join(
  '\n'
);

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
    if (specifier === 'lucide-react') {
      return { url: 'virtual:lucide-react', shortCircuit: true };
    }
    const url = extensionFor(specifier, context.parentURL);
    if (url) return { url, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'virtual:cards') {
      return { format: 'module', source: cardsSource, shortCircuit: true };
    }
    if (url === 'virtual:lucide-react') {
      return { format: 'module', source: lucideSource, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
after(() => hooks.deregister());

const {
  getTypewriterData,
  iconMap,
  timelineData,
  timelineDataByCategory,
} = await import('../src/data/timelineData.js');

test('every skill on a Markdown card has an icon for the details tags', () => {
  const missing = [];
  for (const card of cards) {
    for (const skill of card.skills || []) {
      if (!iconMap[skill]) missing.push(`${card.title}: ${skill}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('the typewriter roles come from the cards, unique, each with a prefix', () => {
  const roles = getTypewriterData();
  assert.ok(roles.length > 0);
  assert.equal(roles.length, new Set(roles.map((r) => r.title)).size);
  for (const role of roles) {
    assert.match(role.prefix, /^I am an?$/);
    assert.ok(role.title);
    assert.ok(Array.isArray(role.skills));
    assert.equal(role.sidebarCategories.length, 1);
  }
  assert.deepEqual(
    roles.map((r) => r.title).sort(),
    [
      'Creative Technologist',
      'Inventor',
      'Maker',
      'Mechanical Engineer',
      'Programmer',
      'Prototyper',
      'Researcher',
      'Reviewer',
      'Team Leader',
    ]
  );
});

test('timelineData walks the page sections in order and includes the Lab', () => {
  assert.deepEqual(Object.keys(timelineDataByCategory).sort(), [
    ...categoryOrder,
  ].sort());
  assert.equal(timelineDataByCategory.lab, labProjects);
  assert.deepEqual(
    timelineData.map((item) => item.title),
    categoryOrder.flatMap((id) => (timelineDataByCategory[id] || []).map((c) => c.title))
  );
});

test('featured picks name real cards and featuredName returns their short labels', () => {
  const titles = new Set([...cards, ...labProjects].map((c) => c.title));
  for (const feature of FEATURED) {
    assert.ok(titles.has(feature.title), feature.title);
    assert.equal(featuredName(feature.title), feature.name);
  }
  assert.equal(featuredName('no such card'), undefined);
});

test('the Lab preview names projects that exist in lab.js', () => {
  const titles = new Set(labProjects.map((p) => p.title));
  SECTIONS.find((s) => s.id === 'lab').preview.forEach((t) =>
    assert.ok(titles.has(t), `no Lab project titled "${t}"`)
  );
});

test('sectionOf and layoutOf follow SECTIONS', () => {
  assert.equal(sectionOf('experience').layout, 'timeline');
  assert.equal(layoutOf('experience'), 'timeline');
  assert.equal(layoutOf('research'), 'tiles');
  assert.equal(layoutOf('nowhere'), 'tiles');
  assert.equal(sectionOf('nowhere'), undefined);
});
