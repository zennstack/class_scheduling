import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Layers, User, Users } from 'lucide-react';
import api from '../utils/api';

const MobileNav = () => {
  const [isStaff, setIsStaff] = React.useState(false);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile/');
        setIsStaff(response.data.is_staff);
      } catch (err) {
        console.error('Failed to load user profile in mobile nav', err);
      }
    };
    fetchProfile();
  }, []);

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
      {isStaff && (
        <NavLink to="/sections" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <Users size={24} />
          <span>Sections</span>
        </NavLink>
      )}
      <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
        <User size={24} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};

export default MobileNav;
