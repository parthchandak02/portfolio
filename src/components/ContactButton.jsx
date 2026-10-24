import { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, FileText, Github, Linkedin, Mail, MessageCircle, X } from 'lucide-react';
import './ContactButton.css';

const LINKS = [
  { icon: Mail, label: 'Email', detail: 'parthchandak02@gmail.com', url: 'mailto:parthchandak02@gmail.com' },
  { icon: Linkedin, label: 'LinkedIn', detail: 'in/parthchandak02', url: 'https://linkedin.com/in/parthchandak02' },
  { icon: Github, label: 'GitHub', detail: 'parthchandak02', url: 'https://github.com/parthchandak02' },
  { icon: FileText, label: 'Resume', detail: 'One page, PDF', url: 'https://tiny.cc/parthchandakresume' },
  { icon: Calendar, label: 'Book a meeting', detail: 'Pick a time that suits you', url: 'https://tiny.cc/parthchandakbook' }
];

const FROST_MS = 1000; // a full open or close; reversing midway takes only the part already played
const SHARDS = 70;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const noise = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * One glass button in the bottom-right corner, always on screen. It opens the contact card the way frost
 * spreads on a window: the glass grows out of the button in a widening circle, with fine white shards
 * scattering off its edge. Closing draws it back in.
 */
const ContactButton = ({ lightMode = false }) => {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // the card stays in the page until it has fully closed
  const buttonRef = useRef(null);
  const cardRef = useRef(null);
  const progressRef = useRef(0); // 0 closed, 1 open
  const rafRef = useRef(0);
  const canvasRef = useRef(null);

  const frost = useCallback((to) => {
    const card = cardRef.current;
    const button = buttonRef.current;
    if (!card || !button) return;
    cancelAnimationFrame(rafRef.current);
    const done = () => {
      if (canvasRef.current) canvasRef.current.remove();
      canvasRef.current = null;
      card.style.clipPath = to ? 'none' : '';
      if (!to) setShown(false);
    };
    if (prefersReducedMotion()) { progressRef.current = to; done(); return; }

    const c = card.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    const F = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    const origin = `${F.x - c.left}px ${F.y - c.top}px`;
    const reach = Math.hypot(Math.max(F.x - c.left, c.right - F.x), Math.max(F.y - c.top, c.bottom - F.y)) + 10;
    const toward = Math.atan2(c.top + c.height / 2 - F.y, c.left + c.width / 2 - F.x);
    const shards = Array.from({ length: SHARDS }, (_, i) => ({ spread: noise(i, 1) - 0.5, phase: noise(i, 2), size: 2 + noise(i, 3) * 2.5, skew: noise(i, 4) }));

    // Shards are drawn on a canvas over the window, sized in px (100vh is taller than the window on phones)
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.className = 'contact-frost';
    canvas.setAttribute('aria-hidden', 'true');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
    if (!canvasRef.current) document.body.appendChild(canvas);
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ink = lightMode ? '150, 150, 162' : '255, 255, 255'; // white shards vanish on the light page, so a soft grey there

    const shard = (x, y, angle, s, skew, alpha) => {
      if (alpha <= 0.003) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;
      const g = ctx.createLinearGradient(-s, -s, s, s);
      g.addColorStop(0, `rgba(${ink}, 0.95)`);
      g.addColorStop(1, `rgba(${ink}, 0.15)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -s * (1 + skew * 0.4));
      ctx.lineTo(s * 0.85, s * 0.6);
      ctx.lineTo(-s * (0.5 + skew * 0.4), s * 0.75);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let last = performance.now();
    const frame = (now) => {
      const step = (now - last) / FROST_MS;
      last = now;
      const q = clamp01(progressRef.current + (to ? step : -step));
      progressRef.current = q;
      const R = easeInOut(clamp01(q / 0.9)) * reach;
      card.style.clipPath = `circle(${R}px at ${origin})`;

      ctx.clearRect(0, 0, vw, vh);
      ctx.globalCompositeOperation = lightMode ? 'source-over' : 'lighter';
      const fade = Math.sin(Math.PI * q);
      shards.forEach((s, i) => {
        const angle = toward + s.spread * 2.2;
        const life = (q * 3 + s.phase) % 1;
        const r = R + life * 26;
        const x = F.x + Math.cos(angle) * r;
        const y = F.y + Math.sin(angle) * r;
        if (x < c.left - 6 || x > c.right + 6 || y < c.top - 6 || y > c.bottom + 6) return;
        shard(x, y, angle + life * 4 + i, s.size, s.skew, (1 - life) * fade * 0.9);
      });
      // A faint bright line on the spreading edge
      ctx.save();
      ctx.beginPath();
      ctx.rect(c.left, c.top, c.width, c.height);
      ctx.clip();
      ctx.globalAlpha = 0.35 * fade;
      ctx.strokeStyle = lightMode ? 'rgba(0, 0, 0, 0.5)' : '#fff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(F.x, F.y, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if ((to && q < 1) || (!to && q > 0)) rafRef.current = requestAnimationFrame(frame);
      else done();
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [lightMode]);

  // Mount the card first (clipped to nothing), then frost it in once it can be measured
  useEffect(() => {
    if (open && shown) frost(true);
  }, [open, shown, frost]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      frost(false);
    } else {
      setShown(true);
      setOpen(true);
    }
  };

  // Escape or a tap anywhere else closes it
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); frost(false); buttonRef.current?.focus(); }
    };
    const onDown = (e) => {
      if (cardRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setOpen(false);
      frost(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, frost]);

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (canvasRef.current) canvasRef.current.remove();
  }, []);

  return (
    <div className={`contact ${lightMode ? 'contact--light' : 'contact--dark'}`}>
      {shown && (
        <div ref={cardRef} id="contact-card" className="contact__card" role="dialog" aria-label="Contact" style={{ clipPath: 'circle(0px at 100% 100%)' }}>
          <p className="contact__title">Get in touch</p>
          <p className="contact__sub">Parth Chandak, Senior Creative Technologist</p>
          <ul className="contact__links">
            {LINKS.map(({ icon: Icon, label, detail, url }) => (
              <li key={label}>
                <a href={url} {...(url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  <span className="contact__icon"><Icon size={16} strokeWidth={1.75} /></span>
                  <span className="contact__text"><b>{label}</b><small>{detail}</small></span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        className={`contact__button glass${open ? ' is-open' : ''}`}
        aria-label={open ? 'Close contact links' : 'Contact'}
        aria-expanded={open}
        aria-controls="contact-card"
        onClick={toggle}
      >
        <MessageCircle className="contact__glyph contact__glyph--chat" size={20} strokeWidth={1.75} />
        <X className="contact__glyph contact__glyph--close" size={20} strokeWidth={1.75} />
      </button>
    </div>
  );
};

export default ContactButton;
