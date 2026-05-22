import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, BookOpen, User, LogOut, Users } from 'lucide-react';
import api from '../utils/api';

export default function Sidebar() {
  const navigate = useNavigate();
  const [isStaff, setIsStaff] = React.useState(false);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile/');
        setIsStaff(response.data.is_staff);
      } catch (err) {
        console.error('Failed to load user profile in sidebar', err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = sessionStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh_token: refreshToken });
      }
    } catch (err) {
      console.error('Logout failed on server', err);
    } finally {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/manage', icon: <CalendarDays size={20} />, label: 'Scheduling Hub' },
    { path: '/resources', icon: <BookOpen size={20} />, label: 'Resources' },
    ...(isStaff ? [{ path: '/sections', icon: <Users size={20} />, label: 'Sections' }] : []),
    { path: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="nav-icon">
          <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
        </div>
        <span className="nav-text">PlanClass</span>
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
