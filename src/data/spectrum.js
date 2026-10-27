// Spectrograph data: one dated item per line, grouped into bands.
// `t` is a decimal year used only for placement; `when` is the label shown to visitors.
// Add `url` only when a public proof page exists. `sections` lists the timeline categories a band
// covers, and `card` (found automatically when the titles match) is the card a line jumps to.
import { timelineDataByCategory } from './timelineData';
import { FEATURED } from './featured';

export const SPECTRUM_START = 2015;
export const SPECTRUM_END = 2027;

const doi = (id) => `https://doi.org/${id}`;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// "February 2022 - Present" -> 2022.08; "2016 - 2018" -> 2016.5
const startOf = (date = '') => {
  const first = date.split(' - ')[0];
  const year = Number((first.match(/\d{4}/) || [])[0]);
  const month = MONTHS.indexOf(first.slice(0, 3).toLowerCase());
  return month === -1 ? year + 0.5 : year + month / 12;
};

// "February 2022 - Present" -> Infinity; "2016 - 2018" -> 2018.5; single dates end where they start
export const endOf = (date = '') => {
  if (/present/i.test(date)) return Infinity;
  const years = date.match(/\d{4}/g);
  return years ? Number(years[years.length - 1]) + 0.5 : 0;
};
export { startOf };

// One line per card, placed by the card's own start date
const fromCards = (categories) =>
  categories.flatMap((category) =>
    timelineDataByCategory[category]
      .filter((card) => card.date)
      .map((card) => ({
        t: startOf(card.date),
        when: card.date,
        title: card.title,
        meta: [card.company, card.location].filter(Boolean).join(', '),
        card: card.title,
        ...(card.url ? { url: card.url } : {})
      }))
  );

const careerItems = fromCards(['experience', 'education']);

