// Tests for the card loader in cards.mjs, the check that stands between a bad card and a broken build.
// Each case writes a throwaway repo root in the temp directory and loads it, so the real content is only
// touched by the last block, which guards against the portfolio's own cards drifting out of the rules.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import cardsPlugin, {
  endOf,
  formatCardIssue,
  loadCards,
  newestFirst,
  startOf
} from './cards.mjs';
import { SECTIONS } from '../src/data/sections.js';

const VIRTUAL_ID = 'virtual:cards';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

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

  it('puts the longer or ongoing card first when two cards share a start date', () => {
    const { bySection } = loadCards(
      fixture({
        cards: {
          'awards/a.md': card("title: Single year\ndate: '2016'"),
          'awards/b.md': card('title: Multi-year\ndate: 2016 - 2018'),
          'experience/a.md': card('title: Single month\ndate: May 2018'),
          'experience/b.md': card('title: Summer span\ndate: May 2018 - August 2018'),
          'experience/c.md': card('title: Ongoing\ndate: May 2018 - Present')
        }
      })
    );
    assert.deepEqual(
      bySection.awards.map((c) => c.title),
      ['Multi-year', 'Single year']
    );
    assert.deepEqual(
      bySection.experience.map((c) => c.title),
      ['Ongoing', 'Summer span', 'Single month']
    );
    assert.equal(endOf('October 2023'), startOf('October 2023'));
    assert.equal(endOf('May 2018 - August 2018'), startOf('August 2018'));
    assert.equal(endOf('2016 - 2018'), 2018.5);
    assert.equal(endOf('February 2022 - Present'), Infinity);
    assert.equal(endOf(''), 0);
    assert.equal(newestFirst('May 2018 - Present', 'May 2018 - Present'), 0);
    // Prose dates: find the month even when words come first, and use the
    // last named month as the end when there is no " - " separator.
    assert.equal(
      startOf('Filed June 2024, published January 2026'),
      2024 + 5 / 12
    );
    assert.equal(
      endOf('Filed June 2024, published January 2026'),
      2026 + 0 / 12
    );
    assert.equal(startOf('Feb 22, 2026'), 2026 + 1 / 12);
    assert.equal(endOf('October 25, 2026'), startOf('October 25, 2026'));
  });

  it('keeps file order when two ongoing cards share a start date', () => {
    // Both end at Present (Infinity). Infinity - Infinity is NaN, and that used
    // to make the sort drop the alphabetical file-order tie.
    const { bySection } = loadCards(
      fixture({
        cards: {
          'experience/zebra.md': card('title: Later file\ndate: May 2018 - Present'),
          'experience/alpha.md': card('title: Earlier file\ndate: May 2018 - Present')
        }
      })
    );
    assert.deepEqual(
      bySection.experience.map((c) => c.title),
      ['Earlier file', 'Later file']
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

describe('formatCardIssue: turns Zod jargon into a fix the author can use', () => {
  it('names the quote fix for a bare-year date', () => {
    assert.equal(
      formatCardIssue('src/content/cards/awards/a.md', {
        code: 'invalid_type',
        expected: 'string',
        path: ['date'],
        message: 'Invalid input: expected string, received number'
      }),
      "src/content/cards/awards/a.md: date: must be text; quote a bare year (date: '2016')"
    );
  });

  it('keeps custom schema messages such as needs a year', () => {
    assert.equal(
      formatCardIssue('a.md', {
        code: 'invalid_format',
        path: ['date'],
        message: 'needs a year'
      }),
      'a.md: date: needs a year'
    );
  });
});

describe('loadCards: the problems it stops the build for', () => {
  it('names a file with no front matter', () => {
    assert.match(problems({ cards: { 'awards/a.md': 'Just a description.\n' } }), /awards\/a\.md: needs front matter between --- lines/);
  });

  it('names a file whose front matter is not YAML, with line and column', () => {
    const message = problems({ cards: { 'awards/a.md': card('title: [unclosed\ndate: May 2016') } });
    assert.match(message, /awards\/a\.md: front matter YAML is invalid at line \d+, column \d+:/);
    assert.match(message, /missed comma between flow collection entries|incomplete|bad indentation|unidentified alias/);
  });

  it('rejects empty front matter instead of a vague zod object error', () => {
    assert.match(
      problems({ cards: { 'awards/a.md': '---\n\n---\nWhat it was.\n' } }),
      /awards\/a\.md: front matter is empty; add fields like title and date between the --- lines/
    );
  });

  it('rejects front matter that is a YAML list, not a mapping of fields', () => {
    assert.match(
      problems({ cards: { 'awards/a.md': '---\n- title: A\n- date: May 2016\n---\nWhat it was.\n' } }),
      /awards\/a\.md: front matter must be a mapping of fields \(got a list\)/
    );
  });

  it('rejects a field that is not one of the card fields', () => {
    assert.match(
      problems({ cards: { 'awards/a.md': card('title: A\ndate: May 2016\ncompnay: Typo') } }),
      /awards\/a\.md: unknown field "compnay" \(not a card field; check spelling\)/
    );
  });

  it('rejects a date with no year', () => {
    assert.match(problems({ cards: { 'awards/a.md': card('title: A\ndate: Last spring') } }), /awards\/a\.md: date: needs a year/);
  });

  // YAML reads an unquoted 2016 as a number, so a year on its own has to be quoted or carry a month.
  it('rejects a bare year that YAML turned into a number, and names the quote fix', () => {
    assert.match(
      problems({ cards: { 'awards/a.md': card('title: A\ndate: 2016') } }),
      /awards\/a\.md: date: must be text; quote a bare year \(date: '2016'\)/
    );
  });

  it('rejects a skills value that is not a YAML list, without Zod jargon', () => {
    assert.match(
      problems({ cards: { 'awards/a.md': card('title: A\ndate: May 2016\nskills: Engineering') } }),
      /awards\/a\.md: skills: must be a YAML list \(one "- item" per line under the field\)/
    );
  });

  it('rejects a note that YAML read as true/false, and says to quote it', () => {
    assert.match(
      problems({ cards: { 'awards/a.md': card('title: A\ndate: May 2016\nnote: true') } }),
      /awards\/a\.md: note: must be text \(YAML read this as true\/false; quote it if you mean those words\)/
    );
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
        fixture({
          cards: { 'awards/a.md': card('title: A\ndate: May 2016\ncompanyLogo: /logos/ieee.png') },
          assets: ['logos/ieee.png', 'logos/trim/ieee.png']
        })
      )
    );
  });

  it('names a tile card logo whose trimmed copy in public/logos/trim/ is missing', () => {
    const message = problems({
      cards: {
        'awards/a.md': card('title: A\ndate: May 2016\ncompanyLogo: /logos/ieee.png')
      },
      assets: ['logos/ieee.png']
    });
    assert.match(
      message,
      /awards\/a\.md: companyLogo \/logos\/ieee\.png needs its trimmed tile copy in public\/ \(looked for public\/logos\/trim\/ieee\.png\)/
    );
    // Wide timeline cards (experience, education) and topic marks do not render /logos/trim/ on a tile.
    assert.doesNotThrow(() =>
      loadCards(
        fixture({
          cards: {
            'experience/job.md': card('title: Engineer\ndate: May 2022\ncompanyLogo: /logos/zoox.png'),
            'research/paper.md': card('title: Paper\ndate: May 2024\ncompanyLogo: /logos/topic-robotics.png')
          },
          assets: ['logos/zoox.png', 'logos/topic-robotics.png']
        })
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
    assert.match(
      message,
      /awards\/a\.md: companyLogo \/logos\/missing\.png isn't in public\/ \(looked for public\/logos\/missing\.png\)/
    );
    assert.match(
      message,
      /awards\/b\.md: projectImage \/images\/missing\.jpg isn't in public\/ \(looked for public\/images\/missing\.jpg\)/
    );
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

// The Vite plugin is what turns a card edit into the page the visitor sees: it resolves
// virtual:cards, serialises loadCards for the build, and in preview/dev watches the cards
// folder so an add, change, or delete reloads the module.
describe('cards Vite plugin: virtual:cards', () => {
  it('names itself and resolves only virtual:cards', () => {
    const plugin = cardsPlugin();
    assert.equal(plugin.name, 'portfolio-cards');
    assert.equal(plugin.resolveId(VIRTUAL_ID), RESOLVED_ID);
    assert.equal(plugin.resolveId('virtual:other'), null);
    assert.equal(plugin.resolveId('./src/data/sections.js'), null);
  });

  it('loads cards from the root configResolved set, watches each file, and ignores other ids', () => {
    const root = fixture({
      cards: {
        'awards/a.md': card('title: Merit\ndate: May 2016\ncompanyLogo: /logos/ieee.png'),
        'judging/b.md': card('title: Reviewer\ndate: May 2017')
      },
      assets: ['logos/ieee.png', 'logos/trim/ieee.png']
    });
    const plugin = cardsPlugin();
    const watched = [];
    plugin.configResolved({ root });
    assert.equal(plugin.load.call({ addWatchFile: (f) => watched.push(f) }, 'other'), null);

    const source = plugin.load.call({ addWatchFile: (f) => watched.push(f) }, RESOLVED_ID);
    assert.match(source, /^export const cardsBySection = /);
    const cardsBySection = JSON.parse(source.slice('export const cardsBySection = '.length, -1));
    assert.deepEqual(
      cardsBySection.awards.map((c) => c.title),
      ['Merit']
    );
    assert.deepEqual(
      cardsBySection.judging.map((c) => c.title),
      ['Reviewer']
    );
    assert.equal(cardsBySection.awards[0].companyLogo, '/logos/ieee.png');
    assert.equal(cardsBySection.awards[0].description, 'What it was.');
    assert.deepEqual(
      watched.map((f) => path.relative(root, f)).sort(),
      [
        path.join('src/content/cards/awards/a.md'),
        path.join('src/content/cards/judging/b.md')
      ]
    );
  });

  it('reloads the page when a card under the watched folder changes, and ignores other paths', () => {
    const root = fixture({
      cards: { 'awards/a.md': card('title: Merit\ndate: May 2016') }
    });
    const plugin = cardsPlugin();
    plugin.configResolved({ root });

    const cardsDir = path.join(root, 'src/content/cards');
    const handlers = {};
    const watcherAdds = [];
    let invalidated = false;
    const sends = [];
    const mod = { id: RESOLVED_ID };
    const server = {
      watcher: {
        add: (dir) => watcherAdds.push(dir),
        on: (event, fn) => {
          handlers[event] = fn;
        }
      },
      moduleGraph: {
        getModuleById: (id) => (id === RESOLVED_ID ? mod : undefined),
        invalidateModule: (m) => {
          assert.equal(m, mod);
          invalidated = true;
        }
      },
      ws: { send: (msg) => sends.push(msg) }
    };

    plugin.configureServer(server);
    assert.deepEqual(watcherAdds, [cardsDir]);
    assert.deepEqual(Object.keys(handlers).sort(), ['add', 'change', 'unlink']);

    handlers.change(path.join(root, 'README.md'));
    assert.equal(invalidated, false);
    assert.deepEqual(sends, []);

    handlers.add(path.join(cardsDir, 'awards/new.md'));
    assert.equal(invalidated, true);
    assert.deepEqual(sends, [{ type: 'full-reload' }]);

    invalidated = false;
    sends.length = 0;
    handlers.unlink(path.join(cardsDir, 'awards/a.md'));
    assert.equal(invalidated, true);
    assert.deepEqual(sends, [{ type: 'full-reload' }]);
  });

  it('still sends a full reload when virtual:cards is not yet in the module graph', () => {
    const root = fixture({
      cards: { 'awards/a.md': card('title: Merit\ndate: May 2016') }
    });
    const plugin = cardsPlugin();
    plugin.configResolved({ root });
    const cardsDir = path.join(root, 'src/content/cards');
    const handlers = {};
    const sends = [];
    plugin.configureServer({
      watcher: {
        add: () => {},
        on: (event, fn) => {
          handlers[event] = fn;
        }
      },
      moduleGraph: {
        getModuleById: () => undefined,
        invalidateModule: () => {
          assert.fail('should not invalidate a missing module');
        }
      },
      ws: { send: (msg) => sends.push(msg) }
    });
    handlers.change(path.join(cardsDir, 'awards/a.md'));
    assert.deepEqual(sends, [{ type: 'full-reload' }]);
  });
});
