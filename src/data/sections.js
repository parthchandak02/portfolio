// The portfolio's sections, in page order. Each card lives in src/content/cards/<id>/ (the Lab in lab.js).
// layout: 'timeline' for things that follow one another (jobs, degrees), shown as wide cards in date order;
// 'tiles' for a body of separate pieces, shown as a grid of tiles (see components/CardTile).
export const SECTIONS = [
  { id: 'experience', layout: 'timeline' },
  { id: 'education', layout: 'timeline' },
  { id: 'patent', layout: 'tiles' },
  { id: 'research', layout: 'tiles' },
  { id: 'judging', layout: 'tiles' },
  { id: 'impact', layout: 'tiles' },
  { id: 'awards', layout: 'tiles' },
  { id: 'speaking', layout: 'tiles' },
  { id: 'media', layout: 'tiles' },
  { id: 'memberships', layout: 'tiles' },
  { id: 'lab', layout: 'tiles' },
  { id: 'projects', layout: 'tiles' }
];

export const categoryOrder = SECTIONS.map((s) => s.id);
export const layoutOf = (category) => SECTIONS.find((s) => s.id === category)?.layout || 'tiles';
