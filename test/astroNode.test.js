// Cloudflare Pages installs the Node version named in `.node-version`, then runs `astro build`.
// Astro 7.4.2 raised engines.node to >=22.23.4 and the CLI exits on anything older, so a
// dependency bump that leaves the pin behind fails the Pages build before compilation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const versionParts = (value) =>
  value
    .trim()
    .replace(/^v/, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10));

const compareVersions = (left, right) => {
  const a = versionParts(left);
  const b = versionParts(right);
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

const minimumOf = (range) => {
  const match = String(range).match(/>=\s*v?(\d+\.\d+\.\d+)/);
  assert.ok(match, `expected a >=x.y.z engines range, got ${range}`);
  return match[1];
};

test('the Node pin Cloudflare Pages uses can run this astro', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const pinned = readFileSync(new URL('../.node-version', import.meta.url), 'utf8').trim();
  const locked = lock.packages['node_modules/astro'];

  assert.equal(pkg.dependencies.astro, '7.4.7');
  assert.equal(locked.version, pkg.dependencies.astro);
  assert.equal(lock.packages[''].dependencies.astro, pkg.dependencies.astro);

  const required = minimumOf(locked.engines.node);
  assert.ok(
    compareVersions(pinned, required) >= 0,
    `.node-version is ${pinned}, but astro ${locked.version} needs Node ${locked.engines.node}`
  );

  const declared = minimumOf(pkg.engines.node);
  assert.ok(
    compareVersions(declared, required) >= 0,
    `package.json engines.node is ${pkg.engines.node}, but astro needs ${locked.engines.node}`
  );
});
