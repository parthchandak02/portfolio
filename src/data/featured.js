// The work a visitor sees first, in this order, as large cards (see FeatureCards). `title` is the card's own title;
// `name`, `kind` and `line` are what its large card says; `moment` picks the small thing that happens inside it.
// Each is also marked with a small diamond on the strip.
export const FEATURED = [
  {
    title: 'Find My Zoox',
    name: 'Find My Zoox',
    kind: 'Zoox · 2026',
    line: 'Riders find their robotaxi by a personal light and sound. I helped prototype it and built the tools designers used to try colors.',
    moment: 'light'
  },
  {
    title: 'Centi-seed, a Sunlight-Seeking Robot',
    name: 'Centi-seed',
    kind: '1st place, Crimson Code · 2018',
    line: 'A walking robot that carries plants and seeks out sunlight. Point or tap anywhere below and it walks to the light.',
    moment: 'robot'
  },
  {
    title: 'Audio Prioritization (US20260003563A1)',
    name: 'Audio prioritization',
    kind: 'Published patent application · 2026',
    line: 'Named inventor on how a robotaxi decides which sound a rider should hear first. Try it.',
    moment: 'audio'
  },
  {
    title: 'Calendar and Alarm Productivity System',
    name: 'CALarm',
    kind: 'iOS app · 2024',
    line: 'Your calendar, as real alarms. They ring through Silent and Focus, because a meeting deserves more than a banner.',
    moment: 'alarm'
  }
];

export const featuredName = (title) => FEATURED.find((f) => f.title === title)?.name;
