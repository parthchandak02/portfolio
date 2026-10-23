// React import removed - not needed
import './Layout.css';

const Layout = ({ children, darkMode = false, leftSidebar, rightSidebar }) => {
  // Removed sidebar balancing - functionality was unused
  return (
    <div className={`layout ${darkMode ? 'layout--dark' : 'layout--light'}`}>
      {/* Left sidebar container */}
      {leftSidebar && (
        <div className="layout__left-sidebar">
          {leftSidebar}
        </div>
      )}
      
      {/* Right sidebar container */}
      {rightSidebar && (
        <div className="layout__right-sidebar">
          {rightSidebar}
        </div>
      )}
      
      {/* Main content */}
      {children}
    </div>
  );
};

export default Layout; 