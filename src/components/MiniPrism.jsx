import './MiniPrism.css';

/**
 * A small glass prism drawn in CSS 3D: a three-sided pyramid, like the prism in the scene, slowly turning
 * so it reads as a solid rather than a triangle. It marks selected work.
 */
const MiniPrism = ({ hue = '#ff6b35', className = '' }) => (
  <span className={`mini-prism ${className}`} style={{ '--hue': hue }} aria-hidden="true">
    <span className="mini-prism__body">
      <i className="mini-prism__face" style={{ '--a': '0deg' }} />
      <i className="mini-prism__face mini-prism__face--glint" style={{ '--a': '120deg' }} />
      <i className="mini-prism__face" style={{ '--a': '240deg' }} />
      <i className="mini-prism__base" />
    </span>
  </span>
);

export default MiniPrism;
