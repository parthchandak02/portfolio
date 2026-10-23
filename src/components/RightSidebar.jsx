import { 
  Github, 
  Linkedin, 
  Mail, 
  Globe,
  FileText,
  Calendar
} from 'lucide-react';
import './RightSidebar.css';

const RightSidebar = ({ 
  lightMode = false,
  className = ''
}) => {
  // Social and professional links based on resume
  const socialLinks = [
    { 
      icon: Github, 
      text: 'GitHub', 
      url: 'https://github.com/parthchandak02', 
      external: true 
    },
    { 
      icon: Linkedin, 
      text: 'LinkedIn', 
      url: 'https://linkedin.com/in/parthchandak02', 
      external: true 
    },
    { 
      icon: Mail, 
      text: 'Email', 
      url: 'mailto:parthchandak02@gmail.com', 
      external: false 
    },
    { 
      icon: Globe, 
      text: 'Website', 
      url: 'https://www.parthchandak.info', 
      external: true 
    },
    { 
      icon: FileText, 
      text: 'Resume', 
      url: 'https://tiny.cc/parthchandakresume', 
      external: true 
    },
    { 
      icon: Calendar, 
      text: 'Book Meeting', 
      url: 'https://tiny.cc/parthchandakbook', 
      external: true 
    }
  ];

  const handleLinkClick = (link) => {
    if (link.external) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = link.url;
    }
  };

  return (
    <div className={`right-sidebar glass glass-strong ${lightMode ? 'right-sidebar--light' : 'right-sidebar--dark'} ${className}`}>
      <div className="right-sidebar__links">
        {socialLinks.map((link, index) => {
          const Icon = link.icon;
          
          return (
            <button
              key={index}
              className="right-sidebar__link"
              onClick={() => handleLinkClick(link)}
              title={link.text}
            >
              <div className="right-sidebar__link-icon">
                <Icon size={18} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RightSidebar; 