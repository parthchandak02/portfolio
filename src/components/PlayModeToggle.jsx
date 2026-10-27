import { Rainbow, Glasses, Pyramid, FileUser, Bubbles, Droplet } from 'lucide-react';
import './PlayModeToggle.css';

// The playground's toy: the prism in dark mode, soap bubbles in light mode
const PlayModeToggle = ({ isPlayMode, onToggle, lightMode = false }) => {
  const play = lightMode ? 'Play with bubbles' : 'Play with prism';
  const [First, Second] = lightMode ? [Bubbles, Droplet] : [Pyramid, Rainbow];
  return (
    <button
      className={`play-mode-toggle glass glass-interactive ${isPlayMode ? 'play-mode' : ''}`}
      onClick={onToggle}
      aria-label={isPlayMode ? 'Back to the portfolio' : play}
    >
      <span className="play-mode-toggle__icon">
        {isPlayMode ? (
          <span className="play-mode-toggle__icon-container play-mode-toggle__icon-container--play-mode">
            <span className="play-mode-toggle__icon-primary">
              <Glasses size={18} />
            </span>
            <span className="play-mode-toggle__icon-secondary">
              <FileUser size={18} />
            </span>
          </span>
        ) : (
          <span className="play-mode-toggle__icon-container play-mode-toggle__icon-container--reading-mode">
            <span className="play-mode-toggle__icon-primary">
              <First size={18} />
            </span>
            <span className="play-mode-toggle__icon-secondary">
              <Second size={18} />
            </span>
          </span>
        )}
      </span>
      <span className="ui-hint" aria-hidden="true">{isPlayMode ? 'Back to the portfolio' : play}</span>
    </button>
  );
};

export default PlayModeToggle; 