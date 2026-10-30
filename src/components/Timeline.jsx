import { useEffect, useMemo, useRef, useState } from 'react';
import CardDetail from './CardDetail';
import CompanyCard from './CompanyCard';
import LabShowcase from './LabShowcase';
import CardTile, { isTile } from './CardTile';
import TileGrid from './TileGrid';
import { useTypewriterHighlight } from '../contexts/TypewriterHighlightContext';
import { categoryOrder, timelineDataByCategory } from '../data/timelineData';
import { FEATURED } from '../data/featured';
import SelectedMark from './SelectedMark';
import { bandForSection, spectrumBands, startOf, endOf } from '../data/spectrum';
import { CLOSE_MS } from '../hooks/glassMotion';
import './Timeline.css';

const Timeline = ({ 
  data = [], 
  className = '',
  showFilters = false, // Now controlled by parent
  activeFilters = [], // Now receives array of active filters instead of single activeFilter
  lightMode = false,
  currentTitle = null, // the card whose line is lit on the band bar
  ...props 
}) => {
  const { getCurrentHighlights } = useTypewriterHighlight();
  const highlights = getCurrentHighlights();
  
  // Projects done inside a role (they name it as their parent) show in that role's card, not on their own
  const childrenOf = useMemo(() => {
    const out = {};
    data.forEach((item) => { if (item.parent) (out[item.parent] ||= []).push(item); });
    return out;
  }, [data]);

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    const own = data.filter((item) => !item.parent);
    if (activeFilters.length === 0) return own;
    // Show items that match any of the active filters
    return own.filter(item => activeFilters.includes(item.category?.toLowerCase()));
  }, [data, activeFilters]);
  
  // Cards follow the bands of the spectrograph (Career, Patent, Research, ...), so a band's cards sit together.
  // Inside a band, newest first by start date; ties put the longer or ongoing one first.
  const bandIndex = (item) => {
    const band = bandForSection(item.category?.toLowerCase());
    return band ? spectrumBands.indexOf(band) : spectrumBands.length;
  };
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (activeFilters.length === 0) {
        const byBand = bandIndex(a) - bandIndex(b);
        if (byBand) return byBand;
        const byCategory = categoryOrder.indexOf(a.category?.toLowerCase()) - categoryOrder.indexOf(b.category?.toLowerCase());
        if (a.category === 'lab' || b.category === 'lab') { if (byCategory) return byCategory; }
      }
      return startOf(b.date) - startOf(a.date) || endOf(b.date) - endOf(a.date);
    });
  }, [filteredData, activeFilters]);

  // The Lab renders as one card of tiles, in the place of its first item
  const labItems = sortedData.filter((item) => item.category === 'lab');
  const firstLabIndex = sortedData.findIndex((item) => item.category === 'lab');

  // Everything but jobs and degrees shows as glass tiles, a band's run of them sharing one grid
  // An opened tile stays as it is and its details open in a row under it (see TileGrid); Escape closes them.
  // Opening another while one is open first closes that one fully, then opens the next (nextTile waits meanwhile).
  const [openTile, setOpenTile] = useState(null);
  const [nextTile, setNextTile] = useState(null);
  const waiting = useRef(null);
  const closeTile = () => {
    clearTimeout(waiting.current);
    setNextTile(null);
    setOpenTile(null);
  };
  const openTileNext = (key) => {
    clearTimeout(waiting.current);
    if (openTile || nextTile) {
      setOpenTile(null);
      setNextTile(key);
      waiting.current = setTimeout(() => { setNextTile(null); setOpenTile(key); }, openTile ? CLOSE_MS + 80 : CLOSE_MS);
    } else {
      setOpenTile(key);
    }
  };
  useEffect(() => () => clearTimeout(waiting.current), []);
  useEffect(() => {
    if (!openTile) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeTile(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openTile]);
  const detailFor = (item) => () => <CardDetail item={item} subprojects={childrenOf[item.title]} tab />;
  const segments = useMemo(() => {
    const out = [];
    const seen = new Set();
    sortedData.forEach((item, index) => {
      if (item.category === 'lab') {
        if (index === firstLabIndex) out.push({ kind: 'lab', index });
        return;
      }
      // Jobs and degrees: every role at one organisation shares one card, placed where its newest role falls
      if (!isTile(item)) {
        const key = `${item.category}|${item.company || item.title}`;
        if (seen.has(key)) return;
        seen.add(key);
        const roles = sortedData
          .map((it, i) => ({ item: it, index: i }))
          .filter(({ item: it }) => !isTile(it) && `${it.category}|${it.company || it.title}` === key);
        out.push({ kind: 'company', key, roles });
        return;
      }
      const prev = out[out.length - 1];
      // Runs follow the bands, so a keynote sitting among press pieces joins their grid
      const band = bandIndex(item);
      if (prev && prev.kind === 'tiles' && prev.band === band) prev.items.push({ item, index });
      else out.push({ kind: 'tiles', band, items: [{ item, index }] });
    });
    return out;
  }, [sortedData, firstLabIndex]);

  // Selected work opens the portfolio: the cards marked with a diamond on the strip, as tiles
  const featured = useMemo(() => {
    const cards = Object.values(timelineDataByCategory).flat();
    return FEATURED.map((f) => {
      const card = cards.find((c) => c.title === f.title);
      return card && { item: card, tile: { ...card, title: f.name, date: f.kind } };
    }).filter(Boolean);
  }, []);

  const itemAttrs = (item, index) => ({
    style: { '--band-hue': bandForSection(item.category?.toLowerCase())?.hue || '#ff6b35' },
    'data-current': currentTitle === item.title ? 'true' : undefined,
    'data-category': item.category?.toLowerCase() || 'other',
    'data-title': item.title,
    'data-index': index,
    id: sortedData.findIndex((d) => d.category === item.category) === index ? item.category?.toLowerCase() : undefined
  });


  return (
    <div className={`timeline ${lightMode ? 'timeline--light' : 'timeline--dark'} ${className}`} {...props}>
      
      {/* Timeline content */}
      <div className="timeline__content">
        {/* Timeline line */}
        <div className="timeline__line" />
        
        {/* Selected work, ahead of the bands. Its tiles say data-category="selected", so jumps to a card
            land on the card in its band, not on its copy here. */}
        {featured.length > 0 && activeFilters.length === 0 && (
          <section className="timeline__selected" id="selected" aria-labelledby="selected-title">
            <h2 id="selected-title" className="timeline__selected-title">
              <SelectedMark on className="timeline__selected-mark" />
              Selected work
            </h2>
            <div className={`timeline__tiles lab ${lightMode ? 'lab--light' : 'lab--dark'}`}>
              <TileGrid
                openKey={openTile}
                holdKey={nextTile}
                onOpen={openTileNext}
                onClose={closeTile}
                entries={featured.map(({ item, tile }) => ({
                  key: `selected:${item.title}`,
                  attrs: {
                    style: { '--band-hue': bandForSection(item.category)?.hue || '#ff6b35' },
                    'data-current': currentTitle === item.title && !openTile ? 'true' : undefined,
                    'data-category': 'selected',
                    'data-title': item.title
                  },
                  tile: (toggle, open) => <CardTile item={tile} open={open} highlighted={highlights.timelineCards.includes(item.title)} onOpen={toggle} />,
                  detail: detailFor(item)
                }))}
              />
            </div>
          </section>
        )}

        {/* Timeline items */}
        <div className="timeline__items">
          {sortedData.length > 0 ? (
            segments.map((segment) => {
              if (segment.kind === 'lab') {
                return (
                  <div key="lab" className="timeline__item" data-category="lab" data-title="Lab" data-index={segment.index} id="lab">
                    <LabShowcase items={labItems} lightMode={lightMode} />
                  </div>
                );
              }
              if (segment.kind === 'tiles') {
                return (
                  <div key={`tiles-${segment.items[0].item.title}`} className={`timeline__tiles lab ${lightMode ? 'lab--light' : 'lab--dark'}`}>
                    <TileGrid
                      openKey={openTile}
                      holdKey={nextTile}
                      onOpen={openTileNext}
                      onClose={closeTile}
                      entries={segment.items.map(({ item, index }) => ({
                        key: item.title,
                        attrs: itemAttrs(item, index),
                        tile: (toggle, open) => (
                          <CardTile item={item} open={open} highlighted={highlights.timelineCards.includes(item.title)} onOpen={toggle} />
                        ),
                        detail: detailFor(item)
                      }))}
                    />
                  </div>
                );
              }
              const { roles } = segment;
              return (
                <div key={segment.key} className="timeline__company" style={{ '--band-hue': bandForSection(roles[0].item.category)?.hue }}>
                  <CompanyCard
                    lightMode={lightMode}
                    childrenOf={childrenOf}
                    roles={roles.map(({ item, index }) => ({
                      item,
                      attrs: itemAttrs(item, index),
                      highlighted: highlights.timelineCards.includes(item.title)
                    }))}
                  />
                </div>
              );
            })
          ) : (
            <div className="timeline__empty">
              <p>No items found for the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Timeline; 