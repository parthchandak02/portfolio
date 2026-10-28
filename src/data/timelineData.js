// Timeline data - using clean data structure with centralized icon mapping
import { cardsBySection } from 'virtual:cards';
import { labProjects } from './lab';
import { categoryOrder } from './sections';
import { 
  // Navigation icons from Lucide React
  Code, Database, GitBranch, Cpu, Terminal, Settings, Zap,
  CircuitBoard, Microchip, Figma, Palette, Layers, Box,
  Printer, PenTool, Gamepad2, Trello, Mail, Monitor, FileText,
  // Additional icons for experience section
  Factory, Wrench, Users, Cog, ChartBar, TruckElectric, PencilRuler,
  // New icons for enhanced navigation
  FileJson, Presentation, DollarSign, Plane, School,
  Lightbulb, Crown, HeartHandshake, Handshake, Microscope, User,
  Vibrate, Sun, Dna,
  // Latest missing icons from new additions
  BrainCircuit, HandCoins, Computer, Beaker, Glasses,
  Award, Star, IterationCw,
  // Research-specific icons
  BriefcaseMedical, Brain, Video, RadioTower, Leaf, GraduationCap,
  Battery, Accessibility,
  // Media-specific icons
  Newspaper, Pen, Speech, Mic
} from 'lucide-react';



// Centralized icon mapping - all navigation icons defined in one place
export const iconMap = {
  'Python': Code,
  'JavaScript': Terminal,
  'React': Zap,
  'Database': Database,
  'C++': Settings,
  'MATLAB': Cpu,
  'Figma': Figma,
  'Blender': Layers,
  'Unity': Gamepad2,
  'ProtoPie': Palette,
  'Linux': Computer,
  'Git': GitBranch,
  'Arduino': CircuitBoard,
  'Microcontrollers': CircuitBoard,
  'Code': Code,
  'Raspberry Pi': Microchip,
  'SolidWorks': PenTool,
  'Fusion 360': Box,
  '3D Printing': Printer,
  'Miro': Monitor,
  'JIRA': Trello,
  'G-Suite': Mail,
  'Confluence': FileText,
  // New icons for experience section
  'Manufacturing': Factory,
  'Tools': Wrench,
  'Team Management': Users,
  'Process Optimization': Cog,
  'Data Analysis': ChartBar,
  'Electric Vehicles': TruckElectric,
  'CAD': PencilRuler,
  // New icons for enhanced navigation
  'JSON': FileJson,
  'Presentation': Presentation,
  'Fundraising': DollarSign,
  'Travel': Plane,
  'School Building': School,
  'Innovation': Lightbulb,
  'Leadership': Crown,
  'Relationships': HeartHandshake,
  'Community Service': HeartHandshake,
  'Collaboration': Handshake,
  'Research': Microscope,
  'User Experience': User,
  'Haptics': Vibrate,
  'Solar': Sun,
  'Biomimicry': Dna,
  // Latest missing icons from new additions
  'Shell': Terminal,
  'LLMs': BrainCircuit,
  'Google Apps Script': Settings,
  'Finance': HandCoins,
  'TypeScript': Code,
  'SQL': Database,
  'Automation': IterationCw,
  'Team Player': Users,
  'Advisor': Award,
  'Creativity': Star,
  'Technology': Monitor,
  'Robotics': CircuitBoard,
  'Materials Science': Beaker,
  'Computer Science': Computer,
  'Wireframing': Palette,
  'Prototyping': Box,
  'Design': Palette,
  'Mixed Reality': Glasses,
  // Research-specific icons
  'Medical Research': BriefcaseMedical,
  'AI Research': Brain,
  'Telemedicine': Video,
  'IoT': RadioTower,
  'Agriculture': Leaf,
  'Education': GraduationCap,
  'Battery Tech': Battery,
  'Accessibility': Accessibility,
  // Media-specific icons
  'Newspaper': Newspaper,
  'Pen': Pen,
  'Speech': Speech,
  'Mic': Mic
};

// The cards themselves are Markdown files in src/content/cards/<section>/, loaded and checked at build time by
// scripts/cards.mjs; the Lab's projects come from lab.js
export const timelineDataByCategory = { ...cardsBySection, lab: labProjects };

export { categoryOrder };

// Flattened timeline data for backward compatibility (computed from categories)
export const timelineData = (() => {
  
  return categoryOrder.flatMap(category => 
    timelineDataByCategory[category] || []
  );
})();

// Helper function to get unique typewriter titles from timeline data
export const getTypewriterData = () => {
  const typewriterCards = timelineData.filter(item => item.typewriterTitle);
  const uniqueTitles = [...new Set(typewriterCards.map(item => item.typewriterTitle))];
  
  return uniqueTitles.map(title => {
    const card = typewriterCards.find(item => item.typewriterTitle === title);
    return {
      prefix: card.typewriterPrefix,
      title: card.typewriterTitle,
      skills: card.skills,
      sidebarCategories: [card.category]
    };
  });
};
