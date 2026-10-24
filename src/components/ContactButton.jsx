import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'motion';
import { Calendar, FileText, Github, Linkedin, Mail, MessageCircle, X } from 'lucide-react';
import { glowPrism } from '../hooks/prismGlow';
import './ContactButton.css';

const LINKS = [
  { icon: Mail, label: 'Email', url: 'mailto:parthchandak02@gmail.com' },
  { icon: Linkedin, label: 'LinkedIn', url: 'https://linkedin.com/in/parthchandak02' },
  { icon: Github, label: 'GitHub', url: 'https://github.com/parthchandak02' },
  { icon: FileText, label: 'Resume', url: 'https://tiny.cc/parthchandakresume' },
  { icon: Calendar, label: 'Book a meeting', url: 'https://tiny.cc/parthchandakbook' }
];

const CARD_W = 240; // px, or the window less its gutters on narrow phones
const GUTTER = 16;
const RADIUS = 20; // the open card's corners; closed, the corners are half the button so it is a circle
const OPEN = { type: 'spring', bounce: 0.2, visualDuration: 0.5 };
const CLOSE = { type: 'spring', bounce: 0.08, visualDuration: 0.36 };

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * One glass button in the bottom-right corner, always on screen. Opening it does not bring in a second
 * panel: the button's own glass grows into the card on a spring, like a phone's Dynamic Island, and the
 * links settle in one after another. Closing springs the same glass back into the circle.
 */
const ContactButton = ({ lightMode = false }) => {
  const [open, setOpen] = useState(false);
  const shellRef = useRef(null);
  const cardRef = useRef(null);
  const buttonRef = useRef(null);
  const runningRef = useRef([]);

  const morph = useCallback((to) => {
    const shell = shellRef.current;
    const card = cardRef.current;
    const button = buttonRef.current;
    if (!shell || !card || !button) return;
    runningRef.current.forEach((c) => c.stop());
    runningRef.current = [];

    const size = button.offsetWidth; // 48, or 44 on phones
    const w = Math.min(CARD_W, window.innerWidth - GUTTER * 2);
    card.style.width = `${w - 2}px`; // inside the glass's 1px border
    const target = to
      ? { width: w, height: card.offsetHeight + 2, borderRadius: RADIUS }
      : { width: size, height: size, borderRadius: size / 2 };
    const items = card.querySelectorAll('.contact__title, .contact__links li');

    if (prefersReducedMotion()) {
      Object.assign(shell.style, { width: `${target.width}px`, height: `${target.height}px`, borderRadius: `${target.borderRadius}px` });
      items.forEach((el) => { el.style.opacity = to ? 1 : 0; });
      if (!to) Object.assign(shell.style, { width: '', height: '', borderRadius: '' });
      return;
    }

    if (to) {
      runningRef.current.push(
        animate(shell, target, OPEN),
        animate(items, { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.045, { startDelay: 0.12 }), type: 'spring', bounce: 0.15, visualDuration: 0.4 })
      );
    } else {
      // The glass closes over the links as they fade, the open played backwards
      const shrink = animate(shell, target, CLOSE);
      runningRef.current.push(animate(items, { opacity: 0, y: 6 }, { duration: 0.18 }), shrink);
      // Back to the stylesheet's size once closed, so the button follows the layout again
      shrink.then(() => {
        if (shellRef.current?.classList.contains('is-open')) return;
        Object.assign(shell.style, { width: '', height: '', borderRadius: '' });
      });
    }
  }, []);

  const set = useCallback((to) => {
    setOpen(to);
    morph(to);
    if (to) glowPrism();
  }, [morph]);

  // Escape or a tap anywhere else closes it; a resize while open re-fits the card
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { set(false); buttonRef.current?.focus(); }
    };
    const onDown = (e) => {
      if (!shellRef.current?.contains(e.target)) set(false);
    };
    const onResize = () => morph(true);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open, set, morph]);

  useEffect(() => () => runningRef.current.forEach((c) => c.stop()), []);

  return (
    <div className={`contact ${lightMode ? 'contact--light' : 'contact--dark'}`}>
      <div ref={shellRef} className={`contact__shell${open ? ' is-open' : ''}`}>
        <div ref={cardRef} id="contact-card" className="contact__card" role="dialog" aria-label="Contact" aria-hidden={!open} inert={!open}>
          <ul className="contact__links">
            {LINKS.map(({ icon: Icon, label, url }) => (
              <li key={label}>
                <a href={url} {...(url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  <span className="contact__icon"><Icon size={16} strokeWidth={1.75} /></span>
                  <span className="contact__text">{label}</span>
                </a>
              </li>
            ))}
          </ul>
          {/* The title shares the bottom row with the button, which stays in its corner as the close control */}
          <p className="contact__title">Get in touch</p>
        </div>
        <button
          ref={buttonRef}
          type="button"
          className="contact__button"
          aria-label={open ? 'Close contact links' : 'Contact'}
          aria-expanded={open}
          aria-controls="contact-card"
          onClick={() => set(!open)}
        >
          <MessageCircle className="contact__glyph contact__glyph--chat" size={20} strokeWidth={1.75} />
          <X className="contact__glyph contact__glyph--close" size={20} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};

export default ContactButton;
