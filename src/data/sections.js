// The portfolio's sections, in page order. Each card lives in src/content/cards/<id>/ (the Lab in lab.js).
// layout: 'timeline' for things that follow one another (jobs, degrees), shown as wide cards in date order;
// 'tiles' for a body of separate pieces, shown as a grid of tiles (see components/CardTile).
export const SECTIONS = [
  { id: 'experience', layout: 'timeline' },
  { id: 'education', layout: 'timeline' },
  { id: 'patent', layout: 'tiles' },
  // preview: the cards a section shows until "Show all" (the rest keep their places when it opens)
  {
    id: 'research',
    layout: 'tiles',
    noun: 'papers',
    preview: [
      'Augmented Reality Enhances Telemedicine Training',
      'Integrating User-Centered Design in Rapid Robotic System Prototyping',
      'Leveraging Haptic Feedback in Mixed Reality',
      'Rapid Prototyping Technologies and Design Frameworks',
      'Integrating Advanced Sensor Fusion with User-Centered Design in Robotics',
      'Advances in Human-Robot Interaction',
    ],
  },
  { id: 'judging', layout: 'tiles' },
  { id: 'impact', layout: 'tiles' },
  { id: 'awards', layout: 'tiles' },
  { id: 'speaking', layout: 'tiles' },
  { id: 'media', layout: 'tiles' },
  { id: 'memberships', layout: 'tiles' },
  {
    id: 'lab',
    layout: 'tiles',
    noun: 'experiments',
    preview: [
      'jobwright',
      'tide',
      'inkwell',
      'aeris',
      'stellar',
      'wc26',
      'orbiter',
      'echo',
      'rift',
      'atmos',
    ],
  },
  { id: 'projects', layout: 'tiles' },
];

export const categoryOrder = SECTIONS.map((s) => s.id);
export const sectionOf = (id) => SECTIONS.find((s) => s.id === id);
export const layoutOf = (category) =>
  SECTIONS.find((s) => s.id === category)?.layout || 'tiles';