// wave: where the band's colour sits in the prism's rainbow, in the shader's nanometres (measured on screen,
// since the colour grade shifts them), so picking an item lights that part
export const spectrumBands = [
  {
    key: 'career',
    name: 'Career',
    hue: '#e4dccf',
    // No wave: Career is the white beam itself, so it lights the whole rainbow
    sections: ['experience', 'education'],
    items: careerItems
  },
  {
    key: 'patent',
    sections: ['patent'],
    name: 'Patent',
    hue: '#ff5a52',
    wave: 685,
    items: [
      { t: 2024.49, when: 'Jun 2024', title: 'Audio prioritization, application filed', meta: 'Named inventor', url: 'https://patents.google.com/patent/US20260003563A1/en' },
      { t: 2026.0, when: 'Jan 2026', title: 'US20260003563A1, published application', meta: 'Named inventor', url: 'https://patents.google.com/patent/US20260003563A1/en' },
      { t: 2026.01, when: 'Jan 2026', title: 'WO2026005985A1, international publication', meta: 'Same patent family', url: 'https://patents.google.com/patent/WO2026005985A1/en' }
    ]
  },
  {
    key: 'research',
    sections: ['research'],
    name: 'Research',
    hue: '#ff9a3d',
    wave: 655,
    items: [
      { t: 2019.5, when: '2019', title: 'Growth and characterization of cadmium telluride', meta: 'IJFMR' },
      { t: 2020.5, when: '2020', title: 'Advancements in electric bicycle technology', meta: 'Zenodo' },
      { t: 2021.5, when: '2021', title: 'Advances in human-robot interaction', meta: 'IJIRMPS' },
      { t: 2021.9, when: '2021', title: 'Robotics-enabled STEM education in K-12', meta: 'IJSREM' },
      { t: 2022.3, when: '2022', title: 'User-centric IoT prototyping for smart agriculture', meta: 'IJIRMPS' },
      { t: 2022.7, when: '2022', title: 'Rapid prototyping for smart shop tools', meta: 'URF Journals' },
      { t: 2023.3, when: '2023', title: 'Rapid prototyping technologies and design frameworks', meta: 'JMSMR', url: doi('10.47363/JMSMR/2023(4)E115') },
      { t: 2023.54, when: 'Jul 2023', title: 'Leveraging haptic feedback in mixed reality', meta: 'JEAST', url: doi('10.47363/JEAST/2023(5)E170') },
      { t: 2023.8, when: '2023', title: 'Sensor fusion with user-centered design in robotics', meta: 'ISJEM' },
      { t: 2024.2, when: '2024', title: 'Evolution of haptic feedback systems and UX', meta: 'JEAST' },
      { t: 2024.4, when: '2024', title: 'Optimizing bio-inspired phototropic materials', meta: 'IJACT' },
      { t: 2024.6, when: 'Aug 2024', title: 'Advancing telemedicine through adaptive UX', meta: 'ProMedSci' },
      { t: 2024.62, when: 'Aug 2024', title: 'Healthcare IoT and rapid prototyping, systematic review', meta: 'ProMedSci' },
      { t: 2024.64, when: 'Aug 2024', title: 'User-centered design in rapid robotic prototyping', meta: 'IJIRMPS', url: doi('10.5281/zenodo.14280144') },
      { t: 2024.8, when: '2024', title: 'User-centered design in healthcare education technologies', meta: 'ProMedSci' },
      { t: 2025.2, when: '2025', title: 'Governance challenges in AI-powered health assistants', meta: 'IJFMR' },
      { t: 2025.5, when: '2025', title: 'Augmented reality enhances telemedicine training', meta: 'IJFMR' }
    ]
  },
  {
    key: 'judging',
    sections: ['judging'],
    name: 'Judging',
    hue: '#f2d34a',
    wave: 595,
    items: [
      { t: 2026.14, when: 'Feb 22, 2026', title: 'BMC Health Services Research', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.61, when: 'Aug 11, 2026', title: 'Discover Artificial Intelligence', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.64, when: 'Aug 23, 2026', title: 'Discover Education', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.65, when: 'Aug 23, 2026', title: 'Humanities and Social Sciences Communications', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.69, when: 'Sep 10, 2026', title: 'Discover Education, re-review', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.7, when: 'Sep 10, 2026', title: 'Discover Sustainability', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.72, when: 'Sep 18, 2026', title: 'Discover Oncology', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.76, when: 'Oct 6, 2026', title: 'Discover Applied Sciences', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.8, when: 'Oct 19, 2026', title: 'International Journal of Social Robotics', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.18, when: 'Mar 8, 2026', title: 'HackMerced XI', meta: 'Judge, MLH and UC Merced' },
      { t: 2026.32, when: 'Apr 26, 2026', title: 'LA Hacks 2026', meta: 'Invite-only judge, 1,000+ students' },
      { t: 2026.81, when: 'Oct 25, 2026', title: 'Cal Hacks 13.0', meta: 'Judge, about 2,000 hackers', url: 'https://www.linkedin.com/feed/update/urn:li:activity:7520588725832212480/' }
    ]
  },
  {
    key: 'impact',
    sections: ['impact'],
    name: 'Impact',
    hue: '#5fd38d',
    wave: 545,
    items: fromCards(['impact'])
  },
  {
    key: 'recognition',
    sections: ['awards', 'speaking', 'media'],
    name: 'Recognition',
    hue: '#4dd0e1',
    wave: 500,
    items: [
      { t: 2015.6, when: '2015', title: 'Robert W. Finch Memorial Scholarship', meta: 'Washington State University' },
      { t: 2015.7, when: '2015 - 2018', title: 'International Merit Award', meta: 'Washington State University' },
      { t: 2016.6, when: '2016', title: 'Guy E. Thornton Engineering Scholarship', meta: 'Washington State University' },
      { t: 2016.8, when: '2016 - 2018', title: 'Harold Frank Engineering Entrepreneurship Kauffman Award', meta: 'Washington State University' },
      { t: 2018.17, when: 'Mar 2018', title: 'Crimson Code Hackathon, 1st place', meta: 'Washington State University', url: 'https://tiny.cc/crimsoncode2018' },
      { t: 2025.45, when: 'Jun 2025', title: 'ICETAIA 2025, invited keynote', meta: 'A practical framework for rapid prototyping and fidelity' },
      ...fromCards(['media'])
    ]
  },
  {
    key: 'memberships',
    sections: ['memberships'],
    name: 'Memberships',
    hue: '#6a8cff',
    wave: 460,
    items: [
      { t: 2018.33, when: 'May 2018', title: 'Tau Beta Pi', meta: 'Engineering honor society' },
      { t: 2025.25, when: 'Apr 2025', title: 'QuillBot Product Advisory Panel', meta: 'Advisory panel member' },
      { t: 2026.09, when: 'Feb 2026', title: 'IEEE Senior Member', meta: 'Elevated membership grade' },
      { t: 2026.17, when: 'Mar 2026', title: 'Sigma Xi', meta: 'Scientific research honor society' }
    ]
  },
  {
    key: 'projects',
    sections: ['lab', 'projects'],
    name: 'Projects',
    hue: '#b07cff',
    wave: 430,
    items: [
      ...fromCards(['lab']),
      ...fromCards(['projects'])
    ]
  }
];

