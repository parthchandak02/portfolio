import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CardDetail from './CardDetail';
import './CompanyCard.css';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// "October 2018" -> months since year 0; "Present" -> now; anything without a month -> null
const monthOf = (s = '') => {
  if (/present/i.test(s)) { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); }
  const m = s.trim().match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})$/i);
  const i = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  return i < 0 ? null : Number(m[2]) * 12 + i;
};
// How long, LinkedIn-style ("3 yrs 4 mos"), counting both end months; only for dates with months
const lengthOf = (from, to) => {
  const a = monthOf(from); const b = monthOf(to);
  if (a == null || b == null || b < a) return null;
  const n = b - a + 1; const y = Math.floor(n / 12); const m = n % 12;
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ');
};
const ends = (date = '') => { const [a, b] = date.split(' - '); return [a, b || a]; };

/**
 * One organisation in the timeline, with each role held there on a line inside it, newest first, so a run of
 * roles at one company reads as one continuous stretch. Each role is its own .timeline__item (the strip,
 * the band bar and the typewriter find it by title) and opens to its details.
 *
 * roles: [{ item, attrs, highlighted }], newest first; childrenOf: projects done in a role, by its title
 */
const CompanyCard = ({ roles, childrenOf = {}, lightMode = false }) => {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (title) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(title)) next.delete(title); else next.add(title);
    return next;
  });

  const first = roles[0].item;
  const logo = roles.map((r) => r.item.companyLogo).find((l) => typeof l === 'string');
  const company = first.company;
  const place = first.location !== company ? first.location : null;
  const from = ends(roles[roles.length - 1].item.date)[0];
  const to = ends(first.date)[1];
  const span = roles.length > 1 ? `${from} – ${to}` : null;
  const total = roles.length > 1 ? lengthOf(from, to) : null;

  return (
    <div className={`company glass glass-strong ${lightMode ? 'company--light' : 'company--dark'}${roles.length > 1 ? ' company--many' : ''}`}>
      <header className="company__head">
        <div className="company__who">
          {company && <span className="company__name">{company}</span>}
          <span className="company__where">{[place, span, total].filter(Boolean).join(' · ')}</span>
        </div>
        {logo && <img className="company__logo" src={logo} alt={company ? `${company} logo` : ''} />}
      </header>

      <ol className="company__roles">
        {roles.map(({ item, attrs, highlighted }) => {
          const isOpen = open.has(item.title);
          const [a, b] = ends(item.date);
          const length = item.date.includes(' - ') ? lengthOf(a, b) : null;
          const current = /present/i.test(item.date);
          return (
            <li
              key={item.title}
              {...attrs}
              className={`timeline__item company__role${isOpen ? ' is-open' : ''}${current ? ' is-current' : ''}${highlighted ? ' is-highlighted' : ''}`}
            >
              <span className="company__node" aria-hidden="true" />
              <button type="button" className="company__role-head" onClick={() => toggle(item.title)} aria-expanded={isOpen}>
                <span className="company__role-text">
                  <span className="company__role-title">{item.title}</span>
                  <span className="company__role-date">{[item.date.replace(' - ', ' – '), length].filter(Boolean).join(' · ')}</span>
                </span>
                <ChevronDown className="company__chev" size={18} aria-hidden="true" />
              </button>
              <div className="company__detail" hidden={!isOpen}>
                {isOpen && <CardDetail item={{ ...item, location: item.location === place ? null : item.location }} head={false} subprojects={childrenOf[item.title]} />}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default CompanyCard;
