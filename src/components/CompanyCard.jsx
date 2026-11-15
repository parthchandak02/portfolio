import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CardDetail from './CardDetail';
import { companyLength, roleFill, roleLength } from './companySpan';
import Molten from './Molten';
import './CompanyCard.css';

/**
 * One organisation in the timeline, with its roles inside it, newest first, so a run of roles at one company
 * reads as one continuous stretch. Behind each role, the glass fills in for the part of the company's years it
 * covers; its dates come in on hover or once opened. Each role is its own .timeline__item (the strip,
 * the band bar and the typewriter find it by title) and opens to its details.
 *
 * roles: [{ item, attrs, highlighted }], newest first; childrenOf: projects done in a role, by its title
 */
const CompanyCard = ({ roles, childrenOf = {}, lightMode = false }) => {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (title) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });

  const first = roles[0].item;
  const logo = roles
    .map((r) => r.item.companyLogo)
    .find((l) => typeof l === 'string');
  const company = first.company;
  const place = first.location !== company ? first.location : null;
  const total = companyLength(roles);

  return (
    <div
      className={`company glass glass-strong ${lightMode ? 'company--light' : 'company--dark'}${roles.length > 1 ? ' company--many' : ''}`}
    >
      <header className="company__head">
        <div className="company__who">
          {company && <span className="company__name">{company}</span>}
          <span className="company__where">
            {[place, total].filter(Boolean).join(' · ')}
          </span>
        </div>
        {logo && (
          <img
            className="company__logo"
            src={logo}
            alt={company ? `${company} logo` : ''}
          />
        )}
      </header>

      <ol className="company__roles">
        {roles.map(({ item, attrs, highlighted }) => {
          const isOpen = open.has(item.title);
          const length = roleLength(item.date);
          const current = /present/i.test(item.date);
          return (
            <li
              key={item.title}
              {...attrs}
              className={`timeline__item company__role${isOpen ? ' is-open' : ''}${current ? ' is-current' : ''}${highlighted ? ' is-highlighted' : ''}`}
            >
              <button
                type="button"
                className="company__role-head"
                onClick={() => toggle(item.title)}
                aria-expanded={isOpen}
              >
                <span
                  className="company__fill"
                  style={roleFill(roles, item.date)}
                  aria-hidden="true"
                />
                <span className="company__role-text">
                  <span className="company__role-title">{item.title}</span>
                  <span className="company__role-date">
                    {[item.date.replace(' - ', ' – '), length]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <ChevronDown
                  className="company__chev"
                  size={18}
                  aria-hidden="true"
                />
              </button>
              <Molten open={isOpen} className="company__detail">
                <div className="company__detail-body">
                  <CardDetail
                    item={{
                      ...item,
                      location: item.location === place ? null : item.location,
                    }}
                    head={false}
                    subprojects={childrenOf[item.title]}
                  />
                </div>
              </Molten>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default CompanyCard;
