import { useState } from 'react';
import { ExternalLink, FileText, MapPin, Calendar, Play } from 'lucide-react';
import { iconMap } from '../data/timelineData';
import './TimelineCard.css';

const TimelineCard = ({ 
  title,
  company,
  companyLogo,
  projectImage,
  date,
  category,
  description,
  location,
  volume,
  url, // New URL field for external links
  video, // Optional { id, title } for a click-to-load YouTube embed
  skills = [], // Skill/technology icons for this card
  isTypewriterHighlighted = false,
  lightMode = false,
  className = '',
  defaultExpanded = false, // Opened from a tile: starts open
  onCollapse, // Opened from a tile: collapsing turns it back into the tile
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [clickedIcons, setClickedIcons] = useState(new Set()); // Track clicked nav icons
  const [videoPlaying, setVideoPlaying] = useState(false); // Embed only loads after the visitor asks for it

  const handleHeaderClick = () => {
    if (isExpanded && onCollapse) { onCollapse(); return; }
    setIsExpanded((prev) => !prev);
  };

  // Handle navigation icon clicks for persistent orange state
  const handleIconClick = (iconName, event) => {
    event.stopPropagation(); // Prevent card expansion
    const newClickedIcons = new Set(clickedIcons);
    if (newClickedIcons.has(iconName)) {
      newClickedIcons.delete(iconName); // Toggle off if already clicked
    } else {
      newClickedIcons.add(iconName); // Toggle on
    }
    setClickedIcons(newClickedIcons);
  };
  
  // Generate category-specific class name
  const categoryClass = category ? `timeline-card--category-${category.toLowerCase()}` : '';
  
  return (
    <div 
      className={`timeline-card glass glass-strong glass-interactive ${isExpanded ? 'expanded' : 'collapsed'} ${lightMode ? 'timeline-card--light' : 'timeline-card--dark'} ${isTypewriterHighlighted ? 'timeline-card--typewriter-highlighted' : ''} ${categoryClass} ${className}`} 
      {...props}
    >
      {/* Content container */}
      <div className="timeline-card__content">
        {/* Header section - always visible */}
        <div 
          className="timeline-card__header"
          onClick={handleHeaderClick}
        >
          <div className="timeline-card__header-content">
            <h3 className="timeline-card__title">{title}</h3>
            {date && (
              <span className="timeline-card__date">
                <Calendar size={14} />
                {date}
              </span>
            )}
          </div>
          {/* Company logo - positioned to the left of toggle button */}
          {companyLogo && (
            <img 
              src={companyLogo} 
              alt={`${company || 'Company'} logo`}
              className="timeline-card__company-logo timeline-card__company-logo--header"
              onError={(e) => {
                e.target.style.display = 'none'; // Hide logo if it fails to load
              }}
            />
          )}
          <button className="timeline-card__toggle glass glass-interactive">
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor"
              className={`timeline-card__chevron ${isExpanded ? 'expanded' : ''}`}
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </button>
        </div>
        
        {/* Expandable content */}
        <div className={`timeline-card__expandable ${isExpanded ? 'expanded' : 'collapsed'}`}>
          {/* Meta information */}
          {(volume || location || url) && (
            <div className="timeline-card__meta">
              {location && (
                <span className="timeline-card__location">
                  <MapPin size={14} />
                  {location}
                </span>
              )}
              {volume && (
                <span className="timeline-card__volume">
                  <FileText size={14} />
                  {volume}
                </span>
              )}
              {url && (
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="timeline-card__url"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                  {url.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}
          
          {/* Project Image - positioned between meta and description */}
          {projectImage && (
            <div className="timeline-card__project-image-container">
              <img 
                src={projectImage} 
                alt={`${title} project`}
                className="timeline-card__project-image"
                onError={(e) => {
                  e.target.style.display = 'none'; // Hide image if it fails to load
                }}
              />
            </div>
          )}
          
          {/* Video - a thumbnail until clicked, so no third-party code loads up front */}
          {video && (
            <div className="timeline-card__video">
              {videoPlaying ? (
                <iframe
                  className="timeline-card__video-frame"
                  src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
                  title={video.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  className="timeline-card__video-button"
                  onClick={(e) => { e.stopPropagation(); setVideoPlaying(true); }}
                  aria-label={`Play video: ${video.title}`}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                    alt=""
                    className="timeline-card__video-thumb"
                    loading="lazy"
                  />
                  <span className="timeline-card__video-play"><Play size={22} fill="currentColor" /></span>
                </button>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="timeline-card__description">{description}</p>
          )}
          
                      {/* Skills/Technology Icons - at the bottom */}
          {skills && skills.length > 0 && (
            <div className="timeline-card__skills">
              {skills.map((iconData, index) => {
                // Support both old string format and new object format
                let IconComponent, iconName;
                
                if (typeof iconData === 'string') {
                  // Old string format - use iconMap for backwards compatibility
                  IconComponent = iconMap[iconData];
                  iconName = iconData;
                } else {
                  // New object format with component and name
                  IconComponent = iconData.component;
                  iconName = iconData.name;
                }
                
                const isClicked = clickedIcons.has(iconName);
                
                return IconComponent ? (
                  <div 
                    key={index}
                    className={`clean-pill ${lightMode ? 'clean-pill--light' : ''} ${isClicked ? 'clean-pill--active' : ''}`}
                    onClick={(e) => handleIconClick(iconName, e)}
                  >
                    <IconComponent size={16} />
                    <span>{iconName}</span>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineCard; 