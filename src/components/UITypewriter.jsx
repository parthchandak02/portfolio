// React import removed - not needed with modern JSX transform
import { useRef, useEffect } from 'react';
import { ReactTyped } from 'react-typed';
import { useTypewriterHighlight } from '../contexts/TypewriterHighlightContext';
import './UITypewriter.css';

const UITypewriter = ({ lightMode }) => {
  const { updateCurrentPhrase, getTypewriterData, getFullSentences } = useTypewriterHighlight();
  const highlightTimerRef = useRef(null);
  const clearTimerRef = useRef(null);
  
  // Get professional titles and sentences from the centralized context
  const professionalTitles = getTypewriterData();
  const fullSentences = getFullSentences();

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  return (
    <div className="ui-typewriter-container">
      {/* Static introduction typewriter - appears once */}
      <div className={`ui-typewriter-static ${lightMode ? 'ui-typewriter--light' : 'ui-typewriter--dark'}`}>
        <ReactTyped
          strings={['Hi, my name is Parth Chandak']}
          typeSpeed={50}
          startDelay={500}
          showCursor={false}
          loop={false}
        />
      </div>
      
      {/* Cycling professional titles typewriter */}
      <div className={`ui-typewriter-cycling ${lightMode ? 'ui-typewriter--light' : 'ui-typewriter--dark'}`}>
        <ReactTyped
          strings={fullSentences.map(sentence => {
            // Find the corresponding data item to get prefix and title
            const dataItem = professionalTitles.find(item => sentence === `${item.prefix} ${item.title}`);
            if (dataItem) {
              return `<span class="prefix-part">${dataItem.prefix}</span> <span class="title-part">${dataItem.title}</span>`;
            }
            return sentence;
          })}
          typeSpeed={80}
          backSpeed={50}
          backDelay={2500}
          startDelay={3000} // Start after the static typewriter finishes
          loop={true}
          showCursor={true}
          smartBackspace={true}
          html={true} // Enable HTML parsing for spans
          onBegin={() => {
            // Clear highlighting when new typing begins (during deletion/new typing phase)
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
            updateCurrentPhrase('');
          }}
          onStringTyped={(arrayPos) => {
            // Clear any existing timers
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
            
            const titleOnly = professionalTitles[arrayPos].title;
            
            // Start highlighting after a brief delay (300ms) to ensure text is fully stable
            highlightTimerRef.current = setTimeout(() => {
              updateCurrentPhrase(titleOnly);
              
              // Clear highlighting 300ms before deletion starts (backDelay: 2500ms - 300ms = 2200ms)
              clearTimerRef.current = setTimeout(() => {
                updateCurrentPhrase('');
              }, 2200);
            }, 300);
          }}
          onDestroy={() => {
            // Clear all timers and highlighting when component unmounts
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
            updateCurrentPhrase('');
          }}
        />
      </div>
    </div>
  );
};

export default UITypewriter; 