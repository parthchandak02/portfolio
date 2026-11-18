// Lab tile outbound labels (src/components/labLink.js): GitHub vs live site.
// LabShowcase uses these for every experiment tile. Run with `npm test`.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { isGitHub, openLabel } from '../src/components/labLink.js';
import { labProjects } from '../src/data/lab.js';

const showcase = readFileSync(
  fileURLToPath(new URL('../src/components/LabShowcase.jsx', import.meta.url)),
  'utf8'
);

test('GitHub hosts get the GitHub label; everything else opens as a live site', () => {
  assert.equal(isGitHub('https://github.com/parthchandak02/jobwright'), true);
  // Subdomains of github.com (www, gist, api, pages) count as GitHub too.
  assert.equal(isGitHub('https://www.github.com/parth/repo'), true);
  assert.equal(isGitHub('https://gist.github.com/parth/abc'), true);
  assert.equal(isGitHub('https://api.github.com'), true);
  assert.equal(isGitHub('https://foo.github.com/bar'), true);
  assert.equal(isGitHub('https://stellar.parthchandak.info'), false);
  assert.equal(isGitHub('https://github.enterprise.example/repo'), false);
  assert.equal(isGitHub('not a url'), false);
  assert.equal(isGitHub(''), false);

  assert.equal(
    openLabel('https://github.com/parthchandak02/jobwright'),
    'View on GitHub'
  );
  assert.equal(
    openLabel('https://stellar.parthchandak.info'),
    'Open live site'
  );
  assert.equal(openLabel('broken'), 'Open live site');
});

test('every shipped Lab project gets a label that matches its url host', () => {
  for (const project of labProjects) {
    const expected = isGitHub(project.url)
      ? 'View on GitHub'
      : 'Open live site';
    assert.equal(openLabel(project.url), expected, project.title);
    assert.ok(project.url, project.title);
    assert.doesNotThrow(() => new URL(project.url), project.title);
  }
});

test('LabShowcase still builds the open label from labLink', () => {
  assert.match(showcase, /from ['"]\.\/labLink['"]/);
  assert.match(showcase, /openLabel\(item\.url\)/);
});
