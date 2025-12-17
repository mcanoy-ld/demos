import React, { useState } from 'react';

interface HamburgerMenuProps {
  onNavigate: (module: string) => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleNavigation = (module: string) => {
    onNavigate(module);
    closeMenu();
  };

  return (
    <div className="hamburger-menu">
      <button className="hamburger-button" onClick={toggleMenu}>
        ☰
      </button>
      <div className={`menu-dropdown ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-item" onClick={() => handleNavigation('main')}>Home</div>
        <div className="menu-item" onClick={() => handleNavigation('settings')}>Settings</div>
        <div className="menu-item" onClick={() => handleNavigation('profile')}>Pipelines</div>
        <div className="menu-item" onClick={() => handleNavigation('help')}>Help</div>
      </div>
    </div>
  );
};

export default HamburgerMenu; 