// Link each line to the card it describes, matching titles by shared words
const allCards = Object.values(timelineDataByCategory).flat();
const words = (text) => new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3));

const findCard = (title) => {
  const target = words(title);
  if (!target.size) return null;
  let best = null;
  let bestScore = 0;
  allCards.forEach((card) => {
    const candidate = words(card.title);
    let shared = 0;
    target.forEach((w) => { if (candidate.has(w)) shared += 1; });
    const score = shared / target.size;
    if (score > bestScore) { best = card; bestScore = score; }
  });
  return bestScore >= 0.75 ? best.title : null;
};

// Lines that describe a group (one patent family, nine peer reviews) point at that group's single card
const CARD_FOR_BAND = { patent: 'Audio Prioritization (US20260003563A1)' };
const CARD_OVERRIDES = {
  'ICETAIA 2025, invited keynote': 'A Practical Framework for Rapid Prototyping and Fidelity in Product Development'
};

spectrumBands.forEach((band) => {
  band.section = band.sections[0];
  band.items.forEach((item) => {
    if (!item.card && item.meta.startsWith('Peer reviewer')) item.card = 'Peer Reviewer, Springer Nature';
    if (!item.card) item.card = CARD_FOR_BAND[band.key] || CARD_OVERRIDES[item.title] || findCard(item.title);
  });
});

// Selected work wears its diamond on one line per card: the line that links where the card does
// (the patent's US publication, not its filing or its international copy), else the newest
FEATURED.forEach(({ title }) => {
  const card = allCards.find((c) => c.title === title);
  const lines = spectrumBands.flatMap((band) => band.items).filter((item) => item.card === title);
  const linked = (item) => Number(Boolean(card?.url) && item.url === card.url);
  const pick = [...lines].sort((a, b) => linked(b) - linked(a) || b.t - a.t)[0];
  if (pick) pick.featured = true;
});

// Selected work is not a band of the spectrum, but the bar shows it like one while you read it: its picks
// from across the bands, each in its own band's colour
export const selectedBand = {
  key: 'selected',
  name: 'Selected work',
  hue: '#ff6b35',
  sections: ['selected'],
  section: 'selected',
  items: FEATURED.map(({ title }) => {
    const band = spectrumBands.find((b) => b.items.some((item) => item.featured && item.card === title));
    const item = band && band.items.find((i) => i.featured && i.card === title);
    return item && { ...item, hue: band.hue };
  }).filter(Boolean)
};

export const bandForSection = (section) =>
  (section === 'selected' ? selectedBand : spectrumBands.find((band) => band.sections.includes(section)) || null);

export const spectrumTotal = spectrumBands.reduce((n, b) => n + b.items.length, 0);
