import { useMemo, useState } from 'react';
import {
  spectrumBands,
  spectrumTotal,
  SPECTRUM_START,
  SPECTRUM_END
} from '../data/spectrum';
import './Spectrograph.css';

const AXIS_YEARS = [2015, 2018, 2021, 2024, 2027];
const pct = (t) => ((t - SPECTRUM_START) / (SPECTRUM_END - SPECTRUM_START)) * 100;

// Nudge neighbours apart so every line stays clickable on a dense strip.
// A forward pass spreads clusters right; a backward pass pulls the tail back inside the track.
const MAX_POS = 99.4;
const spread = (entries, gap) => {
  const sorted = [...entries].sort((a, b) => a.item.t - b.item.t);
  const pos = sorted.map((entry) => pct(entry.item.t));
  for (let i = 1; i < pos.length; i += 1) {
    if (pos[i] < pos[i - 1] + gap) pos[i] = pos[i - 1] + gap;
  }
  for (let i = pos.length - 1; i >= 0; i -= 1) {
    const limit = i === pos.length - 1 ? MAX_POS : pos[i + 1] - gap;
    if (pos[i] > limit) pos[i] = limit;
  }
  return sorted.map((entry, i) => ({ ...entry, p: pos[i] }));
};

const Axis = () => (
  <div className="spectro__axis" aria-hidden="true">
    {AXIS_YEARS.map((year) => (
      <span key={year} style={{ left: `${pct(year)}%` }}>{year}</span>
    ))}
  </div>
);

const Line = ({ entry, onActive, active }) => {
  const { item, band, p } = entry;
  const label = `${band.name}, ${item.when}, ${item.title}`;
  const className = `spectro__line${item.future ? ' spectro__line--future' : ''}${active ? ' spectro__line--on' : ''}`;
  const style = { left: `${p}%`, '--hue': band.hue };
  const handlers = {
    onMouseEnter: () => onActive(entry),
    onFocus: () => onActive(entry)
  };
  if (item.url) {
    return (
      <a
        className={className}
        style={style}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label}. Opens proof in a new tab`}
        {...handlers}
      />
    );
  }
  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={label}
      onClick={() => onActive(entry)}
      {...handlers}
    />
  );
};

/**
 * The prism splits one beam into a spectrum; this splits a record into seven bands.
 * Collapsed it is a single barcode strip, expanded it is one row per band.
 * Every count comes from src/data/spectrum.js, so lines and totals cannot disagree.
 */
const Spectrograph = ({ lightMode = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState(null);

  const all = useMemo(
    () => spectrumBands.flatMap((band) => band.items.map((item) => ({ item, band }))),
    []
  );
  const strip = useMemo(() => spread(all, 0.4), [all]);
  const rows = useMemo(
    () =>
      spectrumBands.map((band) => ({
        band,
        lines: spread(band.items.map((item) => ({ item, band })), 0.55)
      })),
    []
  );

  return (
    <section
      className={`spectro glass ${lightMode ? 'spectro--light' : 'spectro--dark'}`}
      aria-label="Record spectrograph"
    >
      <div className="spectro__head">
        <span className="spectro__count">
          <b>{spectrumTotal} dated items</b>, {SPECTRUM_START} to 2026
        </span>
        <button
          type="button"
          className="spectro__toggle"
          aria-expanded={expanded}
          aria-controls="spectro-body"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Collapse' : 'Split the beam'}
        </button>
      </div>

      <div id="spectro-body" className="spectro__body">
        {!expanded && (
          <>
            <div className="spectro__track spectro__track--strip">
              {strip.map((entry) => (
                <Line key={`${entry.band.key}-${entry.item.title}`} entry={entry} active={active === entry} onActive={setActive} />
              ))}
            </div>
            <Axis />
          </>
        )}

        {expanded && (
          <div className="spectro__bands">
            {rows.map(({ band, lines }) => (
              <div className="spectro__row" key={band.key} style={{ '--hue': band.hue }}>
                <a className="spectro__name" href={`#${band.section}`}>
                  <b>{band.name}</b>
                  <span>{band.sub}</span>
                </a>
                <div className="spectro__track">
                  {lines.map((entry) => (
                    <Line key={entry.item.title} entry={entry} active={active === entry} onActive={setActive} />
                  ))}
                </div>
              </div>
            ))}
            <Axis />
          </div>
        )}

        <div className="spectro__readout" style={{ '--hue': active ? active.band.hue : 'currentColor' }} aria-live="polite">
          {active ? (
            <>
              <span className="spectro__kicker">
                {active.band.name} · {active.item.when}
                {active.item.future ? ' · upcoming' : ''}
              </span>
              <span className="spectro__title">{active.item.title}</span>
              <span className="spectro__meta">
                {active.item.meta}
                {active.item.url ? ' · click the line to open the proof' : ''}
              </span>
            </>
          ) : (
            <span className="spectro__meta">Hover, focus or tap any line. Each one is a dated item from the record.</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default Spectrograph;
