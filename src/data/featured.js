// The work a visitor should see first, in the order the record shows it. `title` is the card's own title;
// `name` and `kind` are the short label its tile shows under "Selected work". Each is also marked with a
// mini prism on the strip.
export const FEATURED = [
  { title: 'jobwright', name: 'jobwright', kind: 'AI job search · 2026' },
  { title: 'Calendar and Alarm Productivity System', name: 'calarm', kind: 'iOS app · 2024' },
  { title: 'LLM Assisted Research Platform', name: 'Literature review assistant', kind: 'Research AI · 2024' },
  { title: 'IEEE Hardware Hackathon - Sunlight-Following Robot', name: 'Centipede robot', kind: 'Robotics · 2017' }
];

const featured = new Set(FEATURED.map((f) => f.title));
export const isFeatured = (title) => featured.has(title);
