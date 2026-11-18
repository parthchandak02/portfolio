// Guards the Lab projects entrypoints documented in AGENTS.md: lab.js stays the source list,
// Lab stills live under public/images/lab/, and the agent notes keep purpose, run, and test pointers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { labProjects } from '../src/data/lab.js';
import { SECTIONS } from '../src/data/sections.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const lab = path.join(root, 'src/data/lab.js');
const sections = path.join(root, 'src/data/sections.js');
const labImages = path.join(root, 'public/images/lab');
const showcase = path.join(root, 'src/components/LabShowcase.jsx');
const agents = path.join(root, 'AGENTS.md');

describe('Lab projects docs (AGENTS.md)', () => {
  it('keeps lab.js, LabShowcase, and the Lab images folder at the documented paths', () => {
    assert.equal(fs.existsSync(lab), true, 'src/data/lab.js missing');
    assert.equal(fs.existsSync(sections), true, 'src/data/sections.js missing');
    assert.equal(fs.existsSync(showcase), true, 'src/components/LabShowcase.jsx missing');
    assert.equal(fs.statSync(labImages).isDirectory(), true, 'public/images/lab missing');
  });

  it('documents the workflow in AGENTS.md', () => {
    const text = fs.readFileSync(agents, 'utf8');
    assert.match(text, /## Lab projects workflow/);
    assert.match(text, /src\/data\/lab\.js/);
    assert.match(text, /labProjects/);
    assert.match(text, /public\/images\/lab/);
    assert.match(text, /src\/data\/sections\.js/);
    assert.match(text, /LabShowcase\.jsx/);
    assert.match(text, /preview/);
  });

  it('keeps every Lab still on disk and every preview title in labProjects', () => {
    const titles = new Set(labProjects.map((p) => p.title));
    for (const project of labProjects) {
      assert.equal(project.category, 'lab', project.title);
      assert.ok(project.projectImage.startsWith('/images/lab/'), project.title);
      const file = path.join(root, 'public', project.projectImage.replace(/^\//, ''));
      assert.equal(fs.existsSync(file), true, `missing still for ${project.title}: ${file}`);
    }
    const labSection = SECTIONS.find((s) => s.id === 'lab');
    assert.ok(labSection, 'lab section missing from SECTIONS');
    for (const title of labSection.preview) {
      assert.ok(titles.has(title), `Lab preview names missing project "${title}"`);
    }
  });
});
