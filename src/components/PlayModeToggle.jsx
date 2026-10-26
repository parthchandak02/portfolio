import { Rainbow, Glasses, Pyramid, FileUser } from 'lucide-react';
import './PlayModeToggle.css';

const PlayModeToggle = ({ isPlayMode, onToggle }) => {
  return (
    <button
      className={`play-mode-toggle glass glass-interactive ${isPlayMode ? 'play-mode' : ''}`}
      onClick={onToggle}
      aria-label={isPlayMode ? 'Back to the portfolio' : 'Play with prism'}
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
              <Pyramid size={18} />
            </span>
            <span className="play-mode-toggle__icon-secondary">
              <Rainbow size={18} />
            </span>
          </span>
        )}
      </span>
      <span className="ui-hint" aria-hidden="true">{isPlayMode ? 'Back to the portfolio' : 'Play with prism'}</span>
    </button>
  );
};

export default PlayModeToggle; 