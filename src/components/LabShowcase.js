import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import './LabShowcase.css';

const openLabel = (url) => (url.includes('github.com') ? 'View on GitHub' : 'Open live site');

/**
 * The Lab: one glass card holding tall portrait tiles. Each tile rests under frosted fog;
 * hovering (mouse), focusing (keyboard) or the first tap (touch) lifts the fog to show the
 * project, its description and a link. On touch, the second tap follows the link.
 */
const LabShowcase = ({ items = [], lightMode = false }) => {
  const [openId, setOpenId] = useState(null);

  // Tapping anywhere outside the open tile puts the fog back
  useEffect(() => {
    if (!openId) return undefined;
    const close = (e) => {
      if (!e.target.closest('.lab-tile.is-open')) setOpenId(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [openId]);

  const onTileClick = (e, id) => {
    const touchOnly = window.matchMedia('(hover: none)').matches;
    if (touchOnly && openId !== id) {
      e.preventDefault();
      setOpenId(id);
    }
  };

  return (
    <div className={`lab glass glass-strong ${lightMode ? 'lab--light' : 'lab--dark'}`}>
      <div className="lab__head">
        <h3 className="lab__title">Lab</h3>
        <p className="lab__caption">
          Things I build and ship.
          <span className="lab__hint lab__hint--mouse"> Hover a card to see it.</span>
          <span className="lab__hint lab__hint--touch"> Tap a card to see it.</span>
        </p>
      </div>

      <div className="lab__grid">
        {items.map((item) => (
          <a
            key={item.title}
            className={`lab-tile${openId === item.title ? ' is-open' : ''}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title}: ${item.description} ${openLabel(item.url)}`}
            onClick={(e) => onTileClick(e, item.title)}
          >
            <img className="lab-tile__img" src={item.projectImage} alt="" loading="lazy" />

            <span className="lab-tile__fog" aria-hidden="true">
              <span className="lab-tile__name">{item.title}</span>
              <span className="lab-tile__tag">{item.location}</span>
            </span>

            <span className="lab-tile__reveal" aria-hidden="true">
              <span className="lab-tile__name">{item.title}</span>
              <span className="lab-tile__desc">{item.description}</span>
              <span className="lab-tile__open">
                {openLabel(item.url)} <ArrowUpRight size={14} />
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default LabShowcase;
