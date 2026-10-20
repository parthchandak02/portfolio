// Spectrograph data: one dated item per line, grouped into bands.
// `t` is a decimal year used only for placement; `when` is the label shown to visitors.
// Add `url` only when a public proof page exists. `sections` lists the timeline categories a band
// covers, and `card` (found automatically when the titles match) is the card a line jumps to.
import { timelineDataByCategory } from './timelineData';

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

const careerItems = fromCards(['experience', 'education', 'volunteering']);

export const spectrumBands = [
  {
    key: 'career',
    name: 'Career',
    sub: 'roles and study',
    hue: '#e4dccf',
    sections: ['experience', 'education', 'volunteering'],
    items: careerItems
  },
  {
    key: 'invent',
    sections: ['patent'],
    name: 'Invent',
    sub: 'patent',
    hue: '#ff5a52',
    items: [
      { t: 2024.49, when: 'Jun 2024', title: 'Audio prioritization, application filed', meta: 'Named inventor', url: 'https://patents.google.com/patent/US20260003563A1/en' },
      { t: 2026.0, when: 'Jan 2026', title: 'US20260003563A1, published application', meta: 'Named inventor', url: 'https://patents.google.com/patent/US20260003563A1/en' },
      { t: 2026.01, when: 'Jan 2026', title: 'WO2026005985A1, international publication', meta: 'Same patent family', url: 'https://patents.google.com/patent/WO2026005985A1/en' }
    ]
  },
  {
    key: 'publish',
    sections: ['research'],
    name: 'Publish',
    sub: 'journal papers',
    hue: '#ff9a3d',
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
    key: 'review',
    sections: ['review'],
    name: 'Review',
    sub: 'peer review',
    hue: '#f2d34a',
    items: [
      { t: 2026.14, when: 'Feb 22, 2026', title: 'BMC Health Services Research', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.61, when: 'Aug 11, 2026', title: 'Discover Artificial Intelligence', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.64, when: 'Aug 23, 2026', title: 'Discover Education', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.65, when: 'Aug 23, 2026', title: 'Humanities and Social Sciences Communications', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.69, when: 'Sep 10, 2026', title: 'Discover Education, re-review', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.7, when: 'Sep 10, 2026', title: 'Discover Sustainability', meta: 'Peer reviewer, Springer Nature' },
      { t: 2026.72, when: 'Sep 18, 2026', title: 'Discover Oncology', meta: 'Peer reviewer, Springer Nature' }
    ]
  },
  {
    key: 'judge',
    sections: ['judging'],
    name: 'Judge',
    sub: 'hackathons',
    hue: '#62d98a',
    items: [
      { t: 2026.18, when: 'Mar 8, 2026', title: 'HackMerced XI', meta: 'Judge, MLH and UC Merced' },
      { t: 2026.32, when: 'Apr 26, 2026', title: 'LA Hacks 2026', meta: 'Invite-only judge, 1,000+ students' },
      { t: 2026.81, when: 'Oct 23-25, 2026', title: 'Cal Hacks 13.0', meta: 'Accepted to judge, upcoming', future: true }
    ]
  },
  {
    key: 'honor',
    sections: ['awards', 'speaking', 'media'],
    name: 'Recognized',
    sub: 'awards, talks and press',
    hue: '#4dd0e1',
    items: [
      { t: 2015.6, when: '2015', title: 'Robert W. Finch Memorial Scholarship', meta: 'Washington State University' },
      { t: 2015.7, when: '2015-2018', title: 'International Merit Award', meta: 'Washington State University' },
      { t: 2016.6, when: '2016', title: 'Guy E. Thornton Engineering Scholarship', meta: 'Washington State University' },
      { t: 2016.8, when: '2016-2018', title: 'Harold Frank Engineering Entrepreneurship Kauffman Award', meta: 'Washington State University' },
      { t: 2018.1, when: '2018', title: 'Crimson Code Hackathon, 1st place', meta: 'Washington State University', url: 'https://tiny.cc/crimsoncode2018' },
      { t: 2025.45, when: 'Jun 2025', title: 'ICETAIA 2025, invited keynote', meta: 'A practical framework for rapid prototyping and fidelity' },
      ...fromCards(['media'])
    ]
  },
  {
    key: 'belong',
    sections: ['memberships'],
    name: 'Belong',
    sub: 'memberships',
    hue: '#6a8cff',
    items: [
      { t: 2026.2, when: '2026', title: 'Sigma Xi', meta: 'Scientific research honor society' },
      { t: 2026.3, when: '2026', title: 'IEEE Senior Member', meta: 'Elevated membership grade' }
    ]
  },
  {
    key: 'build',
    sections: ['lab', 'projects'],
    name: 'Build',
    sub: 'lab and projects',
    hue: '#b07cff',
    items: [
      { t: 2026.51, when: '2026', title: 'wc26', meta: 'World Cup 2026 map', url: 'https://wc26.parthchandak.info' },
      { t: 2026.52, when: '2026', title: 'tide', meta: '3D ocean from buoy data', url: 'https://tide.parthchandak.info' },
      { t: 2026.53, when: '2026', title: 'orbit', meta: 'Product gravity field', url: 'https://orbit.parthchandak.info' },
      { t: 2026.54, when: '2026', title: 'inkwell', meta: 'Ink simulation from live wind', url: 'https://inkwell.parthchandak.info' },
      { t: 2026.55, when: '2026', title: 'aeris', meta: 'World weather dashboard', url: 'https://aeris.parthchandak.info' },
      { t: 2026.56, when: '2026', title: 'eurusd', meta: 'Exchange rate road drive', url: 'https://eurusd.parthchandak.info' },
      { t: 2026.75, when: '2026', title: 'jobwright', meta: 'Daily scored job list', url: 'https://github.com/parthchandak02/jobwright' },
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

// Lines that describe a group (one patent family, seven reviews) point at that group's single card
const CARD_FOR_BAND = { invent: 'Audio Prioritization (US20260003563A1)', review: 'Peer Reviewer, Springer Nature' };
const CARD_OVERRIDES = {
  'ICETAIA 2025, invited keynote': 'A Practical Framework for Rapid Prototyping and Fidelity in Product Development'
};

spectrumBands.forEach((band) => {
  band.section = band.sections[0];
  band.items.forEach((item) => {
    if (!item.card) item.card = CARD_FOR_BAND[band.key] || CARD_OVERRIDES[item.title] || findCard(item.title);
  });
});

export const bandForSection = (section) => spectrumBands.find((band) => band.sections.includes(section)) || null;

export const spectrumTotal = spectrumBands.reduce((n, b) => n + b.items.length, 0);
