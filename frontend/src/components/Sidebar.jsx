import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, BookOpen, User, LogOut } from 'lucide-react';
import api from '../utils/api';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh_token: refreshToken });
      }
    } catch (err) {
      console.error('Logout failed on server', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/', icon: <Home size={20} />, label: 'Home' },
    { path: '/calendar', icon: <CalendarDays size={20} />, label: 'Calendar' },
    { path: '/resources', icon: <BookOpen size={20} />, label: 'Resources' },
    { path: '/profile', icon: <User size={20} />, label: 'User Profile' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="nav-icon"><BookOpen size={24} /></div>
        <span className="nav-text">ClassSched</span>
      </div>
      
      <div className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon">{item.icon}</div>
            <span className="nav-text">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
        <div className="nav-item" onClick={handleLogout}>
          <div className="nav-icon"><LogOut size={20} /></div>
          <span className="nav-text">Log Out</span>
        </div>
      </div>
    </div>
  );
}
