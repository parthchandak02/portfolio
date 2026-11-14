// Tests for the card loader in cards.mjs, the check that stands between a bad card and a broken build.
// Each case writes a throwaway repo root in the temp directory and loads it, so the real content is only
// touched by the last block, which guards against the portfolio's own cards drifting out of the rules.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadCards } from './cards.mjs';
import { SECTIONS } from '../src/data/sections.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const temps = [];

// A repo root holding only what the loader reads: cards under src/content/cards/, assets under public/.
const fixture = ({ cards = {}, assets = [], folders = [] } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-cards-'));
  temps.push(root);
  fs.mkdirSync(path.join(root, 'src/content/cards'), { recursive: true });
  folders.forEach((f) => fs.mkdirSync(path.join(root, 'src/content/cards', f), { recursive: true }));
  Object.entries(cards).forEach(([rel, body]) => {
    const file = path.join(root, 'src/content/cards', rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
  });
  assets.forEach((rel) => {
    const file = path.join(root, 'public', rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '');
  });
  return root;
};

const card = (front, description = 'What it was.') => `---\n${front}\n---\n${description}\n`;

// The loader reports every problem at once, so tests read the whole message rather than one error.
const problems = (spec) => {
  try {
    loadCards(fixture(spec));
  } catch (e) {
    return e.message;
  }
  return assert.fail('expected the cards to be rejected, but they loaded');
};

after(() => temps.forEach((d) => fs.rmSync(d, { recursive: true, force: true })));

describe('loadCards: a card that is in order', () => {
  it('reads the front matter as fields and the body as the description', () => {
    const { bySection } = loadCards(
      fixture({
        cards: {
          'awards/merit.md': card(
            ['title: International Merit Award', 'company: Gonzaga', 'date: May 2016', 'skills:', '  - Engineering'].join('\n'),
            'Awarded for merit.'
          )
        }
      })
    );
    assert.deepEqual(bySection.awards, [
      {
        title: 'International Merit Award',
        company: 'Gonzaga',
        date: 'May 2016',
        skills: ['Engineering'],
        category: 'awards',
        description: 'Awarded for merit.'
      }
    ]);
  });

  it('keeps no trace of the file path it used for error messages', () => {
    const { bySection } = loadCards(fixture({ cards: { 'awards/a.md': card('title: A\ndate: May 2016') } }));
    assert.equal('_file' in bySection.awards[0], false);
  });

  it('lists every card file so the dev server can watch them, and nothing else', () => {
    const root = fixture({
      cards: {
        'awards/a.md': card('title: A\ndate: May 2016'),
        'judging/b.md': card('title: B\ndate: May 2017'),
        'awards/notes.txt': 'not a card'
      }
    });
    const { files } = loadCards(root);
    assert.deepEqual(files.map((f) => path.relative(root, f)).sort(), [
      path.join('src/content/cards/awards/a.md'),
      path.join('src/content/cards/judging/b.md')
    ]);
  });

  it('gives every section a list, even an empty one, and skips the Lab', () => {
    const { bySection } = loadCards(fixture());
    assert.deepEqual(
      Object.keys(bySection),
      SECTIONS.filter((s) => s.id !== 'lab').map((s) => s.id)
    );
    assert.equal('lab' in bySection, false);
  });

  // The Lab keeps its projects in src/data/lab.js, so a cards/lab/ folder is a mistake like any other.
  it('turns down a cards/lab folder, because the Lab is not loaded from Markdown', () => {
    assert.match(problems({ folders: ['lab'] }), /src\/content\/cards\/lab: not a section in src\/data\/sections\.js/);
  });
});

describe('loadCards: the order cards come back in', () => {
  // startOf reads a month when the date names one and falls back to mid-year otherwise, so "February 2022"
  // sits below a bare "2022" and "December 2022" sits above it.
  it('puts the newest first and reads a month inside the year', () => {
    const { bySection } = loadCards(
      fixture({
        cards: {
          'awards/a.md': card("title: Year only\ndate: '2022'"),
          'awards/b.md': card('title: Early in the year\ndate: February 2022 - Present'),
          'awards/c.md': card('title: Late in the year\ndate: December 2022'),
          'awards/d.md': card('title: Older\ndate: 2016 - 2018')
        }
      })
    );
    assert.deepEqual(
      bySection.awards.map((c) => c.title),
      ['Late in the year', 'Year only', 'Early in the year', 'Older']
    );
  });

  it('keeps the files alphabetical when two cards share a date', () => {
    const { bySection } = loadCards(
      fixture({
        cards: {
          'awards/zebra.md': card('title: Written second\ndate: March 2020'),
          'awards/alpha.md': card('title: Written first\ndate: March 2020')
        }
      })
    );
    assert.deepEqual(
      bySection.awards.map((c) => c.title),
      ['Written first', 'Written second']
    );
  });

  it('sorts each section on its own', () => {
    const { bySection } = loadCards(
      fixture({
        cards: {
          'awards/a.md': card('title: Old award\ndate: May 2016'),
          'judging/b.md': card('title: New judging\ndate: May 2024')
        }
      })
    );
    assert.deepEqual(
      bySection.awards.map((c) => c.title),
      ['Old award']
    );
    assert.deepEqual(
      bySection.judging.map((c) => c.title),
      ['New judging']
    );
  });
});

describe('loadCards: the problems it stops the build for', () => {
  it('names a file with no front matter', () => {
    assert.match(problems({ cards: { 'awards/a.md': 'Just a description.\n' } }), /awards\/a\.md: needs front matter between --- lines/);
  });

  it('names a file whose front matter is not YAML', () => {
    assert.match(problems({ cards: { 'awards/a.md': card('title: [unclosed\ndate: May 2016') } }), /awards\/a\.md: /);
  });

  it('rejects a field that is not one of the card fields', () => {
    assert.match(problems({ cards: { 'awards/a.md': card('title: A\ndate: May 2016\ncompnay: Typo') } }), /awards\/a\.md: .*compnay/);
  });

  it('rejects a date with no year', () => {
    assert.match(problems({ cards: { 'awards/a.md': card('title: A\ndate: Last spring') } }), /awards\/a\.md: date: needs a year/);
  });

  // YAML reads an unquoted 2016 as a number, so a year on its own has to be quoted or carry a month.
  it('rejects a bare year that YAML turned into a number', () => {
    assert.match(problems({ cards: { 'awards/a.md': card('title: A\ndate: 2016') } }), /awards\/a\.md: date: .*expected string/);
  });

  it('rejects a card with no title and one with no date', () => {
    const message = problems({ cards: { 'awards/a.md': card('date: May 2016'), 'awards/b.md': card('title: B') } });
    assert.match(message, /awards\/a\.md: title/);
    assert.match(message, /awards\/b\.md: date/);
  });

  it('rejects a note longer than a short line', () => {
    assert.match(problems({ cards: { 'awards/a.md': card(`title: A\ndate: May 2016\nnote: ${'x'.repeat(41)}`) } }), /awards\/a\.md: note/);
  });

  it('rejects a url that is not one', () => {
    assert.match(problems({ cards: { 'awards/a.md': card('title: A\ndate: May 2016\nurl: not-a-url') } }), /awards\/a\.md: url/);
  });

  it('rejects a tile style it has no layout for', () => {
    assert.match(problems({ cards: { 'awards/a.md': card('title: A\ndate: May 2016\ntile: banner') } }), /awards\/a\.md: tile/);
  });

  it('asks for a description below the front matter', () => {
    assert.match(
      problems({ cards: { 'awards/a.md': '---\ntitle: A\ndate: May 2016\n---\n   \n' } }),
      /awards\/a\.md: needs a description below the front matter/
    );
  });
});

describe('loadCards: images and logos', () => {
  it('accepts an asset that is in public/', () => {
    assert.doesNotThrow(() =>
      loadCards(
        fixture({ cards: { 'awards/a.md': card('title: A\ndate: May 2016\ncompanyLogo: /logos/ieee.png') }, assets: ['logos/ieee.png'] })
      )
    );
  });

  it('names a logo and an image that are not in public/', () => {
    const message = problems({
      cards: {
        'awards/a.md': card('title: A\ndate: May 2016\ncompanyLogo: /logos/missing.png'),
        'awards/b.md': card('title: B\ndate: May 2016\nprojectImage: /images/missing.jpg')
      }
    });
    assert.match(message, /awards\/a\.md: companyLogo \/logos\/missing\.png isn't in public\//);
    assert.match(message, /awards\/b\.md: projectImage \/images\/missing\.jpg isn't in public\//);
  });

  it('rejects an asset path that does not start at public/', () => {
    assert.match(
      problems({ cards: { 'awards/a.md': card('title: A\ndate: May 2016\ncompanyLogo: logos/ieee.png') }, assets: ['logos/ieee.png'] }),
      /awards\/a\.md: companyLogo: a path under public\/, starting with \//
    );
  });
});

describe('loadCards: how cards refer to each other', () => {
  it('rejects two cards sharing a title, across sections as well', () => {
    const message = problems({
      cards: {
        'awards/a.md': card('title: Same Name\ndate: May 2016'),
        'judging/b.md': card('title: Same Name\ndate: May 2017')
      }
    });
    // Sections are walked in page order, so judging is seen first and the award is the one reported.
    assert.match(message, /awards\/a\.md: same title as .*judging\/b\.md/);
  });

  it('accepts a parent in another section', () => {
    assert.doesNotThrow(() =>
      loadCards(
        fixture({
          cards: {
            'experience/parent.md': card('title: Creative Technologist\ndate: May 2022'),
            'projects/child.md': card('title: Find My Zoox\ndate: May 2023\nparent: Creative Technologist')
          }
        })
      )
    );
  });

  it('rejects a parent that names no card', () => {
    assert.match(
      problems({ cards: { 'awards/a.md': card('title: A\ndate: May 2016\nparent: Nobody') } }),
      /awards\/a\.md: parent "Nobody" isn't a card title/
    );
  });

  it('rejects a folder that is not a section', () => {
    assert.match(problems({ folders: ['hobbies'] }), /src\/content\/cards\/hobbies: not a section in src\/data\/sections\.js/);
  });
});

describe('the cards this portfolio ships with', () => {
  it('load without a single problem', () => {
    assert.doesNotThrow(() => loadCards(repoRoot));
  });

  it('fill every section the page shows', () => {
    const { bySection } = loadCards(repoRoot);
    Object.entries(bySection).forEach(([id, list]) => assert.ok(list.length > 0, `${id} has no cards`));
  });

  it('give the research section the cards its preview names', () => {
    const { bySection } = loadCards(repoRoot);
    const titles = new Set(bySection.research.map((c) => c.title));
    SECTIONS.find((s) => s.id === 'research').preview.forEach((t) => assert.ok(titles.has(t), `no research card titled "${t}"`));
  });
});
