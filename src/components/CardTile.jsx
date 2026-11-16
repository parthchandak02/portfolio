import { Play } from 'lucide-react';
import { bandForSection } from '../data/spectrum';
import { tileFace } from './tileFace';
import './LabShowcase.css';
import './CardTile.css';

export { isTile, tileImageFor } from './tileFace';

/**
 * A card as a tile, in one of two styles that share one size and layout, both headed by the logo and who it's
 * from. A photo tile leads with its picture; an info tile leaves any picture a soft ghost behind, which gives
 * way once it opens, for the details show it. Cards with a picture get a photo tile unless they ask for `tile: 'info'`. Clicking opens the
 * details in a row under the tile (see TileGrid).
 */
const CardTile = ({ item, highlighted = false, open = false, onOpen }) => {
  const { image, photo, venue, meta, year, logo } = tileFace(item);
  // Photos rest frosted over, like the Lab's tiles, and come into focus on hover or when opened
  const veiled = photo;
  const band = bandForSection(item.category);

  return (
    <button
      type="button"
      className={`lab-tile ctile ${photo ? 'ctile--photo' : 'ctile--info'}${veiled ? ' ctile--veiled' : ''}${highlighted ? ' is-highlighted' : ''}${open ? ' is-open' : ''}`}
      style={band ? { '--hue': band.hue } : undefined}
      onClick={onOpen}
      aria-expanded={open}
      aria-label={`${item.title}, ${item.date}. ${open ? 'Close' : 'Show'} the details`}
    >
      {image && (
        <img className="ctile__img" src={image} alt="" loading="lazy" />
      )}
      <span className="ctile__top" aria-hidden="true">
        {logo && <img className="ctile__logo" src={logo} alt="" />}
        {venue && <span className="ctile__venue">{venue}</span>}
      </span>
      {item.video && photo && (
        <span className="ctile__play" aria-hidden="true">
          <Play size={12} fill="currentColor" />
        </span>
      )}
      {year && (
        <span
          className={`ctile__year${item.video && photo ? ' ctile__year--beside' : ''}`}
          aria-hidden="true"
        >
          {year}
        </span>
      )}
      <span className="ctile__text">
        <span className="ctile__name">{item.title}</span>
        {item.note && <span className="ctile__note">{item.note}</span>}
        {meta && <span className="ctile__meta">{meta}</span>}
      </span>
    </button>
  );
};

export default CardTile;
