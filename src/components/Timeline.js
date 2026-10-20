import { useMemo } from 'react';
import TimelineCard from './TimelineCard';
import LabShowcase from './LabShowcase';
import { useTypewriterHighlight } from '../contexts/TypewriterHighlightContext';
import { categoryOrder } from '../data/timelineData';
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
  
  // Sort data by category first (when no filters active), then by date within each category
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (activeFilters.length === 0) {
        // Use imported category order for sorting when showing all
        const aCategoryIndex = categoryOrder.indexOf(a.category?.toLowerCase() || '');
        const bCategoryIndex = categoryOrder.indexOf(b.category?.toLowerCase() || '');
        
        // If categories are different, sort by category order
        if (aCategoryIndex !== bCategoryIndex) {
          return aCategoryIndex - bCategoryIndex;
        }
      }
      
      // Within same category (or when filters are active), sort by date (newest first)
      const dateA = new Date(a.date || '1900-01-01');
      const dateB = new Date(b.date || '1900-01-01');
      return dateB - dateA;
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
                  <div key="lab" className="timeline__item" data-category="lab" data-index={index} id="lab">
                    <LabShowcase items={labItems} lightMode={lightMode} />
                  </div>
                );
              }

              return (
                <div 
                  key={item.title} 
                  className="timeline__item"
                  data-category={item.category?.toLowerCase() || 'other'}
                  data-index={index}
                  data-debug={`${item.category}-${index}`}
                  id={index === 0 || sortedData[index - 1].category !== item.category ? item.category?.toLowerCase() : undefined}
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