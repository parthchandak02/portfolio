// What a visitor reads on a tile. CardTile renders tileFace. Run with `npm test`.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadCards } from '../scripts/cards.mjs';
import { isTile, tileFace } from '../src/components/tileFace.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const all = Object.values(loadCards(root).bySection).flat();
const card = (title) => {
  const found = all.find((item) => item.title === title);
  assert.ok(found, title);
  return found;
};

const shows = (title, fields) => {
  const face = tileFace(card(title));
  for (const [key, value] of Object.entries(fields)) {
    assert.equal(face[key], value, `${title} ${key}`);
  }
};

test('a tile names the journal or organisation, the year, and the line under the title', () => {
  shows('Augmented Reality Enhances Telemedicine Training', {
    venue: 'IJFMR', meta: 'Volume 7, Issue 3', year: '2025', logo: null, photo: false,
  });
  shows('Rapid Prototyping Methodologies for Smart Shop Tools', {
    venue: 'URF Journals', meta: '', year: '2022', logo: null,
  });
  shows('IEEE Senior Member', {
    venue: '', meta: 'February 2026', year: '2026', logo: '/logos/trim/ieee-logo.png',
  });
  shows('Peer Reviewer, Springer Nature', {
    venue: '',
    logo: '/logos/trim/springer-nature-logo.png',
    note: '9 reviews across 8 journals',
    meta: 'February 2026 - October 2026 · 8 journals',
  });
  shows('Sigma Xi, The Scientific Research Honor Society', { venue: '' });
  shows('BuildOn Nepal School Project - $55K Fundraising Lead', {
    image: '/images/buildon-nepal-trek.png', photo: true, venue: '',
    meta: 'January 2025 · Nepal', year: '2025', logo: '/logos/trim/buildon-logo.png',
  });
  shows('Team Leader and Manager, Team Innovation Program', {
    venue: 'Mentor Discover Inspire', meta: 'May 2025 - Present', year: 'Now',
    logo: '/logos/trim/mdi-logo.png',
  });
  shows('Crimson Code Software Hackathon - 1st Place (Tier 1)', {
    image: '/images/crimson-code-2018-caffeine-cycle.png', photo: false, play: false,
    venue: 'WSU', meta: 'March 2018 · Pullman, WA', year: '2018',
  });
  shows('Bachelor of Science: Mechanical Engineering', {
    venue: 'GPA: 3.7/4.0',
    meta: 'May 2018 · Minors: Computer Science, Mathematics',
  });
});

test('a video still, the card photo, and a logo that is not a trimmed file', () => {
  const video = tileFace({
    date: 'May 2026', company: 'Zoox', video: { id: 'abc123', title: 'Talk' },
  });
  assert.equal(video.image, 'https://i.ytimg.com/vi/abc123/hqdefault.jpg');
  assert.equal(video.photo && video.play, true);
  const photo = tileFace({
    date: 'May 2026',
    projectImage: '/images/zoox-main.png',
    video: { id: 'abc123', title: 'Talk' },
  });
  assert.equal(photo.image, '/images/zoox-main.png');
  assert.equal(photo.play, true);
  assert.equal(tileFace({ date: '2024', companyLogo: '/images/custom.png' }).logo, '/images/custom.png');
  assert.equal(tileFace({ date: '2024', companyLogo: 12 }).logo, null);
  assert.equal(tileFace({ date: 'May 2026', company: 'Zoox', location: 'Zoox' }).meta, 'May 2026');
});

test('jobs and degrees stay wide cards, and every shipped tile follows the rules', () => {
  assert.equal(isTile(card('Creative Technologist')), false);
  assert.equal(isTile(card('Bachelor of Science: Mechanical Engineering')), false);
  assert.equal(isTile(card('Augmented Reality Enhances Telemedicine Training')), true);
  const wordmark = /\/(springer-nature|ieee|sigma-xi|buildon)-logo\.png$/;
  for (const item of all.filter(isTile)) {
    const face = tileFace(item);
    const year = /present/i.test(item.date) ? 'Now' : (item.date.match(/\d{4}/g) || []).pop() || '';
    assert.equal(face.year, year, item.title);
    if (item.date.trim() === year) assert.equal(face.meta.includes(item.date), false, item.title);
    else assert.ok(face.meta.startsWith(item.date), item.title);
    if (/\/topic-[^/]+$/.test(item.companyLogo || '')) assert.equal(face.logo, null, item.title);
    else if (/^\/logos\/[^/]+\.png$/.test(item.companyLogo || '')) {
      assert.equal(face.logo, item.companyLogo.replace('/logos/', '/logos/trim/'), item.title);
    }
    if (wordmark.test(item.companyLogo || '')) assert.equal(face.venue, '', item.title);
    assert.equal(face.photo, Boolean(face.image) && item.tile !== 'info', item.title);
    assert.equal(face.play, Boolean(item.video) && face.photo, item.title);
  }
});
