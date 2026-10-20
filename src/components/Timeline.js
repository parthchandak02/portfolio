import { useMemo } from 'react';
import TimelineCard from './TimelineCard';
import LabShowcase from './LabShowcase';
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

  return (
    <div className={`timeline ${lightMode ? 'timeline--light' : 'timeline--dark'} ${className}`} {...props}>
      
      {/* Timeline content */}
      <div className="timeline__content">
        {/* Timeline line */}
        <div className="timeline__line" />
        
        {/* Timeline items */}
        <div className="timeline__items">
          {sortedData.length > 0 ? (
            sortedData.map((item, index) => {
              if (item.category === 'lab') {
                if (index !== firstLabIndex) return null;
                return (
                  <div key="lab" className="timeline__item" data-category="lab" data-title="Lab" data-index={index} id="lab">
                    <LabShowcase items={labItems} lightMode={lightMode} />
                  </div>
                );
              }

              return (
                <div 
                  key={item.title} 
                  className="timeline__item"
                  data-category={item.category?.toLowerCase() || 'other'}
                  data-title={item.title}
                  data-index={index}
                  data-debug={`${item.category}-${index}`}
                  id={sortedData.findIndex((d) => d.category === item.category) === index ? item.category?.toLowerCase() : undefined}
                >
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