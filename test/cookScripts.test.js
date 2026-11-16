// Guards the cook stills entrypoints documented in AGENTS.md: shoot and compare take a round label,
// default to COOK_PORT 8839, and stay callable as bash scripts from the repo root.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const shoot = path.join(root, 'cook/shoot.sh');
const compare = path.join(root, 'cook/compare.sh');
const agents = path.join(root, 'AGENTS.md');

describe('cook stills scripts (AGENTS.md)', () => {
  it('keeps shoot.sh and compare.sh at the documented paths', () => {
    assert.equal(fs.existsSync(shoot), true, 'cook/shoot.sh missing');
    assert.equal(fs.existsSync(compare), true, 'cook/compare.sh missing');
  });

  it('documents the workflow in AGENTS.md', () => {
    const text = fs.readFileSync(agents, 'utf8');
    assert.match(text, /cook\/shoot\.sh/);
    assert.match(text, /cook\/compare\.sh/);
    assert.match(text, /COOK_PORT/);
    assert.match(text, /8839/);
  });

  it('requires a round argument and defaults COOK_PORT to 8839', () => {
    const shootSrc = fs.readFileSync(shoot, 'utf8');
    const compareSrc = fs.readFileSync(compare, 'utf8');
    assert.match(shootSrc, /R=\$\{1:\?/);
    assert.match(compareSrc, /R=\$\{1:\?/);
    assert.match(shootSrc, /COOK_PORT:-8839/);
    assert.match(shootSrc, /cook\/stills\/\$R/);
    assert.match(compareSrc, /cook\/compare\/\$R/);
    assert.match(compareSrc, /cook\/stills\/\$R/);
  });
});
