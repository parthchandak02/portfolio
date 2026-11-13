// The work a visitor sees first, in this order, as large cards (see FeatureCards). `title` is the card's own title;
// `name`, `kind` and `line` are what its large card says (line: one short sentence; the full story is in the card); `moment` picks the small thing that happens inside it.
// Each is also marked with a small diamond on the strip.
export const FEATURED = [
  {
    title: 'Find My Zoox',
    name: 'Find My Zoox',
    kind: 'Zoox · 2026',
    line: 'Riders find their robotaxi by its own light and sound.',
    moment: 'light'
  },
  {
    title: 'Centi-seed, a Sunlight-Seeking Robot',
    name: 'Centi-seed',
    kind: '1st place, Crimson Code · 2018',
    line: 'A robot that walks its plants to the sun. Tap below to lead it.',
    moment: 'robot'
  },
  {
    title: 'Audio Prioritization (US20260003563A1)',
    name: 'Audio prioritization',
    kind: 'Published patent application · 2026',
    line: 'How a robotaxi picks the sound you hear first. Try it.',
    moment: 'audio'
  },
  {
    title: 'Calendar and Alarm Productivity System',
    name: 'CALarm',
    kind: 'iOS app · 2024',
    line: 'Your calendar, as alarms that ring through Silent.',
    moment: 'alarm'
  }
];

export const featuredName = (title) => FEATURED.find((f) => f.title === title)?.name;
