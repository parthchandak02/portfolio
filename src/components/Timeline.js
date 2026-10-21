import { useMemo, useState } from 'react';
import TimelineCard from './TimelineCard';
import LabShowcase from './LabShowcase';
import CardTile, { tileImageFor } from './CardTile';
import { useTypewriterHighlight } from '../contexts/TypewriterHighlightContext';
import { categoryOrder } from '../data/timelineData';
import { bandForSection, spectrumBands, startOf, endOf } from '../data/spectrum';
import './Timeline.css';

const Timeline = ({ 
  data = [], 
  className = '',
  showFilters = false, // Now controlled by parent
  activeFilters = [], // Now receives array of active filters instead of single activeFilter
  lightMode = false,
  ...props 
}) => {
  const { getCurrentHighlights } = useTypewriterHighlight();
  const highlights = getCurrentHighlights();
  
  // Filter data based on active filters
  const filteredData = useMemo(() => {
    if (activeFilters.length === 0) {
      // No filters selected - show all data
      return data;
    }
    // Show items that match any of the active filters
    return data.filter(item => activeFilters.includes(item.category?.toLowerCase()));
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

  // Cards with a picture or a video show as glass tiles, a run of them sharing one grid. Text-only cards stay wide.
  const [openTile, setOpenTile] = useState(null);
  const segments = useMemo(() => {
    const out = [];
    sortedData.forEach((item, index) => {
      if (item.category === 'lab') {
        if (index === firstLabIndex) out.push({ kind: 'lab', index });
        return;
      }
      const prev = out[out.length - 1];
      if (tileImageFor(item)) {
        if (prev && prev.kind === 'tiles' && prev.category === item.category) prev.items.push({ item, index });
        else out.push({ kind: 'tiles', category: item.category, items: [{ item, index }] });
      } else {
        out.push({ kind: 'card', item, index });
      }
    });
    // A lone tile would look stranded, so a run of one stays a wide card
    return out.flatMap((s) => (s.kind === 'tiles' && s.items.length === 1 ? [{ kind: 'card', ...s.items[0] }] : [s]));
  }, [sortedData, firstLabIndex]);

  const itemAttrs = (item, index) => ({
    'data-category': item.category?.toLowerCase() || 'other',
    'data-title': item.title,
    'data-index': index,
    id: sortedData.findIndex((d) => d.category === item.category) === index ? item.category?.toLowerCase() : undefined
  });

  const renderCard = (item, extra = {}) => (
    <TimelineCard
      title={item.title}
      company={item.company}
      companyLogo={item.companyLogo}
      projectImage={item.projectImage}
      date={item.date}
      category={item.category}
      description={item.description}
      location={item.location}
      volume={item.volume}
      url={item.url}
      video={item.video}
      skills={item.skills || []}
      lightMode={lightMode}
      className="timeline__card"
      isTypewriterHighlighted={highlights.timelineCards.includes(item.title)}
      {...extra}
    />
  );

  return (
    <div className={`timeline ${lightMode ? 'timeline--light' : 'timeline--dark'} ${className}`} {...props}>
      
      {/* Timeline content */}
      <div className="timeline__content">
        {/* Timeline line */}
        <div className="timeline__line" />
        
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
                    <div className="lab__grid">
                      {segment.items.map(({ item, index }) => (
                        <div
                          key={item.title}
                          className={`timeline__item${openTile === item.title ? ' timeline__item--open' : ''}`}
                          {...itemAttrs(item, index)}
                        >
                          {openTile === item.title
                            ? renderCard(item, { defaultExpanded: true, onCollapse: () => setOpenTile(null) })
                            : (
                              <CardTile
                                item={item}
                                highlighted={highlights.timelineCards.includes(item.title)}
                                onOpen={() => setOpenTile(item.title)}
                              />
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              const { item, index } = segment;
              return (
                <div key={item.title} className="timeline__item" {...itemAttrs(item, index)}>
                  {renderCard(item)}
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