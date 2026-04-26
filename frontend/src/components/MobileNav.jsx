import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Layers, User } from 'lucide-react';

const MobileNav = () => {
  return (
    <nav className="mobile-nav">
      <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/manage" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <Calendar size={24} />
        <span>Hub</span>
      </NavLink>
      <NavLink to="/resources" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <Layers size={24} />
        <span>Resources</span>
      </NavLink>


      <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <User size={24} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;
