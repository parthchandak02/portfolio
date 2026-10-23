import { Maximize2, Play } from 'lucide-react';
import { bandForSection } from '../data/spectrum';
import './LabShowcase.css';

// The picture a card shows as a tile: its own image, else its video's still. Cards without one stay wide.
export const tileImageFor = (item) => {
  if (item.projectImage) return item.projectImage;
  if (item.video) return `https://i.ytimg.com/vi/${item.video.id}/hqdefault.jpg`;
  return null;
};

// Research papers have no pictures but still sit together as tiles, so the list reads as one body of work
const TEXT_TILE_CATEGORIES = new Set(['research']);
export const isTile = (item) => Boolean(tileImageFor(item)) || TEXT_TILE_CATEGORIES.has(item.category);

/**
 * A record card shown as a glass tile, like the Lab's. Hover or focus lifts the fog to show what it is;
 * clicking opens the full card in its place.
 */
const CardTile = ({ item, highlighted = false, onOpen }) => {
  const image = tileImageFor(item);
  const venue = item.volume ? item.volume.split(',')[0] : item.company;
  const band = bandForSection(item.category);

  return (
    <button
      type="button"
      className={`lab-tile lab-tile--card${image ? '' : ' lab-tile--text'}${highlighted ? ' is-highlighted' : ''}`}
      style={band ? { '--hue': band.hue } : undefined}
      onClick={onOpen}
      aria-label={`${item.title}, ${item.date}. Open the full card`}
    >
      {image && <img className="lab-tile__img" src={image} alt="" loading="lazy" />}
      {item.video && <span className="lab-tile__badge" aria-hidden="true"><Play size={12} fill="currentColor" /></span>}
      {!image && item.companyLogo && <img className="lab-tile__logo" src={item.companyLogo} alt="" aria-hidden="true" />}

      <span className="lab-tile__fog" aria-hidden="true">
        {!image && venue && <span className="lab-tile__venue">{venue}</span>}
        <span className="lab-tile__name">{item.title}</span>
        <span className="lab-tile__tag">{item.date}</span>
      </span>

      <span className="lab-tile__reveal" aria-hidden="true">
        <span className="lab-tile__name">{item.title}</span>
        <span className="lab-tile__desc">{item.description}</span>
        <span className="lab-tile__open">
          {item.video ? 'Watch' : 'Open'} <Maximize2 size={13} />
        </span>
      </span>
    </button>
  );
};

export default CardTile;
