// What a card shows as a tile (see CardTile). The picture, who it is from, the year in the
// corner, and the line under the title are decided here. docs/content.md describes the same rules.
import { layoutOf } from '../data/sections.js';

// The picture a card shows as a tile: its own image, else its video's still
export const tileImageFor = (item) => {
  if (item.projectImage) return item.projectImage;
  if (item.video)
    return `https://i.ytimg.com/vi/${item.video.id}/hqdefault.jpg`;
  return null;
};

// Each section's layout (src/data/sections.js) decides: a timeline of wide cards, or tiles
export const isTile = (item) => layoutOf(item.category) === 'tiles';

// Who it's from (the journal for a paper, else the organisation)
const venueOf = (item) =>
  (item.volume ? item.volume.split(',')[0] : item.company) || '';

// The year a tile shows in its corner: when it ended, or Now.
// Present must be its own word so "Representation" does not become Now.
const yearOf = (item) =>
  /\bpresent\b/i.test(item.date)
    ? 'Now'
    : (item.date.match(/\d{4}/g) || []).pop() || '';

// Logos that spell out the organisation's name, so the name isn't written again beside them
const WORDMARKS = [
  'springer-nature-logo.png',
  'ieee-logo.png',
  'sigma-xi-logo.png',
  'buildon-logo.png',
];

// The date and place under the title, leaving out a date that's only the year already in the corner
const metaOf = (item) => {
  const venue = venueOf(item);
  const rest = item.volume
    ? item.volume.split(',').slice(1).join(',').trim()
    : item.location;
  return [
    item.date.trim() === yearOf(item) ? null : item.date,
    rest && rest !== venue ? rest : null,
  ]
    .filter(Boolean)
    .join(' · ');
};

// Stock topic icons stand in for a venue without a logo of its own; a tile names the venue alone instead
const isTopic = (logo) => /\/topic-[^/]+$/.test(logo || '');

// The fields CardTile renders. A wordmark hides the organisation name. A topic icon is not shown as a logo.
export const tileFace = (item) => {
  const image = tileImageFor(item);
  const photo = Boolean(image) && item.tile !== 'info';
  const venue = venueOf(item);
  const logo =
    typeof item.companyLogo === 'string' && !isTopic(item.companyLogo)
      ? item.companyLogo
      : null;
  const wordmark = WORDMARKS.some((name) => logo?.endsWith(`/${name}`));
  return {
    image,
    photo,
    venue: venue && !wordmark ? venue : '',
    meta: metaOf(item),
    year: yearOf(item),
    logo:
      logo && /^\/logos\/[^/]+\.png$/.test(logo)
        ? logo.replace('/logos/', '/logos/trim/')
        : logo,
    play: Boolean(item.video && photo),
    note: item.note || '',
  };
};
