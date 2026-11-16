// How long a role lasted, and where its glass sits on a company card (see CompanyCard).
// A date with a month counts both ends, the way a tenure line does ("3 yrs 4 mos").
// Present means this month. A year with no month cannot be measured.

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

// "October 2018" -> months since year 0; "Present" -> now; anything without a month -> null
export const monthOf = (s = '') => {
  if (/present/i.test(s)) {
    const d = new Date();
    return d.getFullYear() * 12 + d.getMonth();
  }
  const m = s.trim().match(/^([a-z]{3})[a-z]*\.?\s+(\d{4})$/i);
  const i = m ? MONTHS.indexOf(m[1].toLowerCase()) : -1;
  return i < 0 ? null : Number(m[2]) * 12 + i;
};

const formatMonths = (n) => {
  const y = Math.floor(n / 12);
  const m = n % 12;
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`]
    .filter(Boolean)
    .join(' ');
};

// How long, LinkedIn-style ("3 yrs 4 mos"), counting both end months; only for dates with months
export const lengthOf = (from, to) => {
  const a = monthOf(from);
  const b = monthOf(to);
  if (a == null || b == null || b < a) return null;
  return formatMonths(b - a + 1);
};

export const ends = (date = '') => {
  const [a, b] = date.split(' - ');
  return [a, b || a];
};

// Earliest start and latest end. The timeline lists the newest start first, and that
// role may have finished while an earlier one kept going, so array position is not the span.
// A year with no month, or an end before its start, cannot be measured.
const spanOf = (roles) => {
  let start = Infinity;
  let stop = -Infinity;
  for (const role of roles) {
    const [a, b] = ends(role.item.date).map(monthOf);
    if (a == null || b == null || b < a) return null;
    if (a < start) start = a;
    if (b > stop) stop = b;
  }
  return start === Infinity ? null : { start, stop };
};

// A single date has no tenure line. A range does, when both ends name a month.
export const roleLength = (date = '') => {
  const [a, b] = ends(date);
  return date.includes(' - ') ? lengthOf(a, b) : null;
};

// One role has no company total. Several roles run from the earliest start to the latest end.
export const companyLength = (roles) => {
  if (roles.length < 2) return null;
  const span = spanOf(roles);
  if (!span) return null;
  return formatMonths(span.stop - span.start + 1);
};

// Where a role's glass sits across the company's years, as a share of the card.
// One role, or a date with no month, fills the card. A sliver stays at least 6% wide,
// and nothing starts past 94%, so a short recent role remains visible.
export const roleFill = (roles, date) => {
  const span = spanOf(roles);
  const [a, b] = ends(date).map(monthOf);
  if (
    roles.length === 1 ||
    a == null ||
    b == null ||
    !span ||
    !(span.stop > span.start)
  )
    return { left: '0%', width: '100%' };
  const months = span.stop - span.start + 1;
  const left = Math.min(94, ((a - span.start) / months) * 100);
  return {
    left: `${left}%`,
    width: `${Math.max(6, ((b - a + 1) / months) * 100)}%`,
  };
};
