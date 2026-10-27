import { Lock, Unlock } from 'lucide-react';
import './LockToggle.css';

// Dark mode locks the beam; light mode, where bubbles take the prism's place, holds the bubbles still
const LockToggle = ({ isLocked, onToggle, lightMode = false }) => {
  const thing = lightMode ? 'bubbles' : 'beam';
  return (
    <button
      className={`lock-toggle glass glass-interactive ${isLocked ? 'locked' : ''}`}
      onClick={onToggle}
      aria-label={isLocked ? `Let the ${thing} follow you` : `Hold the ${thing} still`}
    >
      <span className="lock-toggle__icon">
        {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
      </span>
      <span className="ui-hint" aria-hidden="true">{isLocked ? `Let the ${thing} follow you` : `Hold the ${thing} still`}</span>
    </button>
  );
};

export default LockToggle; 