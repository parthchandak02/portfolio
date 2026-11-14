// React import removed - not needed with modern JSX transform
import { useRef, useEffect } from 'react';
import { ReactTyped } from 'react-typed';
import { useTypewriterHighlight } from '../contexts/TypewriterHighlightContext';
import { timelineDataByCategory } from '../data/timelineData';
import './UITypewriter.css';

// The role held now, from its card, so this line stays current by itself
const now = timelineDataByCategory.experience.find((c) =>
  /present/i.test(c.date)
);
const currentRole = now && `${now.title} at ${now.company}`;

const UITypewriter = ({ lightMode }) => {
  const { updateCurrentPhrase, getTypewriterData, getFullSentences } =
    useTypewriterHighlight();
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
      {/* The name types itself in, large and bold; its full width is held from the start so nothing below moves */}
      <p
        className={`ui-typewriter-name ${lightMode ? 'ui-typewriter--light' : 'ui-typewriter--dark'}`}
      >
        <span className="ui-typewriter-name__hold" aria-hidden="true">
          Parth Chandak
        </span>
        <span className="ui-typewriter-name__typed">
          <ReactTyped
            strings={['Parth Chandak']}
            typeSpeed={70}
            startDelay={350}
            showCursor={false}
            loop={false}
          />
        </span>
      </p>

      {/* Who you are, at a glance: it settles in quietly as the greeting finishes */}
      {currentRole && (
        <p
          className={`ui-typewriter-role ${lightMode ? 'ui-typewriter--light' : 'ui-typewriter--dark'}`}
        >
          {currentRole}
        </p>
      )}

      {/* Cycling professional titles typewriter */}
      <div
        className={`ui-typewriter-cycling ${lightMode ? 'ui-typewriter--light' : 'ui-typewriter--dark'}`}
      >
        <ReactTyped
          strings={fullSentences.map((sentence) => {
            // Find the corresponding data item to get prefix and title
            const dataItem = professionalTitles.find(
              (item) => sentence === `${item.prefix} ${item.title}`
            );
            if (dataItem) {
              return `<span class="prefix-part">${dataItem.prefix}</span> <span class="title-part">${dataItem.title}</span>`;
            }
            return sentence;
          })}
          typeSpeed={80}
          backSpeed={50}
          backDelay={2500}
          startDelay={1900} // Start once the name has typed in
          loop={true}
          showCursor={true}
          smartBackspace={true}
          html={true} // Enable HTML parsing for spans
          onBegin={() => {
            // Clear highlighting when new typing begins (during deletion/new typing phase)
            if (highlightTimerRef.current)
              clearTimeout(highlightTimerRef.current);
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
            updateCurrentPhrase('');
          }}
          onStringTyped={(arrayPos) => {
            // Clear any existing timers
            if (highlightTimerRef.current)
              clearTimeout(highlightTimerRef.current);
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
            if (highlightTimerRef.current)
              clearTimeout(highlightTimerRef.current);
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
            updateCurrentPhrase('');
          }}
        />
      </div>
    </div>
  );
};

export default UITypewriter;
