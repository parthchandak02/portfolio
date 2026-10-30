import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { glassSound, isMuted, setMuted } from '../hooks/glassSound';
import './SoundToggle.css';

// Turns the cards' glass sounds on and off. It sits over the contact button rather than with the buttons at the
// top, which step aside once reading starts, because the sounds come with reading. Turning them on plays one.
const SoundToggle = ({ away = false }) => {
  const [muted, setState] = useState(isMuted);
  const label = muted ? 'Turn the sounds on' : 'Mute the sounds';
  const flip = () => {
    setMuted(!muted);
    setState(!muted);
    if (muted) glassSound('switch');
  };
  return (
    <button
      type="button"
      className={`sound-toggle glass glass-interactive${muted ? ' is-muted' : ''}${away ? ' is-away' : ''}`}
      onClick={flip}
      aria-label={label}
      aria-pressed={muted}
      inert={away}
    >
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      <span className="ui-hint" aria-hidden="true">{label}</span>
    </button>
  );
};

export default SoundToggle;
