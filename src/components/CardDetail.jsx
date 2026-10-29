import { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { iconMap } from '../data/timelineData';
import './CardDetail.css';

// A link shows as a short name for the common places (the strip's readout names them the same way), and
// otherwise as its address
const urlText = (url) => {
  if (/linkedin\.com\/(feed|posts)\//.test(url)) return 'LinkedIn post';
  if (/patents\.google\.com/.test(url)) return 'Google Patents';
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
  if (/photos\.app\.goo\.gl/.test(url)) return 'Photos';
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

const still = (video) => `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

// A picture that dissolves into the glass: its edges fade out, over a soft glow of its own colours. A video is
// its still with a play button until clicked, so no third-party code loads up front.
const Media = ({ item, compact = false }) => {
  const [playing, setPlaying] = useState(false);
  const src = item.projectImage || (item.video && still(item.video));
  if (!src) return null;
  if (playing) {
    return (
      <div className="cdetail__player">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${item.video.id}?autoplay=1&rel=0`}
          title={item.video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }
  const picture = (
    <>
      <img className="cdetail__glow" src={src} alt="" aria-hidden="true" loading="lazy" />
      <img className="cdetail__img" src={src} alt={item.video ? '' : item.title} loading="lazy" />
    </>
  );
  return item.video ? (
    <button
      type="button"
      className={`cdetail__media cdetail__media--video${compact ? ' cdetail__media--compact' : ''}`}
      onClick={(e) => { e.stopPropagation(); setPlaying(true); }}
      aria-label={`Play video: ${item.video.title}`}
    >
      {picture}
      <span className="cdetail__play"><Play size={compact ? 16 : 20} fill="currentColor" /></span>
    </button>
  ) : (
    <figure className={`cdetail__media${compact ? ' cdetail__media--compact' : ''}`}>{picture}</figure>
  );
};

// At most three tags, so the details stay quick to read (the rest still feed the greeting's typewriter)
const Tags = ({ skills }) => (
  <ul className="cdetail__tags">
    {skills.slice(0, 3).map((s) => {
      const name = typeof s === 'string' ? s : s.name;
      const Icon = typeof s === 'string' ? iconMap[s] : s.component;
      return <li key={name} className="cdetail__tag">{Icon && <Icon size={13} aria-hidden="true" />}{name}</li>;
    })}
  </ul>
);

/**
 * What a card says once opened, the same wherever it opens: under a tile (TileGrid) or under a role in a
 * company's card (CompanyCard). `head` adds the organisation and title, for places that don't already show them.
 */
const CardDetail = ({ item, subprojects = [], head = true }) => {
  const venue = item.volume ? item.volume.split(',')[0] : item.company;
  const volumeRest = item.volume ? item.volume.split(',').slice(1).join(',').trim() : null;
  const place = item.location && item.location !== venue ? item.location : null;
  const meta = [head ? item.date : null, place, volumeRest].filter(Boolean);
  const logo = typeof item.companyLogo === 'string' ? item.companyLogo : null;
  const media = Boolean(item.projectImage || item.video);

  return (
    <div className={`cdetail${media ? ' cdetail--media' : ''}`}>
      {media && <Media item={item} />}
      <div className="cdetail__text">
        {head && (venue || logo) && (
          <div className="cdetail__eyebrow">
            {logo && <img className="cdetail__logo" src={logo} alt="" aria-hidden="true" />}
            {venue && <span>{venue}</span>}
          </div>
        )}
        {head && <h3 className="cdetail__title">{item.title}</h3>}
        {meta.length > 0 && (
          <p className="cdetail__meta">{meta.map((m, i) => <span key={i}>{m}</span>)}</p>
        )}
        {item.description && <p className="cdetail__desc">{item.description}</p>}
        {item.url && (
          <a className="cdetail__link" href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            {urlText(item.url)} <ExternalLink size={13} aria-hidden="true" />
          </a>
        )}
        {item.skills?.length > 0 && <Tags skills={item.skills} />}
      </div>
      {subprojects.length > 0 && (
        <div className="cdetail__subs">
          {subprojects.map((sub) => (
            <div key={sub.title} className="cdetail__sub">
              <Media item={sub} compact />
              <div className="cdetail__sub-text">
                <span className="cdetail__sub-title">{sub.title}</span>
                <span className="cdetail__sub-date">{sub.date}</span>
                <p>{sub.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardDetail;
