// Timeline data - using clean data structure with centralized icon mapping
import { labProjects } from './lab';
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

// Comprehensive timeline data from resume

// Timeline data organized by categories for easier management
export const timelineDataByCategory = {
  experience: [
    {
        "title": "Senior Creative Technologist",
        "company": "Zoox",
        "companyLogo": "/logos/zoox-logo.png",
        "date": "October 2026 - Present",
        "category": "experience",
        "location": "Foster City, CA",
        "description": "Build the prototyping systems that let designers and researchers try ideas in the robotaxi cabin, from lights and sound to displays and controls, and test them in realistic conditions.",
        "typewriterTitle": "Creative Technologist",
        "typewriterPrefix": "I am a",
        "skills": [
            "Microcontrollers",
            "Figma",
            "Blender",
            "SolidWorks",
            "ProtoPie",
            "Linux"
        ]
    },
    {
        "title": "Creative Technologist",
        "company": "Zoox",
        "companyLogo": "/logos/zoox-logo.png",
        "projectImage": "/images/zoox-main.png",
        "date": "February 2022 - October 2026",
        "category": "experience",
        "location": "Foster City, CA",
        "description": "Build prototyping systems that let designers and researchers try ideas in the robotaxi cabin, from lights and sound to displays and controls, without waiting on engineering. Connect design tools to vehicle hardware so new variations can be tested quickly and in realistic conditions.",
        "typewriterTitle": "Creative Technologist",
        "typewriterPrefix": "I am a",
        "skills": [
            "Microcontrollers",
            "Figma",
            "Blender",
            "SolidWorks",
            "ProtoPie",
            "Linux"
        ]
    },
    {
        "title": "Find My Zoox",
        "company": "Zoox",
        "companyLogo": "/logos/zoox-logo.png",
        "date": "May 2026",
        "category": "experience",
        "location": "Zoox, public launch video",
        "description": "Riders set a theme in the app and find their robotaxi by a personalized light and sound sequence. Helped prototype the lights and audio, and built the tooling that let designers try different color variations.",
        "video": { "id": "fbEqWTsEZHA", "title": "Find My Zoox, Zoox on YouTube" },
        "url": "https://www.youtube.com/watch?v=fbEqWTsEZHA",
        "typewriterTitle": "Prototyper",
        "typewriterPrefix": "I am a",
        "skills": [
            "Prototyping",
            "Design",
            "User Experience"
        ]
    },
    {
        "title": "ZooxCast",
        "company": "Zoox",
        "companyLogo": "/logos/zoox-logo.png",
        "date": "May 2026",
        "category": "experience",
        "location": "Zoox, public launch video",
        "description": "Riders can stream their own audio over Bluetooth alongside Zoox's curated playlist. Helped designers test audio connections and prototyped ways to connect to the vehicle hardware.",
        "video": { "id": "FBwjGXLNiBU", "title": "ZooxCast, Zoox on YouTube" },
        "url": "https://www.youtube.com/watch?v=FBwjGXLNiBU",
        "typewriterTitle": "Prototyper",
        "typewriterPrefix": "I am a",
        "skills": [
            "Prototyping",
            "User Experience"
        ]
    },
    {
        "title": "Manufacturing Engineer",
        "company": "Zoox",
        "companyLogo": "/logos/zoox-logo.png",
        "date": "October 2018 - January 2022",
        "category": "experience",
        "location": "Foster City, CA",
        "description": "Built part-tracking scripts that improved traceability, and created tools and processes that improved manufacturing quality, testing, and material workflows for technicians. Manufactured vehicle hardware across product life cycles, from DFMEA to OQC.",
        "skills": [
            "Python",
            "JavaScript",
            "SQL",
            "Manufacturing",
            "CAD",
            "Automation"
        ]
    },
    {
        "title": "Engineering Intern, Charging Special Projects",
        "company": "Tesla Motors",
        "companyLogo": "/logos/tesla-logo.png",
        "date": "May 2018 - August 2018",
        "category": "experience",
        "location": "Fremont, CA",
        "description": "Planned and executed a 2000+ mile logistics trip with the Tesla Semi using VBA and PowerQuery for the truck charging program. Designed and built a model library of 20+ Supercharger components for architecture and engineering firms. Designed 10+ civil/architectural sites for next-generation Supercharger in SketchUp.",
        "skills": [
            "Data Analysis",
            "Electric Vehicles",
            "CAD"
        ]
    },
    {
        "title": "Engineering and Manufacturing Intern",
        "company": "BERG Manufacturing",
        "companyLogo": "/logos/berg-logo.png",
        "date": "June 2017 - August 2017",
        "category": "experience",
        "location": "Spokane, WA",
        "description": "Achieved a minimum 10% higher production rate with LEAN manufacturing and CAD/CAM prototyping for hard-wall shelters.",
        "skills": [
            "Manufacturing",
            "CAD",
            "Process Optimization"
        ]
    },
    {
        "title": "Resident Advisor",
        "company": "Washington State University",
        "companyLogo": "/logos/wsu-logo.png",
        "date": "August 2015 - May 2016",
        "category": "experience",
        "location": "Pullman, WA",
        "description": "Enforced campus policies and organized events regarding technology in residence halls for 400+ residents.",
        "skills": [
            "Team Player",
            "Advisor",
            "Creativity"
        ]
    },
    {
        "title": "Resident Technology Assistant",
        "company": "Washington State University",
        "companyLogo": "/logos/wsu-logo.png",
        "date": "August 2016 - May 2018",
        "category": "experience",
        "location": "Pullman, WA",
        "description": "Assisted students with technical issues, created technology awareness.",
        "skills": [
            "Team Player",
            "Technology",
            "Advisor",
            "Creativity"
        ]
    }
  ],
  education: [
    {
        "title": "Bachelor of Science: Mechanical Engineering",
        "date": "May 2018",
        "category": "education",
        "company": "WSU",
        "companyLogo": "/logos/wsu-logo.png",
        "location": "Washington State University",
        "description": "Graduated with GPA 3.7/4.0. Minors in Computer Science and Mathematics. Focused on robotics, automation, engineering design, and interdisciplinary technology integration.",
        "volume": "GPA: 3.7/4.0, Minors: Computer Science, Mathematics",
        "typewriterTitle": "Mechanical Engineer",
        "typewriterPrefix": "I am a",
        "skills": [
            "Robotics",
            "Automation",
            "CAD",
            "Materials Science",
            "Computer Science"
        ]
    },
    {
        "title": "Essentials of UX Design",
        "date": "June 2022 - August 2022",
        "category": "education",
        "company": "UC Berkeley Extension",
        "companyLogo": "/logos/berkeley-logo.png",
        "location": "UC Berkeley Extension",
        "description": "Comprehensive course in user experience design principles, methodologies, and practical application in product development. Achieved exceptional academic performance.",
        "volume": "Grade: 97.6/100",
        "typewriterTitle": "Creative Technologist",
        "typewriterPrefix": "I am a",
        "skills": [
            "Wireframing",
            "Prototyping",
            "Presentation",
            "Design"
        ]
    }
  ],
  patent: [
    {
        "title": "Audio Prioritization (US20260003563A1)",
        "date": "Filed June 2024, published January 2026",
        "category": "patent",
        "company": "Zoox",
        "companyLogo": "/logos/zoox-logo.png",
        "location": "US20260003563A1 and WO2026005985A1",
        "url": "https://patents.google.com/patent/US20260003563A1/en",
        "description": "Named inventor on a published patent application for context-aware audio prioritization in autonomous vehicles, covering how in-cabin audio behavior can be tested and tuned in realistic prototypes.",
        "typewriterTitle": "Inventor",
        "typewriterPrefix": "I am an ",
        "skills": [
            "JSON",
            "Linux"
        ]
    }
  ],
  speaking: [
    {
        "title": "A Practical Framework for Rapid Prototyping and Fidelity in Product Development",
        "date": "June 2025",
        "projectImage": "/images/keynote-rapid-prototyping-fidelity.jpg",
        "category": "speaking",
        "location": "ICETAIA Conference",
        "description": "Keynote presentation on innovative rapid prototyping methodologies and fidelity frameworks for modern product development, sharing insights from autonomous vehicle development.",
        "skills": [
            "Presentation"
        ]
    }
  ],
  impact: [
    {
        "title": "Rebuilding Together: Fence and Handrail Build",
        "date": "April 2024",
        "company": "Rebuilding Together",
        "category": "impact",
        "url": "https://photos.app.goo.gl/N2Gx6HM6KmrSNWds8",
        "projectImage": "/images/impact/rebuilding-together-2024.jpg",
        "description": "Built a fence under the guidance of the Rebuilding Together team, installed a new microwave, added a handrail to the stairs down to the yard, cleared the area and mowed the grass.",
        "skills": [
            "Community Service"
        ]
    },
    {
        "title": "Catholic Worker House: Kitchen and Sheds",
        "date": "October 2023",
        "company": "Catholic Worker House",
        "category": "impact",
        "url": "https://photos.app.goo.gl/PVaDbtecgY5weSYJ9",
        "projectImage": "/images/impact/catholic-worker-house-2023.jpg",
        "description": "Painted the kitchen, built shelves in the food and tool sheds, and refurbished the landscaping.",
        "skills": [
            "Community Service"
        ]
    },
    {
        "title": "Rebuilding Together: Yard Rebuild",
        "date": "April 2023",
        "company": "Rebuilding Together",
        "category": "impact",
        "url": "https://photos.app.goo.gl/smkP4AQiFjMZa9FA9",
        "projectImage": "/images/impact/rebuilding-together-2023.jpg",
        "description": "Redid an entire yard: removed the grass, laid down over 200 lbs of crushed gravel, installed rails, worked on the house interior and cleaned up the backyard.",
        "skills": [
            "Community Service"
        ]
    },
    {
        "title": "BuildOn Nepal School Project - $55K Fundraising Lead",
        "date": "January 2025",
        "company": "BuildOn",
        "companyLogo": "/logos/buildon-logo.png",
        "category": "impact",
        "location": "Nepal",
        "url": "https://buildon-nepal-trek.vercel.app",
        "projectImage": "/images/buildon-nepal-trek.png",
        "description": "Raised $55,000 to build a school in Nepal, directly impacting 210+ students (including 108 girls) in a community of 2250 farmers. Led fundraising strategy and participated in construction trek.",
        "skills": [
            "Fundraising",
            "Travel",
            "School Building"
        ]
    },
    {
        "title": "Manager, Team Innovation Program",
        "date": "May 2025 - Present",
        "category": "impact",
        "company": "Mentor Discover Inspire",
        "companyLogo": "/logos/mdi-logo.png",
        "location": "Mentor Discover Inspire",
        "description": "Leading 3+ cross-team initiatives to enhance inter- and intra-team cohesion. Managing innovative mentorship programs and organizational development.",
        "typewriterTitle": "Team Leader",
        "typewriterPrefix": "I am a",
        "skills": [
            "Team Management",
            "Process Optimization",
            "Innovation"
        ]
    },
    {
        "title": "Team Leader",
        "date": "May 2025 - Present",
        "category": "impact",
        "company": "Mentor Discover Inspire",
        "companyLogo": "/logos/mdi-logo.png",
        "location": "Mentor Discover Inspire",
        "description": "Expanded team from 6 to 12+ members (↑100%) ; organized 3+ community service and team-building events",
        "typewriterTitle": "Team Leader",
        "typewriterPrefix": "I am a",
        "skills": [
            "Leadership",
            "Relationships",
            "Collaboration"
        ]
    }
  ],
  research: [
    {
        "title": "Ethical, Governance, and Usability Challenges in AI-Powered Virtual Health Assistants",
        "date": "2025",
        "category": "research",
        "volume": "IJFMR, Volume 7, Issue 1",
        "description": "Systematic exploration of ethical frameworks and governance challenges in AI health assistants, focusing on user experience and regulatory compliance.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "MATLAB",
            "Python",
            "C++",
            "AI Research"
        ]
    },
    {
        "title": "Augmented Reality Enhances Telemedicine Training",
        "date": "2025",
        "category": "research",
        "volume": "IJFMR, Volume 7, Issue 3",
        "description": "Research on AR applications in telemedicine training, demonstrating improved learning outcomes and practical skill development.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Mixed Reality",
            "Medical Research",
            "Telemedicine",
            "Education"
        ]
    },
    {
        "title": "Advancing Telemedicine Through Adaptive UX",
        "date": "August 2024",
        "category": "research",
        "volume": "ProMedSci, Volume 8, Issue E178",
        "description": "Investigation of adaptive user experience design principles in telemedicine platforms, focusing on accessibility and user engagement.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "User Experience",
            "Medical Research",
            "Telemedicine",
            "Accessibility"
        ]
    },
    {
        "title": "Systematic Review of Healthcare IoT and Rapid Prototyping",
        "date": "August 2024",
        "category": "research",
        "volume": "ProMedSci, Volume 8, Issue E153",
        "description": "Comprehensive review of IoT applications in healthcare with focus on rapid prototyping methodologies for medical device development.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Medical Research",
            "IoT",
            "Prototyping",
            "Database"
        ]
    },
    {
        "title": "Integrating User-Centered Design in Rapid Robotic System Prototyping",
        "date": "August 2024",
        "category": "research",
        "volume": "IJIRMPS, Volume 12, Issue 4",
        "url": "https://doi.org/10.5281/zenodo.14280144",
        "description": "Framework for incorporating user-centered design principles in rapid prototyping of robotic systems, with emphasis on human-robot interaction.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "User Experience",
            "Robotics",
            "Prototyping",
            "Design"
        ]
    },
    {
        "title": "The Evolution of Haptic Feedback Systems and User Experience",
        "date": "2024",
        "category": "research",
        "volume": "JEAST, Volume 5, Issue 4",
        "description": "Comprehensive analysis of haptic feedback evolution and its impact on user experience design in modern interactive systems.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Research",
            "User Experience",
            "Haptics",
            "Technology"
        ]
    },
    {
        "title": "Optimizing Bio-Inspired Phototropic Materials",
        "date": "2024",
        "category": "research",
        "volume": "IJACT, Volume 2, Issue 4",
        "description": "Research on bio-inspired materials that respond to light, with applications in smart materials and autonomous systems.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Research",
            "Solar",
            "Biomimicry",
            "Materials Science"
        ]
    },
    {
        "title": "User-Centered Design in Healthcare Education Technologies",
        "date": "2024",
        "category": "research",
        "volume": "ProMedSci, Volume 9, Issue E174",
        "description": "Framework for implementing user-centered design principles in healthcare education technology development.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "User Experience",
            "Medical Research",
            "Education",
            "Technology"
        ]
    },
    {
        "title": "Leveraging Haptic Feedback in Mixed Reality",
        "date": "July 2023",
        "category": "research",
        "volume": "JEAST, Volume 5, Issue 4",
        "url": "https://doi.org/10.47363/JEAST/2023(5)E170",
        "description": "Investigation of haptic feedback systems in mixed reality environments and their impact on user experience and task performance.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Research",
            "Haptics",
            "Mixed Reality",
            "User Experience",
            "Research"
        ]
    },
    {
        "title": "Rapid Prototyping Technologies and Design Frameworks",
        "date": "2023",
        "category": "research",
        "volume": "JMSMR, Volume 4, Issue 1",
        "url": "https://doi.org/10.47363/JMSMR/2023(4)E115",
        "description": "Comprehensive study of rapid prototyping methodologies and their application in modern design frameworks across multiple industries.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Prototyping",
            "Manufacturing",
            "Design",
            "3D Printing"
        ]
    },
    {
        "title": "Integrating Advanced Sensor Fusion with User-Centered Design in Robotics",
        "date": "2023",
        "category": "research",
        "volume": "ISJEM, Volume 2, Issue 9",
        "description": "Research on combining advanced sensor technologies with human-centered design principles in robotic system development.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Robotics",
            "User Experience",
            "IoT",
            "Design"
        ]
    },
    {
        "title": "User-Centric Design in IoT Prototyping for Smart Agriculture",
        "date": "2022",
        "category": "research",
        "volume": "IJIRMPS, Volume 10, Issue 2",
        "description": "Application of user-centered design principles in IoT system development for agricultural automation and smart farming solutions.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "User Experience",
            "IoT",
            "Agriculture",
            "Prototyping"
        ]
    },
    {
        "title": "Rapid Prototyping Methodologies for Smart Shop Tools",
        "date": "2022",
        "category": "research",
        "volume": "URF Journals",
        "description": "Development of rapid prototyping frameworks specifically designed for smart manufacturing tools and Industry 4.0 applications.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Prototyping",
            "Manufacturing",
            "Tools",
            "LLMs"
        ]
    },
    {
        "title": "Advancing Robotics-Enabled STEM Education in K-12",
        "date": "2021",
        "category": "research",
        "volume": "IJSREM, Volume 5, Issue 12",
        "description": "Research on integrating robotics platforms into K-12 STEM education to enhance learning outcomes and student engagement.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Robotics",
            "Education",
            "Code",
            "Team Management"
        ]
    },
    {
        "title": "Advances in Human-Robot Interaction",
        "date": "2021",
        "category": "research",
        "volume": "IJIRMPS, Volume 9, Issue 5",
        "description": "Comprehensive study of human-robot interaction principles and their application in developing intuitive robotic interfaces.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Robotics",
            "User Experience",
            "Collaboration",
            "Design"
        ]
    },
    {
        "title": "Advancements in Electric Bicycle Technology",
        "date": "2020",
        "category": "research",
        "volume": "Zenodo",
        "description": "Technical analysis of electric bicycle innovations, focusing on battery technology, motor efficiency, and sustainable transportation solutions.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Electric Vehicles",
            "Battery Tech",
            "Technology",
            "Agriculture"
        ]
    },
    {
        "title": "Growth and Characterization of Cadmium Telluride",
        "date": "2019",
        "category": "research",
        "volume": "IJFMR, Volume 1, Issue 2",
        "description": "Materials science research on cadmium telluride crystal growth and characterization for semiconductor applications.",
        "typewriterTitle": "Researcher",
        "typewriterPrefix": "I am a",
        "skills": [
            "Materials Science",
            "Solar",
            "Research",
            "Technology"
        ]
    }
  ],
  judging: [
    {
        "title": "Peer Reviewer, Springer Nature",
        "date": "February 2026 - October 2026",
        "category": "judging",
        "location": "BMC, Discover, Humanities and Social Sciences Communications and International Journal of Social Robotics",
        "description": "Certified peer reviews for Springer Nature journals: BMC Health Services Research (Feb 22, 2026), Discover Artificial Intelligence (Aug 11), Discover Education (Aug 23 and Sep 10), Humanities and Social Sciences Communications (Aug 23), Discover Sustainability (Sep 10), Discover Oncology (Sep 18), Discover Applied Sciences (Oct 6) and International Journal of Social Robotics (Oct 19).",
        "typewriterTitle": "Reviewer",
        "typewriterPrefix": "I am a",
        "skills": [
            "Research",
            "Advisor"
        ]
    },
    {
        "title": "Cal Hacks 13.0, Judge",
        "date": "October 23-25, 2026",
        "projectImage": "/images/judging/cal-hacks-13.jpg",
        "category": "judging",
        "location": "San Francisco, CA",
        "description": "Judge at Cal Hacks 13.0.",
        "skills": [
            "Advisor",
            "Innovation"
        ]
    },
    {
        "title": "LA Hacks 2026, Judge",
        "date": "April 26, 2026",
        "projectImage": "/images/judging/la-hacks-2026.jpg",
        "category": "judging",
        "location": "Los Angeles, CA",
        "description": "Invite-only judge for a hackathon of 1,000+ students.",
        "skills": [
            "Advisor",
            "Innovation"
        ]
    },
    {
        "title": "HackMerced XI, Judge",
        "date": "March 8, 2026",
        "projectImage": "/images/judging/hackmerced-xi-judges.jpg",
        "category": "judging",
        "location": "UC Merced",
        "description": "Judged MLH and UC Merced hackathon projects.",
        "skills": [
            "Advisor",
            "Innovation"
        ]
    }
  ],
  memberships: [
    {
        "title": "IEEE Senior Member",
        "date": "February 2026",
        "category": "memberships",
        "description": "Elevated membership grade of the IEEE, awarded for professional achievement.",
        "skills": [
            "Technology"
        ]
    },
    {
        "title": "Sigma Xi, The Scientific Research Honor Society",
        "date": "March 2026",
        "category": "memberships",
        "description": "Member of the scientific research honor society.",
        "skills": [
            "Research"
        ]
    },
    {
        "title": "Tau Beta Pi, Engineering Honor Society",
        "date": "May 2018",
        "category": "memberships",
        "description": "Member of the engineering honor society.",
        "skills": [
            "Robotics"
        ]
    },
    {
        "title": "QuillBot Product Advisory Panel",
        "date": "April 2025",
        "category": "memberships",
        "description": "Member of the product advisory panel for the QuillBot writing tool.",
        "skills": [
            "Advisor"
        ]
    }
  ],
  lab: labProjects,
  projects: [
    {
        "title": "LLM Assisted Research Platform",
        "date": "December 2024 - September 2026",
        "category": "projects",
        "description": "AI-powered literature review assistant that streamlines academic research workflows. Leverages large language models to automate paper analysis, extract key insights, and synthesize research findings across multiple documents.",
        "url": "https://github.com/parthchandak02/literature-review-assistant",
        "projectImage": "/images/llm-lit-review-assisstant.png",
        "typewriterTitle": "Programmer",
        "typewriterPrefix": "I am a",
        "skills": [
            "Python",
            "Shell",
            "LLMs"
        ]
    },
    {
        "title": "Google Apps Script AI Integration Framework",
        "date": "February 2025",
        "category": "projects",
        "companyLogo": "/logos/gapps-script.png",
        "description": "Framework for integrating AI capabilities into Google Workspace applications using Apps Script and Gemini API. Enables automated document processing, intelligent data analysis, and workflow optimization.",
        "url": "https://github.com/parthchandak02/gapps-script-gemini",
        "projectImage": "/images/gapps-script-gsheets.png",
        "typewriterTitle": "Programmer",
        "typewriterPrefix": "I am a",
        "skills": [
            "Google Apps Script",
            "JavaScript",
            "LLMs"
        ]
    },
    {
        "title": "Financial Trading API for Interactive Brokers (IBKR)",
        "date": "March 2025 - July 2026",
        "category": "projects",
        "companyLogo": "/logos/ibkr-logo.png",
        "description": "Comprehensive REST API for Interactive Brokers platform enabling automated trading, portfolio management, and real-time market data integration.",
        "url": "https://github.com/parthchandak02/ibkr-ibind-rest-api",
        "typewriterTitle": "Programmer",
        "typewriterPrefix": "I am a",
        "skills": [
            "Python",
            "Finance"
        ]
    },
    {
        "title": "Calendar and Alarm Productivity System",
        "date": "September 2024 - October 2026",
        "projectImage": "/images/calarm-live-activity.jpg",
        "category": "projects",
        "description": "Advanced productivity system combining intelligent calendar management with context-aware alarm systems for optimized time management and task completion.",
        "url": "https://github.com/parthchandak02/calarm",
        "typewriterTitle": "Programmer",
        "typewriterPrefix": "I am a",
        "skills": [
            "TypeScript",
            "JavaScript",
            "Shell"
        ]
    },
    {
        "title": "Boeing: Damping Ratios of Piloted Systems",
        "date": "September 2017",
        "category": "projects",
        "location": "Boeing Collaboration, WSU",
        "company": "Boeing",
        "companyLogo": "/logos/boeing-logo.png",
        "projectImage": "/images/damping-ratios-of-piloted-systems.png",
        "description": "Served as Team Technical Lead and Liaison. Developed innovative damping ratio analysis tool using advanced mathematical techniques for piloted aircraft systems, contributing to aerospace engineering research.",
        "typewriterTitle": "Programmer",
        "typewriterPrefix": "I am a",
        "skills": [
            "MATLAB",
            "Python",
            "C++"
        ]
    },
    {
        "title": "Center for Materials Research - ACRT Furnace System",
        "date": "February 2017 - March 2017",
        "category": "projects",
        "location": "WSU Materials Research",
        "company": "WSU",
        "companyLogo": "/logos/wsu-logo.png",
        "projectImage": "/images/research-a-take-on-safety.png",
        "description": "Designed and assembled standardization system for accelerated crystal rotation technique (ACRT) furnace for SURCA research. Contributed to advanced materials science research.",
        "typewriterTitle": "Mechanical Engineer",
        "typewriterPrefix": "I am a",
        "skills": [
            "Materials Science",
            "CAD"
        ]
    },
    {
        "title": "IEEE Hardware Hackathon - Sunlight-Following Robot",
        "date": "October 2017",
        "category": "projects",
        "location": "Washington State University",
        "company": "WSU",
        "companyLogo": "/logos/wsu-logo.png",
        "projectImage": "/images/engineering-gear-system-for-parallax-bot.png",
        "description": "Designed and programmed a centipede robot with phototropic behavior that autonomously follows sunlight. Integrated sensors, microcontrollers, and mechanical design for bio-inspired robotics.",
        "typewriterTitle": "Maker",
        "typewriterPrefix": "I am a",
        "skills": [
            "Robotics",
            "Automation",
            "CAD",
            "Computer Science"
        ]
    }
  ],
  
  awards: [
    {
        "title": "Harold Frank Engineering Entrepreneurship Kauffman Award",
        "date": "2016 - 2018",
        "category": "awards",
        "company": "WSU",
        "companyLogo": "/logos/wsu-logo.png",
        "location": "Pullman, WA",
        "description": "Prestigious multi-year award recognizing outstanding engineering entrepreneurship and innovation. Awarded for demonstrated excellence in combining engineering principles with entrepreneurial thinking."
    },
    {
        "title": "Crimson Code Software Hackathon - 1st Place (Tier 1)",
        "date": "March 2018",
        "projectImage": "/images/crimson-code-2018-caffeine-cycle.png",
        "url": "https://tiny.cc/crimsoncode2018",
        "category": "awards",
        "company": "WSU",
        "companyLogo": "/logos/wsu-logo.png",
        "location": "Pullman, WA",
        "description": "First place winner for developing advanced image processing capabilities for neural networks in robotic systems. Demonstrated innovation in computer vision and AI integration."
    },
    {
        "title": "Guy E. Thornton Engineering Scholarship",
        "date": "2016",
        "category": "awards",
        "company": "WSU",
        "companyLogo": "/logos/wsu-logo.png",
        "location": "Pullman, WA",
        "description": "Merit-based scholarship recognizing academic excellence and potential in engineering. Awarded for outstanding academic performance and engineering aptitude."
    },
    {
        "title": "Robert W. Finch Memorial Scholarship",
        "date": "2015",
        "category": "awards",
        "company": "WSU",
        "companyLogo": "/logos/wsu-logo.png",
        "location": "Pullman, WA",
        "description": "Scholarship awarded to incoming engineering students demonstrating exceptional academic potential and commitment to engineering excellence."
    },
    {
        "title": "International Merit Award",
        "date": "2015 - 2018",
        "category": "awards",
        "company": "WSU",
        "companyLogo": "/logos/wsu-logo.png",
        "location": "Pullman, WA",
        "description": "Multi-year merit award recognizing exceptional academic achievement and international student excellence throughout undergraduate career."
    }
  ],
  media: [
    {
        "title": "User-Centered Design Approaches for Manufacturing Systems",
        "date": "2025",
        "projectImage": "/images/media/ucd-manufacturing-zoox.jpg",
        "category": "media",
        "location": "Analytics Insight",
        "description": "Featured article discussing innovative approaches to user-centered design in modern manufacturing systems and Industry 4.0 applications.",
        "skills": [
            "User Experience",
            "Manufacturing",
            "Data Analysis",
            "Automation"
        ]
    },
    {
        "title": "The Creative Technologist: Bridging Engineering, UX, and Robotics",
        "date": "2025",
        "projectImage": "/images/media/creative-technologist-deccan.jpg",
        "category": "media",
        "location": "Deccan Chronicle",
        "description": "Profile piece highlighting the intersection of engineering, user experience design, and robotics in autonomous vehicle development.",
        "skills": [
            "User Experience",
            "Robotics",
            "Prototyping",
            "Technology"
        ]
    },
    {
        "title": "Bridging the Trust Gap Between Humans and Autonomous Systems",
        "date": "2025",
        "projectImage": "/images/media/bridging-trust-gap.jpg",
        "url": "https://www.freepressjournal.in/latest-news/bridging-the-trust-gap-between-humans-autonomous-systems-through-intuitive-interfaces",
        "category": "media",
        "location": "Free Press Journal",
        "description": "Analysis of trust-building strategies in human-autonomous system interactions, drawing from automotive industry experience.",
        "skills": [
            "User Experience",
            "AI Research",
            "Electric Vehicles",
            "Design"
        ]
    },
    {
        "title": "Leveraging Mixed Reality and Haptic Feedback for Immersive User Experiences",
        "date": "2024",
        "projectImage": "/images/media/mixed-reality-haptics.jpg",
        "category": "media",
        "location": "The Hans India",
        "description": "Technical discussion of mixed reality applications and haptic feedback systems in creating immersive user experiences.",
        "skills": [
            "Mixed Reality",
            "Haptics",
            "User Experience",
            "Research"
        ]
    },
    {
        "title": "Rapid Prototyping Methodologies for Complex Systems",
        "date": "2023",
        "projectImage": "/images/media/rapid-prototyping-complex-systems.jpg",
        "category": "media",
        "location": "Indiahood",
        "description": "In-depth coverage of rapid prototyping techniques for complex engineering systems, from concept to testing phases.",
        "skills": [
            "Prototyping",
            "Manufacturing",
            "IoT",
            "3D Printing"
        ]
    },
    {
        "title": "Advancing Human-Robot Interaction Through Intuitive Interfaces",
        "date": "2022",
        "projectImage": "/images/media/advancing-hri-indiacsr.jpg",
        "category": "media",
        "location": "India CSR",
        "description": "Discussion of innovative interface design approaches for improving human-robot interaction in various applications.",
        "skills": [
            "Robotics",
            "User Experience",
            "Speech",
            "Design"
        ]
    },
    {
        "title": "Freedom to Soar",
        "date": "2018",
        "projectImage": "/images/media/freedom-to-soar-wsu.jpg",
        "category": "media",
        "company": "WSU",
        "companyLogo": "/logos/wsu-logo.png",
        "location": "WSU VCEA News",
        "description": "University feature highlighting academic achievements and entrepreneurial spirit during undergraduate engineering studies.",
        "skills": [
            "Education",
            "Electric Vehicles",
            "Robotics",
            "Innovation"
        ]
    }
  ]
};

// Single source of truth for category ordering
export const categoryOrder = ['experience', 'education', 'patent', 'research', 'judging', 'impact', 'awards', 'speaking', 'media', 'memberships', 'lab', 'projects'];

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
