import { Play } from 'lucide-react';
import { bandForSection } from '../data/spectrum';
import { layoutOf } from '../data/sections';
import './LabShowcase.css';
import './CardTile.css';

// The picture a card shows as a tile: its own image, else its video's still
export const tileImageFor = (item) => {
  if (item.projectImage) return item.projectImage;
  if (item.video) return `https://i.ytimg.com/vi/${item.video.id}/hqdefault.jpg`;
  return null;
};

// Each section's layout (src/data/sections.js) decides: a timeline of wide cards, or tiles
export const isTile = (item) => layoutOf(item.category) === 'tiles';

// Who it's from (the journal for a paper, else the organisation), and the line under the title
const venueOf = (item) => (item.volume ? item.volume.split(',')[0] : item.company) || '';
// The year a tile shows in its corner: when it ended, or Now
const yearOf = (item) => (/present/i.test(item.date) ? 'Now' : (item.date.match(/\d{4}/g) || []).pop() || '');
const metaOf = (item) => {
  const venue = venueOf(item);
  const rest = item.volume ? item.volume.split(',').slice(1).join(',').trim() : item.location;
  return [item.date, rest && rest !== venue ? rest : null].filter(Boolean).join(' · ');
};

/**
 * A card as a tile, in one of two styles that share one size and layout. A photo tile leads with its picture,
 * with the logo as a small chip; an info tile leads with the logo and who it's from, with any picture as a soft
 * ghost behind. Cards with a picture get a photo tile unless they ask for `tile: 'info'`. Clicking opens the
 * details in a row under the tile (see TileGrid).
 */
const CardTile = ({ item, highlighted = false, open = false, onOpen }) => {
  const image = tileImageFor(item);
  const photo = Boolean(image) && item.tile !== 'info';
  const venue = venueOf(item);
  const meta = metaOf(item);
  const year = yearOf(item);
  const band = bandForSection(item.category);
  const logo = typeof item.companyLogo === 'string' ? item.companyLogo : null;
  // Info tiles show the logo large, so they use the copy with its empty margins cut off (public/logos/trim)
  const bigLogo = logo && /^\/logos\/[^/]+\.png$/.test(logo) ? logo.replace('/logos/', '/logos/trim/') : logo;
  // Recognition's photos (press, talks, awards) rest frosted over, and come into focus on hover or when opened
  const veiled = photo && band?.key === 'recognition';

  return (
    <button
      type="button"
      className={`lab-tile ctile ${photo ? 'ctile--photo' : 'ctile--info'}${veiled ? ' ctile--veiled' : ''}${highlighted ? ' is-highlighted' : ''}${open ? ' is-open' : ''}`}
      style={band ? { '--hue': band.hue } : undefined}
      onClick={onOpen}
      aria-expanded={open}
      aria-label={`${item.title}, ${item.date}. ${open ? 'Close' : 'Show'} the details`}
    >
      {image && <img className="ctile__img" src={image} alt="" loading="lazy" />}
      {photo ? (
        <>
          {logo && <span className="ctile__chip" aria-hidden="true"><img src={logo} alt="" /></span>}
          {item.video && <span className="ctile__play" aria-hidden="true"><Play size={12} fill="currentColor" /></span>}
        </>
      ) : (
        <span className="ctile__top" aria-hidden="true">
          {logo && <img className="ctile__logo" src={bigLogo} alt="" />}
          {venue && <span className="ctile__venue">{venue}</span>}
        </span>
      )}
      {year && <span className={`ctile__year${item.video && photo ? ' ctile__year--beside' : ''}`} aria-hidden="true">{year}</span>}
      <span className="ctile__text">
        <span className="ctile__name">{item.title}</span>
        {meta && <span className="ctile__meta">{meta}</span>}
      </span>
    </button>
  );
};

export default CardTile;
