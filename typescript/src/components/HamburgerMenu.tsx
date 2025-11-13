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
        <a href="#" className="menu-item" onClick={() => handleNavigation('settings')}>Settings</a>
        <a href="#" className="menu-item" onClick={() => handleNavigation('profile')}>Pipelines</a>
        <a href="#" className="menu-item" onClick={() => handleNavigation('help')}>Help</a>
      </div>
    </div>
  );
};

export default HamburgerMenu; 