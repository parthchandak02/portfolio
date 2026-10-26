import './SelectedMark.css';

/**
 * Marks selected work: one of the scene's rounded grey squares, turned 45deg and made tiny. Like those,
 * it lights up white when the light finds it, here when its line is picked.
 */
const SelectedMark = ({ on = false, className = '' }) => (
  <span className={`selected-mark${on ? ' is-on' : ''} ${className}`} aria-hidden="true"><i /></span>
);

export default SelectedMark;
